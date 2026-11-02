/**
 * Detects non-lab-result items in an extracted results list and shows a
 * contextual warning banner grouped by category type.
 *
 * Categories detected:
 *  - Physiological / Vital Signs  (BP, HR, SpO2, weight, height, BMI, temp…)
 *  - Radiology / Imaging           (X-ray, CT, MRI, ultrasound, DEXA/BMD…)
 *  - ECG / Cardiology              (ECG, EKG, stress test, Holter…)
 *  - Bone Density / DXA            (BMD, T-score, Z-score, DEXA…)
 *  - Microbiology / Culture        (culture, sensitivity, MRSA, AFB…)
 *  - Histopathology / Cytology     (biopsy, cytology, PAP smear, FNAC…)
 *  - Spirometry / Lung Function    (FEV1, FVC, PEFR, spirometry…)
 *  - Ophthalmology                 (visual acuity, IOP, fundus…)
 *  - Audiometry                    (hearing, audiogram, PTA…)
 *  - Medication / Prescription     (tabs, caps, mg dose entries…)
 *  - Summary / Notes text          (impression, conclusion, comments…)
 */

import { AlertTriangle, Info, X, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

// ─── Detection rules ──────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "vitals",
    label: "Vital Signs / Physiological Measurements",
    color: "amber",
    keywords: [
      "blood pressure", "systolic", "diastolic", "pulse rate", "heart rate",
      "respiratory rate", "temperature", "body temp", "spo2", "oxygen saturation",
      "weight", "height", "bmi", "body mass index", "waist circumference",
      "hip circumference", "head circumference", "pulse", " pr ", "rr ", " hr ",
    ],
    tip: "These are clinical observations, not biochemical assays. They can't be trended alongside blood tests.",
  },
  {
    id: "radiology",
    label: "Radiology / Imaging",
    color: "blue",
    keywords: [
      "x-ray", "xray", "chest xr", "ultrasound", "usg", "usse", "mri",
      "ct scan", "computed tomography", "pet scan", "mammogram", "mammography",
      "fluoroscopy", "angiogram", "doppler", "sonography", "imaging impression",
      "radiological", "radiograph",
    ],
    tip: "Radiology reports contain narrative text findings, not numeric lab values.",
  },
  {
    id: "ecg",
    label: "ECG / Cardiac Investigations",
    color: "rose",
    keywords: [
      "ecg", "ekg", "electrocardiogram", "stress test", "treadmill test", "tmt",
      "holter", "echo", "echocardiogram", "cardiac mri", "heart rhythm",
      "sinus rhythm", "qrs", "qt interval", "pr interval", "st segment",
    ],
    tip: "ECG findings are interpretive reports and do not belong in a lab value tracker.",
  },
  {
    id: "bmd",
    label: "Bone Density / DXA",
    color: "purple",
    keywords: [
      "bmd", "bone mineral density", "t-score", "z-score", "dexa", "dxa",
      "femoral neck", "lumbar spine", "total hip", "osteoporosis", "osteopenia",
      "bone density", "fracture risk",
    ],
    tip: "BMD / DEXA results are tracked separately under Bone, Muscle & Frailty.",
  },
  {
    id: "micro",
    label: "Microbiology / Culture & Sensitivity",
    color: "orange",
    keywords: [
      "culture", "sensitivity", "c&s", "c & s", "mrsa", "afb", "gram stain",
      "microscopy", "organism", "resistant", "susceptible", "mics", "minimum inhibitory",
      "urine culture", "blood culture", "wound swab", "throat swab",
    ],
    tip: "Microbiology reports contain organism names and antibiotic sensitivities — not numeric lab values.",
  },
  {
    id: "histo",
    label: "Histopathology / Cytology",
    color: "pink",
    keywords: [
      "biopsy", "histopathology", "cytology", "pap smear", "fnac", "fine needle",
      "tissue", "specimen", "pathological diagnosis", "malignant", "benign",
      "carcinoma", "adenoma", "dysplasia", "microscopic",
    ],
    tip: "Pathology reports contain qualitative findings and diagnoses — not trackable numeric results.",
  },
  {
    id: "spirometry",
    label: "Spirometry / Lung Function",
    color: "cyan",
    keywords: [
      "fev1", "fvc", "fev1/fvc", "pefr", "peak flow", "spirometry", "tlc",
      "lung function", "diffusion capacity", "dlco", "residual volume",
    ],
    tip: "Lung function tests require dedicated interpretation and trend analysis separate from blood tests.",
  },
  {
    id: "ophthalmology",
    label: "Ophthalmology",
    color: "indigo",
    keywords: [
      "visual acuity", "iop", "intraocular pressure", "fundus", "retinal",
      "visual field", "tonometry", "refraction", "slit lamp", "ophthalmology",
    ],
    tip: "Eye examination findings should not be mixed with blood test results.",
  },
  {
    id: "audiology",
    label: "Audiometry / Hearing",
    color: "violet",
    keywords: [
      "audiogram", "audiometry", "hearing loss", "pta", "pure tone", "tympanometry",
      "otoacoustic", "speech discrimination", "sensorineural", "conductive loss",
    ],
    tip: "Hearing test results are a separate clinical domain.",
  },
  {
    id: "medication",
    label: "Medication / Prescription Entries",
    color: "red",
    keywords: [
      "tablet", "capsule", "syrup", "injection", "cream", "ointment",
      "prescription", "dispense", "mg od", "mg bd", "mg tds", "mg qid",
      "once daily", "twice daily", "three times", "prn", "dosage",
    ],
    tip: "Prescription or dispensing lines should be tracked under Medications, not Lab Results.",
  },
  {
    id: "notes",
    label: "Summary Text / Clinical Impression",
    color: "slate",
    keywords: [
      "impression", "conclusion", "summary", "comment", "clinical note",
      "recommendation", "follow up", "follow-up", "advised", "referred",
      "diagnosis", "assessment",
    ],
    tip: "Free-text clinical notes have no numeric value and cannot be trended.",
  },
];

