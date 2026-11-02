import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Trash2, ChevronDown, ChevronUp, FlaskConical, Pencil, Check, X, BellOff, Info, FileDown } from "lucide-react";
import { format } from "date-fns";
import { getLabStatus } from "@/lib/labStatus";

// Physiological measurements that labs sometimes include — these don't have reference ranges in the traditional sense
const PHYSIOLOGICAL_TERMS = [
  "blood pressure", "systolic", "diastolic", "bp",
  "heart rate", "pulse rate", "hr", "pr",
  "respiratory rate", "rr", "respiration",
  "temperature", "temp", "spo2", "oxygen saturation",
  "weight", "height", "bmi", "body mass index",
  "waist circumference", "hip circumference",
];

function isPhysiological(testName) {
  if (!testName) return false;
  const lower = testName.toLowerCase();
  return PHYSIOLOGICAL_TERMS.some((term) => lower.includes(term));
}

function isSilenced(item) {
  return item.notes && item.notes.includes("[SILENCED]");
}

function StatusBadge({ row }) {
  if (row.text_result) {
    const lower = row.text_result.toLowerCase();
    if (lower.includes("nonreactive") || lower.includes("negative") || lower.includes("normal") || lower.includes("immune")) {
      return <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">{row.text_result}</Badge>;
    }
    if (lower.includes("reactive") || lower.includes("positive") || lower.includes("abnormal")) {
      return <Badge className="bg-red-100 text-red-700 text-[10px]">{row.text_result}</Badge>;
    }
    return <Badge className="bg-slate-100 text-slate-600 text-[10px]">{row.text_result}</Badge>;
  }
  const status = getLabStatus(row);
  if (status === "text") return null;
  if (status === "low") return <Badge className="bg-sky-100 text-sky-700 text-[10px]">Below range</Badge>;
  if (status === "high") return <Badge className="bg-amber-100 text-amber-700 text-[10px]">Above range</Badge>;
  if (status === "norange") return <Badge className="bg-slate-100 text-slate-500 text-[10px]">No ref. range</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Within range</Badge>;
}

function SilenceButton({ item, onToggle }) {
  const silenced = isSilenced(item);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(item); }}
      title={silenced ? "Un-silence this result" : "Silence / ignore this result"}
      className={`p-1 rounded-lg transition-colors ${
        silenced
          ? "text-amber-500 bg-amber-100 hover:bg-amber-200"
          : "text-slate-300 hover:text-amber-500 hover:bg-amber-50"
      }`}
    >
      {silenced ? <BellOff className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
    </button>
  );
}

