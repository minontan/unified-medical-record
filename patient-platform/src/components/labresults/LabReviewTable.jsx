import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { getLabStatus } from "@/lib/labStatus";

function StatusBadge({ row }) {
  const status = getLabStatus(row);
  if (status === "text") return null;
  if (status === "low") return <Badge className="bg-blue-100 text-blue-700 text-[10px]">Low</Badge>;
  if (status === "high") return <Badge className="bg-red-100 text-red-700 text-[10px]">High</Badge>;
  if (status === "norange") return <Badge className="bg-slate-100 text-slate-500 text-[10px]">No ref. range</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Normal</Badge>;
}

export default function LabReviewTable({ results, onResultsChange, onRemove }) {
  const [expanded, setExpanded] = useState({});

  const toggleCategory = (cat) => setExpanded((p) => ({ ...p, [cat]: !p[cat] }));

  // Group by category
  const grouped = results.reduce((acc, r, idx) => {
    const cat = r.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ ...r, _idx: idx });
    return acc;
  }, {});

  const updateField = (idx, field, value) => {
    const updated = results.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    onResultsChange(updated);
  };

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([cat, rows]) => (
        <div key={cat} className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            onClick={() => toggleCategory(cat)}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{cat}</span>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{rows.length}</span>
            </div>
            {expanded[cat] === false ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </button>

          {expanded[cat] !== false && (
            <div className="divide-y divide-slate-100">
              {rows.map((row) => (
                <div key={row._idx} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{row.test_name}</p>
                    {row.reference_range_text && (
                      <p className="text-[10px] text-slate-400">Ref: {row.reference_range_text}</p>
                    )}
                    {(row.reference_range_low != null || row.reference_range_high != null) && !row.reference_range_text && (
                      <p className="text-[10px] text-slate-400">
                        Ref: {row.reference_range_low ?? "—"} – {row.reference_range_high ?? "—"}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {row.text_result ? (
                      <span className="text-xs font-medium text-slate-700">{row.text_result}</span>
                    ) : (
                      <Input
                        type="number"
                        value={row.numeric_result ?? ""}
                        onChange={(e) => updateField(row._idx, "numeric_result", parseFloat(e.target.value))}
                        className="w-20 h-7 text-xs text-center rounded-lg border-slate-200"
                      />
                    )}
                    {row.unit && <span className="text-[10px] text-slate-400 w-14 truncate">{row.unit}</span>}
                    <StatusBadge row={row} />
                    <button onClick={() => onRemove(row._idx)} className="p-1 text-slate-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}