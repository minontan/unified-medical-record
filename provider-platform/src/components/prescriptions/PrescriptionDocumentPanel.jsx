import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import LocationField from "@/components/intake/LocationField";
import { Download, Printer } from "lucide-react";
import PrescriptionDateFormatSelect from "@/components/prescriptions/PrescriptionDateFormatSelect";

export default function PrescriptionDocumentPanel({ prescription, onPrint, onUpdated, dateFormat, onDateFormatChange }) {
  const [location, setLocation] = useState(prescription.facility || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const retrieve = async () => {
    setBusy(true); setError("");
    try {
      const { data } = await base44.functions.invoke("prescriptionDocument", { prescription_id: prescription.id, location, date_format: dateFormat });
      const response = await fetch(data.download_url);
      if (!response.ok) throw new Error("Could not download Word document. Please try again.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = data.filename;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      await onUpdated();
    } catch (err) { setError(err.response?.data?.error || err.message); }
    finally { setBusy(false); }
  };
  return <section className="border rounded-lg bg-card p-4 space-y-3">
    <h3 className="font-medium text-sm">Prescription document</h3>
    <p className="text-sm text-muted-foreground">Download an editable Word copy. The patient-ID field is left blank: fill it in locally and do not upload the completed copy.</p>
    {!prescription.facility_address && <><LocationField value={location} onChange={setLocation} disabled={busy} /><p className="text-xs text-muted-foreground">Choose the location and generate Word once to save its address before printing.</p></>}
    {prescription.facility_address && <p className="text-sm">{prescription.facility} — {prescription.facility_address}</p>}
    <PrescriptionDateFormatSelect value={dateFormat} onChange={onDateFormatChange} date={prescription.prescription_date} disabled={busy} />
    <div className="flex flex-wrap gap-2">
      <Button onClick={retrieve} disabled={busy}><Download className="h-4 w-4" />{busy ? "Preparing Word…" : prescription.docx_file_uri?.endsWith(`-layout4-${dateFormat}.docx`) ? "Download saved Word (.docx)" : "Generate & download Word (.docx)"}</Button>
      {["approved", "printed"].includes(prescription.status) && <Button variant="outline" onClick={onPrint} disabled={busy || !prescription.facility_address}><Printer className="h-4 w-4" />Print prescription</Button>}
    </div>
    <p className="text-xs text-muted-foreground">The generated Word copy stays available here, including after printing. DOCX has no browser URL/date headers; for browser printing, turn off “Headers and footers” in print settings.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}