export default function LabHistoryList({ results, onDelete, onDateChange, onResultsUpdate }) {
  const [expanded, setExpanded] = useState({});
  const [editingDate, setEditingDate] = useState(null);
  const [editDateValue, setEditDateValue] = useState("");
  const [filterAbnormal, setFilterAbnormal] = useState({});
  const [silencing, setSilencing] = useState({}); // item.id → loading

  const startEditDate = (e, key, currentDate) => {
    e.stopPropagation();
    setEditingDate(key);
    setEditDateValue(currentDate ? currentDate.slice(0, 10) : "");
  };

  const saveDate = async (e, items) => {
    e.stopPropagation();
    if (!editDateValue) return;
    const newDateTime = editDateValue + "T07:00:00";
    await Promise.all(items.map((item) => base44.entities.LabResult.update(item.id, { collected_at: newDateTime })));
    setEditingDate(null);
    if (onDateChange) onDateChange();
  };

  const cancelEdit = (e) => {
    e.stopPropagation();
    setEditingDate(null);
  };

  const toggleSilence = async (item) => {
    setSilencing((p) => ({ ...p, [item.id]: true }));
    const wasSilenced = isSilenced(item);
    const currentNotes = item.notes || "";
    const newNotes = wasSilenced
      ? currentNotes.replace("[SILENCED]", "").trim()
      : ("[SILENCED] " + currentNotes).trim();
    await base44.entities.LabResult.update(item.id, { notes: newNotes });
    setSilencing((p) => ({ ...p, [item.id]: false }));
    // Update the item locally in parent state without a full reload (preserves filter state)
    if (onResultsUpdate) onResultsUpdate(item.id, newNotes);
  };

  if (!results.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <FlaskConical className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600">No lab results yet</p>
        <p className="text-xs text-slate-400 mt-1">Upload a PDF or photo of your blood test report to get started</p>
      </div>
    );
  }

  // Group by report (lab_report_id + collected_at)
  const grouped = results.reduce((acc, r) => {
    const key = `${r.lab_report_id || "unknown"}_${r.collected_at}`;
    if (!acc[key]) acc[key] = { meta: r, items: [] };
    acc[key].items.push(r);
    return acc;
  }, {});

  const toggleReport = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const handleViewOriginal = (e, key, fileUrl) => {
    e.stopPropagation();
    if (fileUrl) {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([key, { meta, items }]) => {
        const isOpen = expanded[key] !== false;
        const categories = [...new Set(items.map((i) => i.category || "Other"))];

        // Exclude silenced items from counts
        const activeItems = items.filter((i) => !isSilenced(i));
        const silencedCount = items.length - activeItems.length;

        const abnormalCount = activeItems.filter((i) => ["low", "high"].includes(getLabStatus(i))).length;

        const noRangeCount = activeItems.filter((i) =>
          i.numeric_result != null &&
          i.reference_range_low == null &&
          i.reference_range_high == null
        ).length;

        // Detect if any no-ref-range items look physiological
        const physioNoRange = activeItems.filter((i) =>
          i.numeric_result != null &&
          i.reference_range_low == null &&
          i.reference_range_high == null &&
          isPhysiological(i.test_name)
        );

        return (
          <div key={key} className="border border-slate-200 rounded-2xl overflow-hidden">
            {/* Report header */}
            <div
              className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
              onClick={() => toggleReport(key)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <FlaskConical className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {meta.lab_name || "Lab Report"}
                    {meta.lab_report_id && <span className="ml-1.5 text-xs font-normal text-slate-400">#{meta.lab_report_id}</span>}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {editingDate === key ? (
                      <>
                        <input
                          type="date"
                          value={editDateValue}
                          onChange={(e) => setEditDateValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs border border-teal-300 rounded-lg px-2 py-0.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                        <button onClick={(e) => saveDate(e, items)} className="p-0.5 text-teal-600 hover:text-teal-800"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={cancelEdit} className="p-0.5 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-slate-400">
                          {meta.collected_at ? format(new Date(meta.collected_at), "d MMM yyyy") : "Unknown date"} · {items.length} tests
                        </span>
                        <button onClick={(e) => startEditDate(e, key, meta.collected_at)} className="p-0.5 text-slate-300 hover:text-teal-500 transition-colors">
                          <Pencil className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {abnormalCount > 0 && (
                  <Badge
                    onClick={(e) => { e.stopPropagation(); setFilterAbnormal((p) => ({ ...p, [key]: p[key] === "abnormal" ? false : "abnormal" })); if (!expanded[key]) setExpanded((p) => ({ ...p, [key]: true })); }}
                    className={`cursor-pointer text-[10px] transition-colors ${filterAbnormal[key] === "abnormal" ? "bg-amber-200 text-amber-800" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
                  >
                    {abnormalCount} out of range
                  </Badge>
                )}
                {noRangeCount > 0 && (
                  <Badge
                    onClick={(e) => { e.stopPropagation(); setFilterAbnormal((p) => ({ ...p, [key]: p[key] === "norange" ? false : "norange" })); if (!expanded[key]) setExpanded((p) => ({ ...p, [key]: true })); }}
                    className={`cursor-pointer text-[10px] transition-colors ${filterAbnormal[key] === "norange" ? "bg-slate-300 text-slate-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  >
                    {noRangeCount} no ref. range
                  </Badge>
                )}
                {silencedCount > 0 && (
                  <Badge
                    onClick={(e) => { e.stopPropagation(); setFilterAbnormal((p) => ({ ...p, [key]: p[key] === "silenced" ? false : "silenced" })); if (!expanded[key]) setExpanded((p) => ({ ...p, [key]: true })); }}
                    className={`cursor-pointer text-[10px] transition-colors ${filterAbnormal[key] === "silenced" ? "bg-amber-200 text-amber-800" : "bg-amber-50 text-amber-600 hover:bg-amber-100"}`}
                  >
                    <BellOff className="w-2.5 h-2.5 mr-1 inline" />{silencedCount} silenced
                  </Badge>
                )}
                {(meta.source_file_urls?.length > 0 ? meta.source_file_urls : meta.source_file_url ? [meta.source_file_url] : []).map((url, idx, arr) => (
                  <button
                    key={idx}
                    onClick={(e) => handleViewOriginal(e, key, url)}
                    title={arr.length > 1 ? `View original document (page ${idx + 1} of ${arr.length})` : "View original uploaded document"}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors flex items-center gap-0.5"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    {arr.length > 1 && <span className="text-[9px] font-bold">{idx + 1}</span>}
                  </button>
                ))}
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {/* Panel categories */}
            {isOpen && (
              <div className="border-t border-slate-100">
                {filterAbnormal[key] === "abnormal" && (
                  <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] text-amber-700 font-medium">Showing out-of-range results only — please discuss these with your doctor</p>
                      <p className="text-[10px] text-amber-600">Use the <BellOff className="w-2.5 h-2.5 inline" /> button on any result to silence it if it's not clinically relevant.</p>
                      <p className="text-[10px] text-amber-500 italic">⚠ Out-of-range flags may not be truly abnormal — they could be due to transcription errors or misinterpretation by the system. This tool is intended for digitisation of physical records only. Please refer to your original document and consult your doctor or physician for clinical interpretation.</p>
                    </div>
                    <button onClick={() => setFilterAbnormal((p) => ({ ...p, [key]: false }))} className="text-amber-500 hover:text-amber-700 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                {filterAbnormal[key] === "silenced" && (
                  <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-amber-700 font-medium flex items-center gap-1"><BellOff className="w-3 h-3" /> Showing silenced results — these have been marked as not clinically relevant</p>
                      <p className="text-[10px] text-amber-600 mt-0.5">Click the <BellOff className="w-2.5 h-2.5 inline" /> button on any result to un-silence it.</p>
                    </div>
                    <button onClick={() => setFilterAbnormal((p) => ({ ...p, [key]: false }))} className="text-amber-500 hover:text-amber-700 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                {filterAbnormal[key] === "norange" && (
                  <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-slate-600 font-medium">Showing results with no reference range — values cannot be automatically assessed</p>
                      {physioNoRange.length > 0 && (
                        <p className="text-[10px] text-blue-600 mt-0.5 flex items-center gap-1">
                          <Info className="w-2.5 h-2.5 inline flex-shrink-0" />
                          Physiological measurements ({physioNoRange.map(i => i.test_name).join(", ")}) are recorded by some labs but don't have lab reference ranges — consider silencing these.
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 mt-0.5">Use the <BellOff className="w-2.5 h-2.5 inline" /> button to silence results you want to ignore.</p>
                    </div>
                    <button onClick={() => setFilterAbnormal((p) => ({ ...p, [key]: false }))} className="text-slate-400 hover:text-slate-600 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                {categories.map((cat) => {
                  const allCatItems = items.filter((i) => (i.category || "Other") === cat);
                  const catItems = filterAbnormal[key] === "abnormal"
                    ? allCatItems.filter((i) => !isSilenced(i) && ["low", "high"].includes(getLabStatus(i)))
                    : filterAbnormal[key] === "norange"
                    ? allCatItems.filter((i) => !isSilenced(i) && i.numeric_result != null && i.reference_range_low == null && i.reference_range_high == null)
                    : filterAbnormal[key] === "silenced"
                    ? allCatItems.filter((i) => isSilenced(i))
                    : allCatItems;
                  if (catItems.length === 0) return null;
                  return (
                    <div key={cat}>
                      <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{cat}</p>
                      </div>
                      {catItems.map((item) => {
                        const silenced = isSilenced(item);
                        return (
                          <div key={item.id} className={`flex items-center gap-3 px-5 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 ${silenced ? "border-l-2 border-l-amber-300 bg-amber-50/30" : ""}`}>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700 truncate flex items-center gap-1">
                                {item.test_name}
                              </p>
                              {item.reference_range_text && (
                                <p className="text-[10px] text-slate-400">Ref: {item.reference_range_text}</p>
                              )}
                              {isPhysiological(item.test_name) && item.reference_range_low == null && item.reference_range_high == null && !silenced && (
                                <p className="text-[9px] text-blue-500 mt-0.5">Physiological measure — consider silencing</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs font-semibold text-slate-800">
                                {item.numeric_result != null ? item.numeric_result : item.text_result}
                              </span>
                              {item.unit && <span className="text-[10px] text-slate-400">{item.unit}</span>}
                              <StatusBadge row={item} />
                              <SilenceButton item={item} onToggle={toggleSilence} />
                              <button
                                onClick={() => onDelete(item.id)}
                                className="p-1 text-slate-200 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}