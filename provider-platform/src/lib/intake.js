import { base44 } from "@/api/base44Client";
import { makeTraceId, logAudit, computeItemFlags } from "@/lib/audit";
import { containsNationalId, validateInternalIdentity } from "@/lib/residentIdentity";
import { singaporeToday } from "@/lib/prescriptionDates";

async function sha256(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashFile(file) {
  return sha256(await file.arrayBuffer());
}

export async function hashString(text) {
  return sha256(new TextEncoder().encode(text));
}

export function medicationFromExtract(m = {}) {
  return {
    drug_code: m.drug_code || "",
    drug_name: m.drug_name || "",
    route: m.route || "",
    dose: m.dosage || "",
    dosage_form: m.dosage_form || "",
    frequency: m.frequency || "",
    duration: m.duration || "",
    quantity: m.quantity || "",
    uom: m.uom || "",
    source_raw: m,
    flags: [],
  };
}

async function upsertResident(header) {
  const identifier = String(header.identifier || "").trim();
  // Never match different residents by an empty number or by name alone.
  if (identifier) {
    const existing = await base44.entities.Resident.filter({ identifier });
    if (existing && existing.length > 0) return existing[0];
  }
  return base44.entities.Resident.create({
    name: header.resident_name,
    identifier,
    facility: header.facility || "",
    ward: header.ward || "",
    bed: header.bed || "",
  });
}

export async function createPrescriptionFromVerifiedIntake(intake, { traceId, header, medications, role }) {
  validateInternalIdentity(header);
  const locations = await base44.entities.FacilityLocation.filter({ name: header.facility }, "name", 1);
  if (!locations.length) throw new Error("Choose a location for the prescription address.");
  const resident = await upsertResident(header);
  await base44.entities.IntakeDocument.update(intake.id, { resident_id: resident.id, status: "verified" });

  const prescription = await base44.entities.Prescription.create({
    resident_id: resident.id,
    trace_id: traceId,
    pso_number: header.pso_number || "",
    status: "draft",
    version: 1,
    prescription_date: header.prescription_date || singaporeToday(),
    facility: locations[0].name,
    facility_address: locations[0].address,
    ward: header.ward || resident.ward || "",
    bed: header.bed || resident.bed || "",
    date_of_birth: header.date_of_birth || "",
    gender: header.gender || "",
    drug_allergy: header.drug_allergy || "",
    intake_id: intake.id,
    print_count: 0,
  });
  await logAudit({
    traceId,
    entityType: "Prescription",
    entityId: prescription.id,
    action: "draft_created",
    details: `${medications.length} medication row(s) from ${intake.source_type}`,
    role,
  });

  if (medications.length > 0) {
    await base44.entities.PrescriptionItem.bulkCreate(
      medications.map((m) => ({
        prescription_id: prescription.id,
        drug_code: m.drug_code || "",
        drug_name: m.drug_name || "",
        route: m.route || "",
        dose: m.dose || "",
        dosage_form: m.dosage_form || "",
        frequency: m.frequency || "",
        duration: m.duration || "",
        quantity: m.quantity || "",
        uom: m.uom || "",
        source_raw: m.source_raw || {},
        flags: computeItemFlags(m),
      }))
    );
    await logAudit({
      traceId,
      entityType: "PrescriptionItem",
      entityId: prescription.id,
      action: "medication_rows_imported",
      details: `${medications.length} row(s) imported`,
      role,
    });
  }
  return prescription;
}

export async function createPrescriptionFromIntake({ data, role, quarantine = false, quarantineReason = "" }) {
  if (!quarantine) validateInternalIdentity(data.header);
  if (containsNationalId(JSON.stringify(data)) || containsNationalId(quarantineReason)) throw new Error("Remove national-ID numbers from the entered text before saving. Use only an internal resident number.");
  if (!quarantine && !data.header.facility) throw new Error("Choose a location for the prescription address.");
  const traceId = makeTraceId();
  const intake = await base44.entities.IntakeDocument.create({
    source_type: data.source_type,
    file_url: data.file_url || "",
    file_uri: data.file_uri || "",
    file_type: data.file_type || "",
    source_hash: data.source_hash || "",
    status: quarantine ? "quarantined" : "verified",
    pso_number: data.header.pso_number || "",
    resident_name_detected: data.header.resident_name || "",
    resident_id_detected: data.header.identifier || "",
    created_on: data.header.created_on || "",
    remarks: quarantine ? quarantineReason : data.header.remarks || "",
    extracted_data: data.extracted_data || {},
    trace_id: traceId,
  });
  await logAudit({
    traceId,
    entityType: "IntakeDocument",
    entityId: intake.id,
    action: quarantine ? "intake_quarantined" : "intake_uploaded",
    details: quarantine ? `Quarantined: ${quarantineReason}` : `Source: ${data.source_type}`,
    role,
  });
  if (quarantine) return { traceId, intake };

  const prescription = await createPrescriptionFromVerifiedIntake(intake, {
    traceId,
    header: data.header,
    medications: data.medications,
    role,
  });
  return { traceId, intake, prescription };
}