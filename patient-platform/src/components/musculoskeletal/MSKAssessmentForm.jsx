import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Save, Loader2, FlaskConical, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SECTION = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>}
    </div>
  );
};

const Field = ({ label, hint, children }) => (
  <div>
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">{label}</label>
    {children}
    {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
  </div>
);

const NUM = ({ value, onChange, placeholder, step = "0.1", min, max }) => (
  <Input
    type="number"
    value={value}
    onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
    placeholder={placeholder}
    step={step}
    min={min}
    max={max}
    className="h-9 text-sm rounded-xl"
  />
);

const SEL = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

const MULTI = ({ value = [], onChange, options }) => {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => toggle(o.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
            ${value.includes(o.value)
              ? "bg-teal-600 text-white border-teal-600"
              : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};

const BOOL = ({ value, onChange }) => (
  <div className="flex gap-3">
    {[["Yes", true], ["No", false]].map(([label, val]) => (
      <button
        key={label}
        type="button"
        onClick={() => onChange(val)}
        className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors
          ${value === val ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"}`}
      >
        {label}
      </button>
    ))}
  </div>
);

// Vitamin D conversion constants
const NGML_TO_NMOL = 2.496; // ng/mL × 2.496 = nmol/L

// Clinical thresholds in ng/mL for display labels
function getVitDLabel(ngml) {
  if (ngml == null || ngml === "") return null;
  const v = parseFloat(ngml);
  if (isNaN(v)) return null;
  if (v < 20) return { label: "Deficient", color: "text-red-600 bg-red-50" };
  if (v < 30) return { label: "Insufficient", color: "text-amber-600 bg-amber-50" };
  if (v < 50) return { label: "Sufficient", color: "text-emerald-600 bg-emerald-50" };
  if (v < 100) return { label: "Optimal", color: "text-teal-600 bg-teal-50" };
  return { label: "High — review", color: "text-orange-600 bg-orange-50" };
}

const INITIAL = {
  assessed_at: new Date().toISOString().slice(0, 10),
  age: "", sex: "male",
  height_cm: "", weight_kg: "",
  bmd_tscore: "", bmd_zscore: "", bmd_site: "total_hip",
  fragility_fracture: null,
  handgrip_kg: "", asmi: "", asm_bmi: "",
  chair_stand_time_s: "", gait_speed_ms: "", sarc_f_score: "",
  vitamin_d_ngml: "", protein_intake_gkgday: "", exercise_sessions_per_week: "",
  prior_fracture_sites: [], secondary_causes: [],
  notes: "",
};

// Vitamin D keywords to match against lab test names
const VIT_D_KEYWORDS = ["25(oh)d", "25-oh", "vitamin d", "vit d", "25ohd", "calcidiol", "cholecalciferol", "hydroxyvitamin"];

function matchesVitD(testName) {
  if (!testName) return false;
  const lower = testName.toLowerCase();
  return VIT_D_KEYWORDS.some((k) => lower.includes(k));
}

export default function MSKAssessmentForm({ onSubmit, saving }) {
  const [form, setForm] = useState(INITIAL);
  const [vitDUnit, setVitDUnit] = useState("ngml"); // "ngml" | "nmol"
  const [vitDDisplay, setVitDDisplay] = useState(""); // raw display value in chosen unit
  const [labVitD, setLabVitD] = useState(null); // { value, unit, test_name, collected_at }
  const [loadingLab, setLoadingLab] = useState(false);
  const [labLinked, setLabLinked] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  // Convert display value → ng/mL for storage whenever unit or display changes
  useEffect(() => {
    if (vitDDisplay === "" || vitDDisplay == null) {
      setForm((f) => ({ ...f, vitamin_d_ngml: "" }));
      return;
    }
    const v = parseFloat(vitDDisplay);
    if (isNaN(v)) return;
    const asNgml = vitDUnit === "nmol" ? v / NGML_TO_NMOL : v;
    setForm((f) => ({ ...f, vitamin_d_ngml: parseFloat(asNgml.toFixed(2)) }));
  }, [vitDDisplay, vitDUnit]);

  const handleUnitToggle = (newUnit) => {
    if (newUnit === vitDUnit) return;
    if (vitDDisplay !== "" && !isNaN(parseFloat(vitDDisplay))) {
      const v = parseFloat(vitDDisplay);
      const converted = newUnit === "nmol"
        ? parseFloat((v * NGML_TO_NMOL).toFixed(1))
        : parseFloat((v / NGML_TO_NMOL).toFixed(2));
      setVitDDisplay(String(converted));
    }
    setVitDUnit(newUnit);
  };

  const fetchLabVitD = async () => {
    setLoadingLab(true);
    setLabLinked(false);
    const user = await base44.auth.me();
    const results = await base44.entities.LabResult.filter({ created_by: user.email }, "-collected_at", 200);
    const match = results.find((r) => matchesVitD(r.test_name) && r.numeric_result != null);
    setLoadingLab(false);
    if (!match) {
      setLabVitD(null);
      return;
    }
    setLabVitD(match);
  };

  const applyLabVitD = () => {
    if (!labVitD) return;
    // Detect unit from the lab result
    const unitLower = (labVitD.unit || "").toLowerCase();
    const isNmol = unitLower.includes("nmol");
    // Store in whatever unit the user currently has selected — convert if needed
    let displayVal;
    if (isNmol && vitDUnit === "ngml") {
      displayVal = parseFloat((labVitD.numeric_result / NGML_TO_NMOL).toFixed(2));
    } else if (!isNmol && vitDUnit === "nmol") {
      displayVal = parseFloat((labVitD.numeric_result * NGML_TO_NMOL).toFixed(1));
    } else {
      displayVal = labVitD.numeric_result;
    }
    setVitDDisplay(String(displayVal));
    setLabLinked(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined) clean[k] = v;
    });
    onSubmit(clean);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SECTION title="Demographics">
        <Field label="Date of Assessment">
          <Input type="date" value={form.assessed_at} onChange={(e) => set("assessed_at")(e.target.value)} className="h-9 text-sm rounded-xl" />
        </Field>
        <Field label="Age (years)">
          <NUM value={form.age} onChange={set("age")} placeholder="e.g. 67" step="1" min="18" max="120" />
        </Field>
        <Field label="Sex">
          <SEL value={form.sex} onChange={set("sex")} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </Field>
        <Field label="Height (cm)">
          <NUM value={form.height_cm} onChange={set("height_cm")} placeholder="e.g. 165" />
        </Field>
        <Field label="Weight (kg)">
          <NUM value={form.weight_kg} onChange={set("weight_kg")} placeholder="e.g. 68" />
        </Field>
      </SECTION>

      <SECTION title="Bone Mineral Density (DXA)">
        <Field label="T-score" hint="Total hip, femoral neck, or lumbar spine">
          <NUM value={form.bmd_tscore} onChange={set("bmd_tscore")} placeholder="e.g. -2.1" step="0.1" min="-6" max="4" />
        </Field>
        <Field label="Z-score" hint="For premenopausal women / younger adults">
          <NUM value={form.bmd_zscore} onChange={set("bmd_zscore")} placeholder="e.g. -1.5" step="0.1" min="-6" max="4" />
        </Field>
        <Field label="BMD Measurement Site">
          <SEL value={form.bmd_site} onChange={set("bmd_site")} options={[
            { value: "total_hip", label: "Total Hip" },
            { value: "femoral_neck", label: "Femoral Neck" },
            { value: "lumbar_spine", label: "Lumbar Spine" },
          ]} />
        </Field>
        <Field label="History of Fragility Fracture?">
          <BOOL value={form.fragility_fracture} onChange={set("fragility_fracture")} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Fracture Sites (if any)">
            <MULTI value={form.prior_fracture_sites} onChange={set("prior_fracture_sites")} options={[
              { value: "spine", label: "Spine" }, { value: "hip", label: "Hip" },
              { value: "wrist", label: "Wrist" }, { value: "pelvis", label: "Pelvis" }, { value: "other", label: "Other" },
            ]} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Secondary Causes of Bone Loss">
            <MULTI value={form.secondary_causes} onChange={set("secondary_causes")} options={[
              { value: "ckd", label: "CKD" }, { value: "diabetes", label: "Diabetes" },
              { value: "malabsorption", label: "Malabsorption / Coeliac" },
              { value: "glucocorticoids", label: "Glucocorticoid Use" },
              { value: "hypogonadism", label: "Hypogonadism" },
              { value: "hyperthyroidism", label: "Hyperthyroidism" },
              { value: "none", label: "None" },
            ]} />
          </Field>
        </div>
      </SECTION>

      <SECTION title="Sarcopenia (AWGS 2025)" defaultOpen={true}>
        <Field label="Handgrip Strength (kg)" hint="Dominant hand — best of 3 attempts">
          <NUM value={form.handgrip_kg} onChange={set("handgrip_kg")} placeholder="e.g. 25.0" />
        </Field>
        <Field label="ASMI — BIA (kg/m²)" hint="Appendicular skeletal muscle index, height-adjusted">
          <NUM value={form.asmi} onChange={set("asmi")} placeholder="e.g. 6.8" />
        </Field>
        <Field label="ASM/BMI (kg/BMI)" hint="Alternative muscle mass index, BMI-adjusted">
          <NUM value={form.asm_bmi} onChange={set("asm_bmi")} placeholder="e.g. 0.78" />
        </Field>
        <Field label="SARC-F Score (0–10)" hint="≥4 = positive sarcopenia screen">
          <NUM value={form.sarc_f_score} onChange={set("sarc_f_score")} placeholder="e.g. 3" step="1" min="0" max="10" />
        </Field>
        <Field label="5× Chair Stand Time (seconds)" hint="Time to complete 5 sit-to-stands">
          <NUM value={form.chair_stand_time_s} onChange={set("chair_stand_time_s")} placeholder="e.g. 11.5" />
        </Field>
        <Field label="Usual Gait Speed (m/s)" hint="4-metre walk test">
          <NUM value={form.gait_speed_ms} onChange={set("gait_speed_ms")} placeholder="e.g. 0.9" />
        </Field>
      </SECTION>

      <SECTION title="Nutrition & Lifestyle">
        <div className="sm:col-span-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
            Vitamin D — 25(OH)D
          </label>
          {/* Unit toggle + input row */}
          <div className="flex items-center gap-2 mb-2">
            <Input
              type="number"
              value={vitDDisplay}
              onChange={(e) => { setVitDDisplay(e.target.value); setLabLinked(false); }}
              placeholder={vitDUnit === "ngml" ? "e.g. 22" : "e.g. 55"}
              step="0.1"
              min="0"
              className="h-9 text-sm rounded-xl w-36"
            />
            {/* Unit toggle */}
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-semibold">
              {[["ngml", "ng/mL"], ["nmol", "nmol/L"]].map(([val, lbl]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleUnitToggle(val)}
                  className={`px-3 py-1.5 transition-colors ${vitDUnit === val ? "bg-teal-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            {/* Status label */}
            {(() => {
              const label = getVitDLabel(form.vitamin_d_ngml);
              return label ? (
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${label.color}`}>{label.label}</span>
              ) : null;
            })()}
          </div>
          {/* Thresholds reference */}
          <p className="text-[10px] text-slate-400 mb-2">
            {vitDUnit === "ngml"
              ? "Deficient <20 · Insufficient 20–29 · Sufficient 30–49 · Optimal 50–99 ng/mL"
              : "Deficient <50 · Insufficient 50–74 · Sufficient 75–124 · Optimal 125–247 nmol/L"}
          </p>
          {/* Link from lab results */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={fetchLabVitD}
              disabled={loadingLab}
              className="flex items-center gap-1.5 text-xs text-teal-600 font-medium hover:text-teal-700 disabled:opacity-50"
            >
              {loadingLab ? <Loader2 className="w-3 h-3 animate-spin" /> : <FlaskConical className="w-3 h-3" />}
              {loadingLab ? "Searching lab results…" : "Link from Lab Results"}
            </button>
            {labVitD && !labLinked && (
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-3 py-1.5">
                <span className="text-xs text-teal-700">
                  Found: <strong>{labVitD.numeric_result} {labVitD.unit}</strong> — {labVitD.test_name}
                  <span className="text-teal-500 ml-1">({new Date(labVitD.collected_at).toLocaleDateString()})</span>
                </span>
                <button
                  type="button"
                  onClick={applyLabVitD}
                  className="text-xs text-white bg-teal-600 hover:bg-teal-700 px-2.5 py-0.5 rounded-lg font-medium"
                >
                  Use this
                </button>
              </div>
            )}
            {labLinked && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Linked from lab results
              </span>
            )}
            {labVitD === null && !loadingLab && (
              <span className="text-xs text-slate-400">No Vitamin D results found in your lab history</span>
            )}
          </div>
        </div>
        <Field label="Protein Intake (g/kg/day)" hint="Estimated daily protein per body weight">
          <NUM value={form.protein_intake_gkgday} onChange={set("protein_intake_gkgday")} placeholder="e.g. 1.1" />
        </Field>
        <Field label="Resistance Exercise Sessions / Week">
          <NUM value={form.exercise_sessions_per_week} onChange={set("exercise_sessions_per_week")} placeholder="e.g. 2" step="1" min="0" max="14" />
        </Field>
      </SECTION>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={saving || !form.age || !form.sex} className="h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 px-6">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Analysing…" : "Generate Assessment"}
        </Button>
      </div>
    </form>
  );
}