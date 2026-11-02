import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { intake_id } = await req.json();
    if (typeof intake_id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(intake_id)) return Response.json({ error: 'A valid intake is required' }, { status: 400 });
    const intake = await base44.entities.IntakeDocument.get(intake_id);
    if (!intake) return Response.json({ error: 'Source not found' }, { status: 404 });
    if (!intake.file_uri) return Response.json({ url: intake.file_url || '', file_type: intake.file_type || '' });
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: intake.file_uri, expires_in: 300 });
    return Response.json({ url: signed_url, file_type: intake.file_type || '' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}