// ─── Colour map (Tailwind safe-listed classes) ────────────────────────────────

const COLOUR = {
  amber:  { bg: "bg-amber-50",  border: "border-amber-200",  icon: "text-amber-500",  badge: "bg-amber-100 text-amber-700"  },
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",   icon: "text-blue-500",   badge: "bg-blue-100 text-blue-700"    },
  rose:   { bg: "bg-rose-50",   border: "border-rose-200",   icon: "text-rose-500",   badge: "bg-rose-100 text-rose-700"    },
  purple: { bg: "bg-purple-50", border: "border-purple-200", icon: "text-purple-500", badge: "bg-purple-100 text-purple-700"},
  orange: { bg: "bg-orange-50", border: "border-orange-200", icon: "text-orange-500", badge: "bg-orange-100 text-orange-700"},
  pink:   { bg: "bg-pink-50",   border: "border-pink-200",   icon: "text-pink-500",   badge: "bg-pink-100 text-pink-700"   },
  cyan:   { bg: "bg-cyan-50",   border: "border-cyan-200",   icon: "text-cyan-600",   badge: "bg-cyan-100 text-cyan-700"   },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-200", icon: "text-indigo-500", badge: "bg-indigo-100 text-indigo-700"},
  violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-500", badge: "bg-violet-100 text-violet-700"},
  red:    { bg: "bg-red-50",    border: "border-red-200",    icon: "text-red-500",    badge: "bg-red-100 text-red-700"     },
  slate:  { bg: "bg-slate-50",  border: "border-slate-200",  icon: "text-slate-400",  badge: "bg-slate-100 text-slate-600" },
};

// ─── Detection logic ──────────────────────────────────────────────────────────

function detectNonLabItems(results) {
  const findings = {}; // categoryId → { label, color, tip, items: [] }

  for (const result of results) {
    const haystack = [
      result.test_name,
      result.category,
      result.text_result,
      result.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    for (const cat of CATEGORIES) {
      if (cat.keywords.some((kw) => haystack.includes(kw))) {
        if (!findings[cat.id]) {
          findings[cat.id] = { ...cat, items: [] };
        }
        if (!findings[cat.id].items.includes(result.test_name)) {
          findings[cat.id].items.push(result.test_name);
        }
        break; // first matching category wins
      }
    }
  }

  return Object.values(findings);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NonLabWarningBanner({ results }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const findings = detectNonLabItems(results || []);
  if (findings.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800">
              Non-lab content detected in this report
            </p>
            <p className="text-[11px] text-amber-600 mt-0.5">
              The following items may not be standard blood test results. Consider removing them before saving, or silence them after saving.
            </p>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="text-amber-400 hover:text-amber-600 flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Per-category findings */}
      <div className="space-y-2">
        {findings.map((cat) => {
          const c = COLOUR[cat.color] || COLOUR.slate;
          return (
            <div key={cat.id} className={`rounded-lg border ${c.border} ${c.bg} px-3 py-2`}>
              <div className="flex items-start gap-2">
                <Info className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${c.icon}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-semibold ${c.icon}`}>{cat.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{cat.tip}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {cat.items.map((name) => (
                      <span key={name} className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${c.badge}`}>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-amber-500 italic">
          ℹ️ This tool is designed for blood / biochemistry test results only.
        </p>
        <Link
          to="/MedicalDocuments"
          className="flex items-center gap-1 text-[10px] font-semibold text-teal-600 hover:text-teal-800 whitespace-nowrap"
        >
          <ExternalLink className="w-3 h-3" /> Upload to Medical Documents
        </Link>
      </div>
    </div>
  );
}