import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_uri } = await req.json();
    if (!file_uri) {
      return Response.json({ error: 'file_uri is required' }, { status: 400 });
    }

    // Authorization: verify the user owns the file or is an authorized caregiver
    // with read access to the patient's records.
    const fileInRecords = (labs, docs) =>
      labs.some(r => r.source_file_url === file_uri || (r.source_file_urls || []).includes(file_uri)) ||
      docs.some(d => d.file_uri === file_uri);

    // 1. Check the user's own records
    const [ownLabs, ownDocs] = await Promise.all([
      base44.entities.LabResult.filter({ created_by: user.email }, '-created_date', 500),
      base44.entities.MedicalDocument.filter({ created_by: user.email }, '-created_date', 500),
    ]);

    let authorized = fileInRecords(ownLabs, ownDocs);

    // 2. If not the owner, check caregiver access for each accepted connection
    if (!authorized) {
      const connections = await base44.entities.Connection.filter(
        { relationship: 'caregiver', status: 'accepted' },
        '-created_date',
        500
      );
      const caregiverConns = connections.filter(c =>
        c.caregiver_email === user.email || c.friend_email === user.email
      );

      for (const conn of caregiverConns) {
        const permissions = conn.caregiver_permissions || [];
        if (!permissions.includes('lab_results_read') && !permissions.includes('medical_documents_read')) continue;
        const patientEmail = conn.patient_email || conn.user_email;
        if (!patientEmail) continue;
        // Provenance check (H2 fix): the patient must have initiated this connection
        // (user_email === patient). Prevents a caregiver from self-declaring access to an
        // arbitrary patient's private files.
        if (conn.user_email !== patientEmail) continue;

        const [patientLabs, patientDocs] = await Promise.all([
          base44.asServiceRole.entities.LabResult.filter({ created_by: patientEmail }, '-created_date', 500),
          base44.asServiceRole.entities.MedicalDocument.filter({ created_by: patientEmail }, '-created_date', 500),
        ]);

        if (fileInRecords(patientLabs, patientDocs)) {
          authorized = true;
          break;
        }
      }
    }

    if (!authorized) {
      return Response.json({ error: 'Access denied: you do not own this file and no authorized caregiver access was found' }, { status: 403 });
    }

    // Generate a signed URL that expires in 5 minutes (300 seconds)
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri,
      expires_in: 300,
    });

    return Response.json({ signed_url });
  } catch (error) {
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});