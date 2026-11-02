import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function ReviewPanel({ onApprove, onRequestChanges, prefillName = "" }) {
  const [pharmacist, setPharmacist] = useState("");
  const [attestation, setAttestation] = useState("");
  const [notes, setNotes] = useState("");
  const [override, setOverride] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (prefillName && !pharmacist) setPharmacist(prefillName);
  }, [prefillName]);

  const approve = async () => {
    if (!pharmacist.trim() || !attestation.trim()) {
      setError("Pharmacist name and an explicit attestation are required to approve.");
      return;
    }
    setError("");
    const res = await onApprove({ pharmacist, attestation, override });
    if (res && res.error) setError(res.error);
  };

  const request = async () => {
    if (!notes.trim()) {
      setError("Describe the changes the nurse must make.");
      return;
    }
    setError("");
    await onRequestChanges({ notes });
  };

  return (
    <div className="border rounded-lg bg-card p-4 space-y-3">
      <h3 className="font-medium text-sm">Pharmacist Review</h3>
      <p className="text-xs text-muted-foreground">
        Check every medication row against the source document shown above. Approval requires an explicit attestation.
      </p>
      <div>
        <Label className="text-xs">Pharmacist name</Label>
        <Input className="h-8" value={pharmacist} onChange={(e) => setPharmacist(e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Attestation (required to approve)</Label>
        <Select value={attestation} onValueChange={setAttestation}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an attestation…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="I have verified every medication row against the source document for this patient.">
              Verified every medication row against the source document
            </SelectItem>
            <SelectItem value="I have checked the dose, route, frequency and duration of every medication row against the source.">
              Checked dose, route, frequency and duration of every row
            </SelectItem>
            <SelectItem value="I have confirmed the resident identity and that no cross-patient data is present in this prescription.">
              Confirmed resident identity; no cross-patient data present
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Requested changes (if returning the draft)</Label>
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="override" checked={override} onCheckedChange={(v) => setOverride(!!v)} />
        <Label htmlFor="override" className="text-xs font-normal">
          Override validation flags (recorded in the audit log)
        </Label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={approve}>Approve prescription</Button>
        <Button variant="outline" onClick={request}>
          Request changes
        </Button>
      </div>
    </div>
  );
}