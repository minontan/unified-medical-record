import { useState, useRef } from "react";
import { format } from "date-fns";
import { Plus, Trash2, FlaskConical, Upload, Camera, FileText, Loader2, AlertCircle, Link2, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";

// ── Pregnancy marker reference ranges (standardised) ────────────────────────
// Ranges are for pregnancy context; trimester notes where applicable
const MARKERS = [
  {
    value: "haemoglobin",
    label: "Haemoglobin",
    defaultUnit: "g/dL",
    altUnits: ["g/L"],
    ref_low: 10.5, ref_high: 14.0,
    ref_text: "10.5–14.0 g/dL (pregnancy)",
    note: "Lower threshold in pregnancy due to haemodilution. Hb <10.5 g/dL = anaemia in pregnancy.",
    // Lab result test name synonyms for cross-linking
    labSynonyms: ["HAEMOGLOBIN", "HGB", "HB", "HEMOGLOBIN"],
  },
  {
    value: "ferritin",
    label: "Ferritin",
    defaultUnit: "µg/L",
    altUnits: ["ng/mL", "pmol/L"],
    ref_low: 13, ref_high: 150,
    ref_text: "13–150 µg/L",
    note: "Ferritin <30 µg/L suggests iron depletion; <13 µg/L = iron deficiency even without anaemia.",
    labSynonyms: ["FERRITIN", "SERUM FERRITIN"],
  },
  {
    value: "iron",
    label: "Iron (Serum)",
    defaultUnit: "µmol/L",
    altUnits: ["µg/dL"],
    ref_low: 7, ref_high: 27,
    ref_text: "7–27 µmol/L",
    note: "Serum iron alone is not a reliable iron status marker. Interpret with ferritin and transferrin saturation.",
    labSynonyms: ["IRON", "SERUM IRON", "FE"],
  },
  {
    value: "folic_acid",
    label: "Folate (Serum)",
    defaultUnit: "nmol/L",
    altUnits: ["ng/mL"],
    ref_low: 10, ref_high: 120,
    ref_text: ">10 nmol/L (adequate for pregnancy)",
    note: "Folate >10 nmol/L is considered adequate. Supplementation of 400–800 µg/day recommended pre-conception and first trimester.",
    labSynonyms: ["FOLATE", "FOLIC ACID", "SERUM FOLATE", "FOLIC ACID/FOLATE", "RBC FOLATE"],
  },
  {
    value: "b12",
    label: "Vitamin B12",
    defaultUnit: "pmol/L",
    altUnits: ["pg/mL", "ng/L"],
    ref_low: 148, ref_high: 740,
    ref_text: "148–740 pmol/L",
    note: "B12 <148 pmol/L is deficient. Levels naturally decline during pregnancy; borderline values may require confirmation with MMA or holotranscobalamin.",
    labSynonyms: ["VITAMIN B12", "B12", "COBALAMIN", "VIT B12", "VIT. B12"],
  },
  {
    value: "vitamin_d",
    label: "Vitamin D (25-OH)",
    defaultUnit: "nmol/L",
    altUnits: ["ng/mL"],
    ref_low: 50, ref_high: 125,
    ref_text: "50–125 nmol/L (sufficient in pregnancy)",
    note: "25(OH)D <50 nmol/L = insufficiency in pregnancy. Supplementation 1000–2000 IU/day often recommended.",
    labSynonyms: ["VITAMIN D", "25-OH VITAMIN D", "25-HYDROXYVITAMIN D", "VIT D", "25(OH)D", "CALCIDIOL"],
  },
  {
    value: "tsh",
    label: "TSH (Thyroid)",
    defaultUnit: "mIU/L",
    altUnits: ["µIU/mL"],
    ref_low: 0.1, ref_high: 2.5,
    ref_text: "0.1–2.5 mIU/L (1st trimester); 0.2–3.0 (2nd–3rd)",
    note: "ATA 2017 recommends TSH <2.5 mIU/L in 1st trimester. Untreated hypothyroidism in pregnancy is associated with adverse outcomes.",
    labSynonyms: ["TSH", "THYROID STIMULATING HORMONE", "THYROTROPIN"],
  },
  {
    value: "gbs",
    label: "GBS (Group B Strep)",
    defaultUnit: "result",
    altUnits: [],
    ref_low: null, ref_high: null,
    ref_text: "Positive / Negative (swab result)",
    note: "GBS screening at 35–37 weeks. Positive result warrants intrapartum IV penicillin prophylaxis.",
    labSynonyms: ["GBS", "GROUP B STREPTOCOCCUS", "STREP B", "GBS SCREEN"],
  },
  {
    value: "hbsag",
    label: "HBsAg (Hepatitis B)",
    defaultUnit: "result",
    altUnits: [],
    ref_low: null, ref_high: null,
    ref_text: "Non-reactive (negative)",
    note: "Positive HBsAg requires neonatal hepatitis B immunoglobulin + vaccine within 12 hours of birth.",
    labSynonyms: ["HBSAG", "HEPATITIS B SURFACE ANTIGEN", "HBS AG", "HEP B SURFACE AG"],
  },
  {
    value: "hiv",
    label: "HIV Screen",
    defaultUnit: "result",
    altUnits: [],
    ref_low: null, ref_high: null,
    ref_text: "Non-reactive (negative)",
    note: "Routine antenatal HIV screening. Reactive result requires confirmatory testing and specialist referral.",
    labSynonyms: ["HIV", "HIV SCREEN", "HIV 1/2", "HIV AG/AB", "HIV ANTIBODY"],
  },
  {
    value: "vdrl_syphilis",
    label: "Syphilis (VDRL/TPPA)",
    defaultUnit: "result",
    altUnits: [],
    ref_low: null, ref_high: null,
    ref_text: "Non-reactive (negative)",
    note: "Untreated syphilis in pregnancy can cause congenital syphilis. Positive result requires urgent treatment.",
    labSynonyms: ["VDRL", "TPPA", "SYPHILIS", "RPR", "TREPONEMA PALLIDUM"],
  },
  {
    value: "rubella_igG",
    label: "Rubella IgG",
    defaultUnit: "IU/mL",
    altUnits: [],
    ref_low: 10, ref_high: null,
    ref_text: ">10 IU/mL = immune",
    note: "IgG ≥10 IU/mL indicates immunity. Non-immune women should receive MMR post-delivery (not during pregnancy).",
    labSynonyms: ["RUBELLA", "RUBELLA IGG", "RUBELLA ANTIBODY"],
  },
  {
    value: "glucose_gtt",
    label: "Glucose (GTT / GDM)",
    defaultUnit: "mmol/L",
    altUnits: ["mg/dL"],
    ref_low: null, ref_high: 7.8,
    ref_text: "Fasting <5.1 · 1hr <10.0 · 2hr <8.5 mmol/L (IADPSG)",
    note: "IADPSG/WHO 2013 criteria for GDM. Any single value meeting or exceeding threshold = GDM diagnosis.",
    labSynonyms: ["GLUCOSE", "FASTING GLUCOSE", "2HR GLUCOSE", "GTT", "OGTT", "BLOOD GLUCOSE"],
  },
  {
    value: "other",
    label: "Other",
    defaultUnit: "",
    altUnits: [],
    ref_low: null, ref_high: null,
    ref_text: "N/A",
    note: "",
    labSynonyms: [],
  },
];

const MARKER_MAP = Object.fromEntries(MARKERS.map((m) => [m.value, m]));
const MARKER_LABELS = Object.fromEntries(MARKERS.map((m) => [m.value, m.label]));

// Check if a value is within, above, or below reference range
function getRangeStatus(marker, value) {
  const def = MARKER_MAP[marker];
  if (!def || value == null || isNaN(value)) return null;
  if (def.ref_low == null && def.ref_high == null) return null;
  if (def.ref_low != null && value < def.ref_low) return "low";
  if (def.ref_high != null && value > def.ref_high) return "high";
  return "normal";
}

const STATUS_STYLES = {
  low:    { badge: "bg-blue-50 text-blue-700 border-blue-200",    label: "Below range", icon: AlertTriangle },
  high:   { badge: "bg-amber-50 text-amber-700 border-amber-200", label: "Above range", icon: AlertTriangle },
  normal: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Normal", icon: CheckCircle2 },
};

// Extraction schema for pregnancy blood reports
const PREGNANCY_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    lab_name: { type: "string" },
    collected_at: { type: "string" },
    gestational_week: { type: "integer" },
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          marker_type: {
            type: "string",
            description: "One of: haemoglobin, ferritin, iron, folic_acid, b12, vitamin_d, tsh, gbs, hbsag, hiv, vdrl_syphilis, rubella_igG, glucose_gtt, other"
          },
          marker_value: { type: "number" },
          marker_unit: { type: "string" },
          text_result: { type: "string", description: "For qualitative tests like GBS, HIV, HBsAg" },
          notes: { type: "string" },
        }
      }
    }
  }
};

