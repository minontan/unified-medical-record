import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MedicationTable from "@/components/prescriptions/MedicationTable";
import { createPrescriptionFromVerifiedIntake, medicationFromExtract } from "@/lib/intake";
import { logAudit, makeTraceId } from "@/lib/audit";
import LocationField from "@/components/intake/LocationField";
import { containsNationalId } from "@/lib/residentIdentity";
import { singaporeToday } from "@/lib/prescriptionDates";

export default function QuarantineResolve({ intake, role, onResolved }) {
  const ex = intake.extracted_data || {};
  const [header, setHeader] = useState({
    pso_number: intake.pso_number || ex.pso_number || "",
    resident_name: intake.resident_name_detected || ex.resident_name || "",
    identifier: containsNationalId(intake.resident_id_detected) ? "" : (intake.resident_id_detected || ""),
    created_on: intake.created_on || ex.created_on || "",
    prescription_date: singaporeToday(),
    remarks: "",
    facility: "",
    ward: "",
    bed: "",
  });
  const [meds, setMeds] = useState(() =>
    (ex.medications ||
      (ex.patient_sections && ex.patient_sections[0] && ex.patient_sections[0].medications) ||
      []
    ).map((m) => medicationFromExtract(m))
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const updateMed = (i, key, value) => {
    setMeds((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: value };
      return next;
    });
  };
  const removeMed = (i) => setMeds((prev) => prev.filter((_, idx) => idx !== i));

  const resolve = async () => {
    if (!header.resident_name.trim()) {
      setError("Resident name is required to resolve.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const traceId = intake.trace_id || makeTraceId();
      await logAudit({
        traceId,
        entityType: "IntakeDocument",
        entityId: intake.id,
        action: "quarantine_resolved",
        details: "Patient identity verified — proceeding to draft creation",
        role,
      });
      const prescription = await createPrescriptionFromVerifiedIntake(intake, {
        traceId,
        header,
        medications: meds,
        role,
      });
      onResolved(prescription);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  const headerField = (key, label, type = "text") => (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={type}
        className="h-8 text-sm"
        value={header[key] || ""}
        onChange={(e) => setHeader({ ...header, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Confirm the single patient for this document. Never merge fields or medication rows across patients — the
        quarantine can only be resolved for one resident.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {headerField("pso_number", "PSO number")}
        {headerField("prescription_date", "Prescription date", "date")}
        {headerField("resident_name", "Resident name")}
        {headerField("identifier", "Internal resident number (optional, not a national ID)")}
      </div>
      <div className="grid grid-cols-3 gap-3 border-t pt-3">
        <LocationField value={header.facility} onChange={(value) => setHeader({ ...header, facility: value })} />
        {headerField("ward", "Ward")}
        {headerField("bed", "Bed")}
      </div>
      <div className="border-t pt-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">Medication rows</p>
        <MedicationTable items={meds} editable onChange={updateMed} onRemove={removeMed} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={resolve} disabled={busy}>
        Create draft & mark verified
      </Button>
    </div>
  );
}