import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MedicationTable from "@/components/prescriptions/MedicationTable";
import { createPrescriptionFromIntake, hashString } from "@/lib/intake";
import { Plus } from "lucide-react";
import LocationField from "@/components/intake/LocationField";
import { singaporeToday } from "@/lib/prescriptionDates";

const EMPTY_MED = () => ({
  drug_code: "",
  drug_name: "",
  route: "",
  dose: "",
  dosage_form: "",
  frequency: "",
  duration: "",
  quantity: "",
  uom: "",
  source_raw: {},
});

export default function StructuredIntake({ role, onCreated }) {
  const [header, setHeader] = useState({
    pso_number: "",
    resident_name: "",
    identifier: "",
    prescription_date: singaporeToday(),
    remarks: "",
    facility: "",
    ward: "",
    bed: "",
  });
  const [meds, setMeds] = useState([EMPTY_MED()]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const updateMed = (i, key, value) => {
    setMeds((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: value };
      return next;
    });
  };
  const addMed = () => setMeds((prev) => [...prev, EMPTY_MED()]);
  const removeMed = (i) => setMeds((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    setError("");
    const filled = meds.filter((m) => (m.drug_name || "").trim());
    if (!header.resident_name.trim()) {
      setError("Resident name is required.");
      return;
    }
    if (filled.length === 0) {
      setError("At least one medication row with a medicine name is required.");
      return;
    }
    setBusy(true);
    try {
      const source_hash = await hashString(JSON.stringify({ header, meds: filled }));
      const { prescription } = await createPrescriptionFromIntake({
        data: { source_type: "online_form", file_url: "", source_hash, header, medications: filled, extracted_data: {} },
        role,
      });
      onCreated(prescription);
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
    <div className="border rounded-lg bg-card p-4 space-y-4">
      <p className="text-xs text-muted-foreground">
        Structured entries are validated at submission and autofill the draft prescription directly. Values are retained
        with an immutable source hash. Do not enter national-ID numbers anywhere here; complete the blank patient-ID field in Word locally.
      </p>
      <div className="grid md:grid-cols-4 gap-3">
        {headerField("pso_number", "PSO number")}
        {headerField("prescription_date", "Prescription date", "date")}
        {headerField("resident_name", "Resident name")}
        {headerField("identifier", "Internal resident number (optional, not a national ID)")}
        <LocationField value={header.facility} onChange={(value) => setHeader({ ...header, facility: value })} />
        {headerField("ward", "Ward")}
        {headerField("bed", "Bed")}
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Remarks</Label>
        <Textarea rows={2} value={header.remarks} onChange={(e) => setHeader({ ...header, remarks: e.target.value })} />
      </div>
      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Medication rows</p>
          <Button variant="outline" size="sm" onClick={addMed}>
            <Plus className="h-4 w-4 mr-1" /> Add row
          </Button>
        </div>
        <MedicationTable items={meds} editable onChange={updateMed} onRemove={removeMed} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={submit} disabled={busy}>
        Create draft prescription
      </Button>
    </div>
  );
}