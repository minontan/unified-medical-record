import { computeItemFlags } from "@/lib/audit";
import { AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";

const FIELDS = [
  ["drug_code", "Drug Code"],
  ["drug_name", "Medicine"],
  ["route", "Route"],
  ["dose", "Dose"],
  ["dosage_form", "Form"],
  ["frequency", "Frequency"],
  ["duration", "Duration"],
  ["quantity", "Qty"],
  ["uom", "UOM"],
];

export default function MedicationTable({ items, editable = false, onChange, onRemove }) {
  if (!items) return <p className="text-sm text-muted-foreground py-3">Loading medication rows…</p>;
  if (items.length === 0) return <p className="text-sm text-muted-foreground py-3">No medication rows.</p>;


  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/60 text-left text-muted-foreground">
            <th className="px-2 py-2 w-8">#</th>
            {FIELDS.map(([, label]) => (
              <th key={label} className="px-2 py-2 whitespace-nowrap font-medium">
                {label}
              </th>
            ))}
            <th className="px-2 py-2 font-medium">Validation</th>
            {editable && onRemove && <th className="px-2 py-2 w-8"></th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const flags = computeItemFlags(item);
            return (
              <tr key={item.id || i} className={`border-b last:border-0 ${flags.length ? "bg-amber-50/70" : ""}`}>
                <td className="px-2 py-1.5 align-top">{i + 1}</td>
                {FIELDS.map(([key, label]) => (
                  <td key={key} className={`px-1.5 py-1.5 align-top ${editable && key === "drug_name" ? "min-w-[240px]" : ""}`}>
                    {editable && key === "drug_name" ? (
                      <textarea
                        aria-label={label}
                        className="w-full min-w-[220px] border rounded px-1.5 py-1 bg-background text-foreground"
                        rows={2}
                        spellCheck={false}
                        value={item[key] || ""}
                        onChange={(e) => onChange(i, key, e.target.value)}
                      />
                    ) : editable ? (
                      <input
                        aria-label={label}
                        className="w-24 min-w-[70px] border rounded px-1.5 py-1"
                        value={item[key] || ""}
                        onChange={(e) => onChange(i, key, e.target.value)}
                      />
                    ) : item[key] ? (
                      <span className="whitespace-pre-wrap">{item[key]}</span>
                    ) : (
                      <span className="text-destructive font-semibold">—</span>
                    )}
                  </td>
                ))}

                <td className="px-2 py-1.5 align-top min-w-[150px]">
                  {flags.length ? (
                    <span className="flex items-start gap-1 text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{flags.join("; ")}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> OK
                    </span>
                  )}
                </td>
                {editable && onRemove && (
                  <td className="px-2 py-1.5 align-top">
                    <button aria-label="Remove row" onClick={() => onRemove(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}