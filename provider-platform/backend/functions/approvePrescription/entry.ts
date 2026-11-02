import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Pharmacist approval — the only path to the 'approved' status. Verifies the
// caller's server-assigned account role (platform admins are the pharmacist
// accounts) and writes the audit entry with the server-verified identity.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Only pharmacist accounts can approve prescriptions.' }, { status: 403 });
    }

    const body = await req.json();
    const prescriptionId = typeof body.prescription_id === 'string' ? body.prescription_id : '';
    const pharmacistName = typeof body.pharmacist_name === 'string' ? body.pharmacist_name.trim() : '';
    const attestation = typeof body.attestation === 'string' ? body.attestation.trim() : '';
    const flaggedCount = Number.isInteger(body.flagged_count) ? body.flagged_count : 0;
    if (!prescriptionId || !pharmacistName || !attestation) {
      return Response.json(
        { error: 'prescription_id, pharmacist_name and attestation are required' },
        { status: 400 }
      );
    }

    const prescription = await base44.entities.Prescription.get(prescriptionId).catch(() => null);
    if (!prescription) return Response.json({ error: 'Prescription not found' }, { status: 404 });
    if (prescription.status !== 'in_review') {
      return Response.json({ error: 'Only prescriptions in pharmacist review can be approved' }, { status: 400 });
    }

    await base44.entities.Prescription.update(prescriptionId, {
      status: 'approved',
      pharmacist_name: pharmacistName,
      attestation,
    });
    await base44.entities.AuditLog.create({
      trace_id: prescription.trace_id,
      entity_type: 'Prescription',
      entity_id: prescriptionId,
      action: 'pharmacist_approved',
      actor_name: user.full_name || user.email || 'Pharmacist',
      actor_role: 'pharmacist',
      details:
        'Checked every medication row against the source. Attestation: ' + attestation +
        (flaggedCount > 0 ? ' — OVERRIDE: approved with ' + flaggedCount + ' flagged row(s).' : ''),
      version: prescription.version,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}