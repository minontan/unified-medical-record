import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caregiver = await base44.auth.me();
    if (!caregiver) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (_) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { patient_email, data_type } = body;

    if (!patient_email || !data_type) {
      return Response.json({ error: 'Missing patient_email or data_type' }, { status: 400 });
    }

    // Use user-scoped client — Connection RLS allows caregiver (friend_email) to read their connections
    const allConnections = await base44.entities.Connection.filter(
      { relationship: 'caregiver', status: 'accepted' },
      '-created_date',
      500
    );

    const conn = allConnections.find(c => {
      const callerIsCaregiver = c.caregiver_email === caregiver.email || c.friend_email === caregiver.email;
      const patientIsTarget = c.patient_email === patient_email || c.user_email === patient_email;
      // Provenance check (H2 fix): the connection must have been initiated by the patient
      // (user_email === patient). In the legitimate flow the patient invites
      // (CaregiverAccess.jsx handleInvite sets user_email = patient), so this blocks forged
      // self-declared 'accepted' caregiver connections while preserving real ones.
      const patientInitiated = c.user_email === patient_email;
      return callerIsCaregiver && patientIsTarget && patientInitiated;
    });

    if (!conn) {
      return Response.json({ error: 'No active caregiver relationship found' }, { status: 403 });
    }

    const permissions = conn.caregiver_permissions || [];
    const permissionMap = {
      lab_results: 'lab_results_read',
      medical_documents: 'medical_documents_read',
      measurements: 'measurements_read',
      medications: 'medications_read',
      appointments: 'appointments_read',
      womens_health: 'womens_health_read',
      msk: 'msk_read',
    };

    const requiredPerm = permissionMap[data_type];
    if (!requiredPerm || !permissions.includes(requiredPerm)) {
      return Response.json({ error: `Permission denied: need ${requiredPerm}` }, { status: 403 });
    }

    const entityMap = {
      lab_results: { entity: 'LabResult', sort: '-collected_at', limit: 500 },
      medical_documents: { entity: 'MedicalDocument', sort: '-report_date', limit: 300 },
      measurements: { entity: 'HealthMeasurement', sort: '-measured_at', limit: 300 },
      medications: { entity: 'Medication', sort: '-created_date', limit: 200 },
      appointments: { entity: 'Appointment', sort: '-appointment_date', limit: 100 },
      womens_health: { entity: 'WomensHealthLog', sort: '-created_date', limit: 200 },
      msk: { entity: 'MusculoskeletalAssessment', sort: '-assessed_at', limit: 100 },
    };

    const { entity, sort, limit } = entityMap[data_type];

    const data = await base44.asServiceRole.entities[entity].filter(
      { created_by: patient_email },
      sort,
      limit
    );

    return Response.json({ data, permissions });
  } catch (error) {
    console.error('Error:', error.message, error.stack);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});