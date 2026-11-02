import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { buildPrescriptionDocx } from '../../shared/prescriptionDocx.ts';
import { DATE_FORMATS } from '../../shared/prescriptionDates.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { prescription_id, location, date_format = 'slashes' } = await req.json();
    if (typeof date_format !== 'string' || !Object.hasOwn(DATE_FORMATS, date_format)) return Response.json({ error: 'Choose DDMMYYYY, DD/MM/YYYY or DD.MM.YYYY.' }, { status: 400 });
    if (typeof prescription_id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(prescription_id)) return Response.json({ error: 'A valid prescription is required' }, { status: 400 });
    let prescription = await base44.entities.Prescription.get(prescription_id);
    if (!prescription) return Response.json({ error: 'Prescription not found' }, { status: 404 });
    if (!['approved', 'printed', 'signed', 'transmitted'].includes(prescription.status)) return Response.json({ error: 'Pharmacist approval is required before generating the final Word document.' }, { status: 409 });
    const filename = `Prescription-${prescription.id}-v${prescription.version}-layout7-${date_format}.docx`;
    let fileUri = prescription.docx_version === prescription.version && prescription.docx_file_uri?.endsWith(filename) ? prescription.docx_file_uri : '';
    if (!fileUri) {
      if (user.role !== 'admin' && prescription.created_by_id !== user.id) return Response.json({ error: 'The intake creator or a pharmacist must generate the first Word copy. Saved copies remain available to staff.' }, { status: 403 });
      const name = prescription.facility_address ? prescription.facility : (location || prescription.facility);
      if (typeof name !== 'string' || name.length > 100) return Response.json({ error: 'Choose a location.' }, { status: 400 });
      const locations = await base44.entities.FacilityLocation.filter({ name }, 'name', 1);
      const address = prescription.facility_address || locations[0]?.address;
      if (!address) return Response.json({ error: 'Choose one of the five locations before generating the document.' }, { status: 400 });
      prescription = { ...prescription, facility: name, facility_address: address };
      const resident = await base44.entities.Resident.get(prescription.resident_id);
      if (!resident) return Response.json({ error: 'Resident not found' }, { status: 404 });
      const items = await base44.entities.PrescriptionItem.filter({ prescription_id }, 'created_date', 201);
      if (!items.length || items.length > 200) return Response.json({ error: 'A Word prescription must contain between 1 and 200 medication rows.' }, { status: 400 });
      const bytes = await buildPrescriptionDocx(prescription, resident, items, date_format);
      const uploaded = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file: new File([bytes], filename, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }) });
      fileUri = uploaded.file_uri;
      await base44.entities.Prescription.update(prescription_id, { facility: name, facility_address: address, docx_file_uri: fileUri, docx_version: prescription.version, docx_generated_at: new Date().toISOString() });
      await base44.entities.AuditLog.create({ trace_id: prescription.trace_id, entity_type: 'Prescription', entity_id: prescription_id, action: 'word_document_generated', actor_name: user.full_name || user.email, actor_role: user.role === 'admin' ? 'pharmacist' : 'nurse', version: prescription.version, details: 'Saved private Word copy with blank patient-ID field for local completion.' });
    }
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 300 });
    return Response.json({ download_url: signed_url, filename });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}