import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2 } from "lucide-react";
import MedicationTable from "@/components/prescriptions/MedicationTable";
import LocationField from "@/components/intake/LocationField";

export default function SectionPanel({
  section,
  index,
  total,
  busy,
  onChangeHeader,
  onChangeMed,
  onRemoveMed,
  onCreate,
}) {
  const header = section.header;
  const ready = header.resident_name.trim() && section.meds.length > 0;

  const field = (key, label, type = "text") => (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={type}
        className="h-8 text-sm"
        value={header[key] || ""}
        onChange={(e) => onChangeHeader(key, e.target.value)}
      />
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">
        {total > 1
          ? `Patient section ${index + 1} of ${total} — this is one patient only. Never merge rows across sections.`
          : "Extracted fields — human verification required"}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {field("pso_number", "PSO number")}
        {field("prescription_date", "Prescription date", "date")}
        {field("resident_name", "Resident name (masked — enter from source)")}
        {field("identifier", "Internal resident number (optional, not a national ID)")}
        {field("date_of_birth", "DOB")}
        {field("gender", "Gender")}
        <div className="col-span-2">{field("drug_allergy", "Drug allergy")}</div>
      </div>
      <div className="border-t pt-3 grid grid-cols-3 gap-3">
        <p className="col-span-3 text-[11px] text-muted-foreground">
          Facility, ward and bed are not in the Infocare source — enter them from the authorised master record.
        </p>
        <LocationField value={header.facility} onChange={(value) => onChangeHeader("facility", value)} />
        {field("ward", "Ward")}
        {field("bed", "Bed")}
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Remarks</Label>
        <Textarea rows={2} value={header.remarks || ""} onChange={(e) => onChangeHeader("remarks", e.target.value)} />
      </div>
      <div className="border-t pt-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Medication names are plain text transcribed from the source — no glossary matching or automatic
          substitutions. Verify the text against the source. Enter either duration or quantity; both are not required.
        </p>
        <MedicationTable items={section.meds} editable onChange={onChangeMed} onRemove={onRemoveMed} />
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {section.created ? (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Draft created{" "}
            <Link className="underline" to={`/prescriptions/${section.prescriptionId}`}>
              — open
            </Link>
          </p>
        ) : (
          <Button onClick={() => onCreate(index)} disabled={!ready || !!busy}>
            Create draft prescription{total > 1 ? ` (section ${index + 1})` : ""}
          </Button>
        )}
        {!section.created && !ready && (
          <span className="text-xs text-muted-foreground">
            Resident name and at least one medication row are required.
          </span>
        )}
      </div>
    </div>
  );
}