// ── Utility: find matching lab results by synonym ───────────────────────────
function findLinkedLabResults(markerValue, labResults) {
  const def = MARKER_MAP[markerValue];
  if (!def || !def.labSynonyms.length) return [];
  return labResults.filter((lr) =>
    def.labSynonyms.some((syn) =>
      lr.test_name?.toUpperCase().includes(syn.toUpperCase())
    )
  );
}

// ── Sub-component: linked lab results badge ──────────────────────────────────
function LinkedLabBadge({ count }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded-full">
      <Link2 className="w-2.5 h-2.5" /> {count} lab {count === 1 ? "result" : "results"}
    </span>
  );
}

// ── Sub-component: Expandable marker card ────────────────────────────────────
function MarkerCard({ log, labResults, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const def = MARKER_MAP[log.marker_type];
  const status = getRangeStatus(log.marker_type, log.marker_value);
  const linked = findLinkedLabResults(log.marker_type, labResults);
  const style = status ? STATUS_STYLES[status] : null;
  const StatusIcon = style?.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
          <FlaskConical className="w-4 h-4 text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800">{MARKER_LABELS[log.marker_type] || log.marker_type}</span>
            {log.marker_value != null && (
              <span className="text-sm font-bold text-violet-700">
                {log.marker_value} <span className="text-xs font-normal text-slate-400">{log.marker_unit}</span>
              </span>
            )}
            {log.text_result && (
              <span className="text-xs font-semibold text-slate-600">{log.text_result}</span>
            )}
            {style && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${style.badge}`}>
                {StatusIcon && <StatusIcon className="w-2.5 h-2.5" />} {style.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <p className="text-xs text-slate-400">{format(new Date(log.logged_at), "dd MMM yyyy")}</p>
            {log.gestational_week && <span className="text-xs text-pink-500 font-medium">Week {log.gestational_week}</span>}
            <LinkedLabBadge count={linked.length} />
          </div>
          {def?.ref_text && (
            <p className="text-[10px] text-slate-400 mt-0.5">Reference: {def.ref_text}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onDelete(log.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
          {def?.note && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <p className="text-[11px] text-amber-800 leading-relaxed">{def.note}</p>
            </div>
          )}
          {log.notes && (
            <p className="text-xs text-slate-500 italic">{log.notes}</p>
          )}
          {linked.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wide flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Linked Lab Results
              </p>
              {linked.map((lr) => (
                <div key={lr.id} className="bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800">{lr.test_name}</p>
                    <p className="text-[10px] text-slate-400">
                      {lr.numeric_result != null ? `${lr.numeric_result} ${lr.unit || ""}` : lr.text_result}
                      {lr.reference_range_text ? ` · Ref: ${lr.reference_range_text}` : ""}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 flex-shrink-0">{lr.collected_at ? format(new Date(lr.collected_at), "dd MMM yy") : ""}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PregnancyMarkersSection({ logs, onCreate, onDelete, labResults = [] }) {
  const [showForm, setShowForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({
    logged_at: new Date().toISOString().slice(0, 16),
    marker_type: "haemoglobin",
    marker_value: "",
    marker_unit: "g/dL",
    text_result: "",
    gestational_week: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState("");
  const [uploadError, setUploadError] = useState(null);
  const [extractedBatch, setExtractedBatch] = useState(null); // array of items to review before saving
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const relevant = logs.filter((l) => l.log_type === "pregnancy_blood_marker");

  const handleMarkerChange = (val) => {
    const def = MARKER_MAP[val];
    setForm((f) => ({ ...f, marker_type: val, marker_unit: def?.defaultUnit || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onCreate({
      log_type: "pregnancy_blood_marker",
      logged_at: new Date(form.logged_at).toISOString(),
      marker_type: form.marker_type,
      marker_value: form.marker_value ? parseFloat(form.marker_value) : undefined,
      marker_unit: form.marker_unit,
      text_result: form.text_result || undefined,
      gestational_week: form.gestational_week ? parseInt(form.gestational_week) : undefined,
      notes: form.notes,
    });
    setShowForm(false);
    setForm({ logged_at: new Date().toISOString().slice(0, 16), marker_type: "haemoglobin", marker_value: "", marker_unit: "g/dL", text_result: "", gestational_week: "", notes: "" });
    setSaving(false);
  };

  // ── Upload + extract flow ──────────────────────────────────────────────────
  const processFile = async (file) => {
    setUploading(true);
    setUploadError(null);
    setUploadStage("Uploading file…");
    try {
      // Compress images
      let preparedFile = file;
      if (file.type !== "application/pdf") {
        preparedFile = await new Promise((resolve) => {
          const img = new window.Image();
          const url = URL.createObjectURL(file);
          img.onload = () => {
            URL.revokeObjectURL(url);
            const MAX = 2400;
            let { width, height } = img;
            if (width > MAX || height > MAX) {
              const scale = MAX / Math.max(width, height);
              width = Math.round(width * scale);
              height = Math.round(height * scale);
            }
            const canvas = document.createElement("canvas");
            canvas.width = width; canvas.height = height;
            canvas.getContext("2d").drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" })),
              "image/webp", 0.88
            );
          };
          img.src = url;
        });
      }

      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: preparedFile });

      setUploadStage("Extracting pregnancy markers…");
      const extractRes = await base44.functions.invoke("extractLabReport", {
        file_uri,
        prompt: `You are a clinical data extraction assistant. Extract ALL pregnancy blood marker results from this antenatal blood report.
For each result, identify the marker_type from this list: haemoglobin, ferritin, iron, folic_acid, b12, vitamin_d, tsh, gbs, hbsag, hiv, vdrl_syphilis, rubella_igG, glucose_gtt, other.
Extract the numeric value (marker_value), unit (marker_unit), and for qualitative tests (gbs, hbsag, hiv, vdrl_syphilis) extract the text_result (e.g. "Reactive", "Non-reactive", "Positive", "Negative").
If gestational week is mentioned in the report, include it.
Return ALL markers found, even if only a text result is available.`,
        json_schema: PREGNANCY_EXTRACTION_SCHEMA,
      });
      const extracted = extractRes.data?.extracted;

      if (!extracted?.results?.length) throw new Error("No pregnancy markers could be extracted from this document.");

      // Cross-ref with reference ranges for review
      const batch = extracted.results.map((r) => {
        const def = MARKER_MAP[r.marker_type] || MARKER_MAP.other;
        return {
          ...r,
          marker_unit: r.marker_unit || def.defaultUnit,
          gestational_week: r.gestational_week || extracted.gestational_week || "",
          logged_at: extracted.collected_at ? new Date(extracted.collected_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
          status: getRangeStatus(r.marker_type, r.marker_value),
        };
      });
      setExtractedBatch(batch);
      setShowUpload(false);
    } catch (e) {
      setUploadError(e.message || "Extraction failed.");
    }
    setUploading(false);
    setUploadStage("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleSaveBatch = async () => {
    setSaving(true);
    for (const item of extractedBatch) {
      await onCreate({
        log_type: "pregnancy_blood_marker",
        logged_at: item.logged_at ? new Date(item.logged_at).toISOString() : new Date().toISOString(),
        marker_type: item.marker_type,
        marker_value: item.marker_value ? parseFloat(item.marker_value) : undefined,
        marker_unit: item.marker_unit,
        text_result: item.text_result || undefined,
        gestational_week: item.gestational_week ? parseInt(item.gestational_week) : undefined,
        notes: item.notes,
      });
    }
    setExtractedBatch(null);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Pregnancy Blood Markers</h2>
          <p className="text-xs text-slate-400 mt-0.5">Log antenatal results · standardised reference ranges · linked to your lab history</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => { setShowUpload(!showUpload); setShowForm(false); setExtractedBatch(null); }}
            variant="outline"
            className="rounded-xl gap-2 h-9 px-4 text-sm border-pink-300 text-pink-700 hover:bg-pink-50"
          >
            <Upload className="w-4 h-4" /> Upload Report
          </Button>
          <Button
            onClick={() => { setShowForm(!showForm); setShowUpload(false); setExtractedBatch(null); }}
            className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white gap-2 h-9 px-4 text-sm"
          >
            <Plus className="w-4 h-4" /> Log Result
          </Button>
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <p className="text-sm font-semibold text-slate-700">Upload Antenatal Blood Report</p>
          <p className="text-xs text-slate-400">AI will extract all pregnancy markers, cross-reference standardised ranges, and pre-fill results for your review before saving.</p>
          <div
            className="border-2 border-dashed border-pink-200 rounded-xl p-8 text-center bg-pink-50/40 hover:bg-pink-50 cursor-pointer transition-colors"
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-7 h-7 text-pink-500 animate-spin" />
                <p className="text-sm font-medium text-slate-600">{uploadStage}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FlaskConical className="w-8 h-8 text-pink-400" />
                <p className="text-sm font-semibold text-slate-700">Drop file or click to upload</p>
                <p className="text-xs text-slate-400">PDF, JPG, PNG — antenatal blood report</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 rounded-xl gap-2 h-10" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <FileText className="w-4 h-4" /> Choose File
            </Button>
            <Button variant="outline" className="flex-1 rounded-xl gap-2 h-10" onClick={() => cameraInputRef.current?.click()} disabled={uploading}>
              <Camera className="w-4 h-4" /> Take Photo
            </Button>
          </div>
          {uploadError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        </div>
      )}

      {/* Extracted batch review */}
      {extractedBatch && (
        <div className="bg-white border border-teal-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-teal-700">Review Extracted Results</p>
              <p className="text-xs text-slate-400 mt-0.5">{extractedBatch.length} marker{extractedBatch.length !== 1 ? "s" : ""} extracted — verify before saving</p>
            </div>
            <button onClick={() => setExtractedBatch(null)} className="p-1.5 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {extractedBatch.map((item, idx) => {
              const def = MARKER_MAP[item.marker_type] || MARKER_MAP.other;
              const style = item.status ? STATUS_STYLES[item.status] : null;
              return (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-800">{MARKER_LABELS[item.marker_type] || item.marker_type}</span>
                      {item.marker_value != null && (
                        <span className="text-xs font-bold text-violet-700">{item.marker_value} <span className="font-normal text-slate-400">{item.marker_unit}</span></span>
                      )}
                      {item.text_result && <span className="text-xs font-semibold text-slate-600">{item.text_result}</span>}
                      {style && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${style.badge}`}>{style.label}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Ref: {def.ref_text}</p>
                    {item.gestational_week && <p className="text-[10px] text-pink-500">Week {item.gestational_week}</p>}
                    {/* Linked lab results hint */}
                    {(() => {
                      const linked = findLinkedLabResults(item.marker_type, labResults);
                      return linked.length > 0 ? (
                        <p className="text-[10px] text-teal-600 mt-0.5 flex items-center gap-1">
                          <Link2 className="w-2.5 h-2.5" /> {linked.length} matching lab result{linked.length > 1 ? "s" : ""} found in your history
                        </p>
                      ) : null;
                    })()}
                  </div>
                  <button onClick={() => setExtractedBatch((b) => b.filter((_, i) => i !== idx))} className="p-1 text-slate-300 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setExtractedBatch(null)} className="rounded-xl flex-1">Discard</Button>
            <Button onClick={handleSaveBatch} disabled={saving} className="rounded-xl flex-1 bg-pink-600 hover:bg-pink-700 text-white">
              {saving ? "Saving…" : `Save ${extractedBatch.length} Result${extractedBatch.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      )}

      {/* Manual entry form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Marker / Test</Label>
                <Select value={form.marker_type} onValueChange={handleMarkerChange}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MARKERS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {MARKER_MAP[form.marker_type]?.ref_text && (
                  <p className="text-[10px] text-slate-400 mt-1">Reference: {MARKER_MAP[form.marker_type].ref_text}</p>
                )}
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Date</Label>
                <Input type="datetime-local" value={form.logged_at} onChange={(e) => setForm({ ...form, logged_at: e.target.value })} className="rounded-xl border-slate-200 h-10" required />
              </div>
              {MARKER_MAP[form.marker_type]?.ref_low != null || MARKER_MAP[form.marker_type]?.ref_high != null ? (
                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Value</Label>
                  <Input type="number" step="any" value={form.marker_value} onChange={(e) => setForm({ ...form, marker_value: e.target.value })} className="rounded-xl border-slate-200 h-10" placeholder="Enter result" />
                </div>
              ) : (
                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Result</Label>
                  <Input value={form.text_result} onChange={(e) => setForm({ ...form, text_result: e.target.value })} className="rounded-xl border-slate-200 h-10" placeholder="e.g. Non-reactive, Positive" />
                </div>
              )}
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Unit</Label>
                <Input value={form.marker_unit} onChange={(e) => setForm({ ...form, marker_unit: e.target.value })} className="rounded-xl border-slate-200 h-10" placeholder="Unit" />
                {MARKER_MAP[form.marker_type]?.altUnits?.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-1">Also common: {MARKER_MAP[form.marker_type].altUnits.join(", ")}</p>
                )}
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Gestational Week (optional)</Label>
                <Input type="number" min="1" max="42" value={form.gestational_week} onChange={(e) => setForm({ ...form, gestational_week: e.target.value })} className="rounded-xl border-slate-200 h-10" placeholder="e.g. 12" />
              </div>
            </div>
            {/* Linked lab hint */}
            {(() => {
              const linked = findLinkedLabResults(form.marker_type, labResults);
              return linked.length > 0 ? (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-start gap-2">
                  <Link2 className="w-3.5 h-3.5 text-teal-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-teal-700">
                    <strong>{linked.length} matching lab result{linked.length > 1 ? "s" : ""}</strong> found in your lab history for {MARKER_LABELS[form.marker_type]}. After saving, this entry will be cross-linked automatically.
                  </p>
                </div>
              ) : null;
            })()}
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl border-slate-200 resize-none" rows={2} placeholder="Any comments from your doctor..." />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={saving || (!form.marker_value && !form.text_result)} className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white">
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Marker cards */}
      {relevant.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No blood marker results yet.</p>
          <p className="text-xs text-slate-300 mt-1">Log manually or upload your antenatal blood report for AI extraction.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {relevant.map((l) => (
            <MarkerCard key={l.id} log={l} labResults={labResults} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}