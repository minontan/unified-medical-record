import { formatPrescriptionDate } from "@/lib/prescriptionDates";

export default function PrescriptionDateFormatSelect({ value, onChange, date, disabled }) {
  return <div className="space-y-1">
    <label htmlFor="prescription-date-format" className="text-xs text-muted-foreground">Prescription date format (SGT)</label>
    <select id="prescription-date-format" className="block h-9 w-full max-w-xs rounded border bg-background px-2 text-sm text-foreground" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
      <option value="slashes">DD/MM/YYYY (default)</option>
      <option value="ddmmyyyy">DDMMYYYY</option>
      <option value="dots">DD.MM.YYYY</option>
    </select>
    <p className="text-xs text-muted-foreground">Word and print: {formatPrescriptionDate(date, value)} · Singapore time (UTC+8)</p>
  </div>;
}