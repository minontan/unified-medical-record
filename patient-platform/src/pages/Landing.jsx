import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import {
  Activity, Pill, UsersRound, Shield,
  ChevronRight, CheckCircle2, ArrowRight, Brain, ShieldCheck,
  Users, PersonStanding, FlaskConical, TestTube2, Upload, Camera,
  ScanLine, MapPin, Zap, Lock, Microscope, Stethoscope, Sparkles, Mail, Bone, FolderHeart, Baby, AlertTriangle, Cpu,
  Construction, Info,
} from "lucide-react";
import ContactForm from "@/components/contact/ContactForm";
import FAQSection from "@/components/landing/FAQSection";

// ─── Guideline source links (for AI search verifiability) ───────────────────
const guidelineLinks = [
  { name: "AHA", url: "https://www.heart.org/" },
  { name: "ADA", url: "https://diabetes.org/" },
  { name: "ACC", url: "https://www.acc.org/" },
  { name: "ESC", url: "https://www.escardio.org/" },
  { name: "USPSTF", url: "https://www.uspreventiveservicestaskforce.org/" },
  { name: "WHO", url: "https://www.who.int/" },
  { name: "Singapore MOH", url: "https://www.moh.gov.sg/" },
];

// ─── Mock screen components ────────────────────────────────────────────────

function CardiometabolicMock() {
  const alerts = [
    { label: "Blood Pressure", value: "138/88 mmHg", sev: "Stage 1 Hypertension", color: "amber" },
    { label: "LDL Cholesterol", value: "3.8 mmol/L", sev: "Borderline High", color: "amber" },
    { label: "HbA1c", value: "6.9%", sev: "At Target", color: "emerald" },
    { label: "eGFR", value: "72 mL/min", color: "emerald", sev: "Normal" },
  ];
  return (
    <div className="space-y-2 text-left">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Clinical Classification · 2026 Guidelines</p>
      </div>
      {alerts.map((a) => (
        <div key={a.label} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-${a.color}-50 flex items-center justify-center flex-shrink-0`}>
            <Activity className={`w-4 h-4 text-${a.color}-500`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800">{a.label}</p>
            <p className="text-[10px] text-slate-400 font-mono">{a.value}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-${a.color}-50 text-${a.color}-700`}>{a.sev}</span>
        </div>
      ))}
      <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-[10px] font-semibold text-blue-700">📋 Guideline Reference</p>
        <p className="text-[10px] text-blue-600 mt-0.5">The 2025 AHA guideline defines the blood pressure target for most adults as &lt;130/80 mmHg.</p>
      </div>
    </div>
  );
}

function ScreeningMock() {
  const recs = [
    { test: "Mammogram", freq: "Every 2 years", cancer: "Breast", color: "pink", badge: "Recommended" },
    { test: "FIT / Colonoscopy", freq: "Annual / 10 years", cancer: "Colorectal", color: "amber", badge: "Due" },
    { test: "HPV DNA Test", freq: "Every 5 years", cancer: "Cervical", color: "purple", badge: "Recommended" },
  ];
  return (
    <div className="space-y-2 text-left">
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-3 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
        <div>
          <p className="text-[11px] font-bold text-teal-700">Screening Information</p>
          <p className="text-[10px] text-teal-500">Age 52 · Female · Non-smoker · APCS 3</p>
        </div>
      </div>
      {recs.map((r) => (
        <div key={r.test} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-${r.color}-50 flex items-center justify-center flex-shrink-0`}>
            <Microscope className={`w-4 h-4 text-${r.color}-500`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800">{r.test}</p>
            <p className="text-[10px] text-slate-400">{r.freq} · {r.cancer} cancer</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-${r.color}-50 text-${r.color}-700`}>{r.badge}</span>
        </div>
      ))}
    </div>
  );
}

function MeasurementsMock() {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 text-left">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-600">Blood Pressure — Last 30 Days</span>
        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Hypertension</span>
      </div>
      <div className="flex items-end gap-1 h-20">
        {[70,82,75,88,78,85,72,80,68,75,83,76].map((h,i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full rounded-t-sm" style={{ height: `${h}%`, background: i===11 ? "#1d4ed8" : "#bfdbfe" }} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 pt-1">
        {[{label:"Latest",value:"128/82"},{label:"Average",value:"130/84"},{label:"Readings",value:"42"}].map((s) => (
          <div key={s.label} className="bg-white rounded-lg p-2 text-center border border-slate-100">
            <p className="text-xs font-bold text-slate-800">{s.value}</p>
            <p className="text-[10px] text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LabResultsMock() {
  const results = [
    { name: "HAEMOGLOBIN", val: "13.2", unit: "g/dL", status: "low" },
    { name: "FASTING GLUCOSE", val: "6.8", unit: "mmol/L", status: "high" },
    { name: "TOTAL CHOLESTEROL", val: "4.9", unit: "mmol/L", status: "normal" },
    { name: "HbA1c", val: "7.1", unit: "%", status: "high" },
    { name: "LDL", val: "2.8", unit: "mmol/L", status: "normal" },
    { name: "HDL", val: "1.3", unit: "mmol/L", status: "normal" },
  ];
  const s = { low:"bg-blue-50 text-blue-700", high:"bg-amber-50 text-amber-700", normal:"bg-emerald-50 text-emerald-700" };
  return (
    <div className="space-y-3 text-left">
      <div className="border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/60 p-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center"><Upload className="w-3.5 h-3.5 text-blue-500" /></div>
          <div className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center"><Camera className="w-3.5 h-3.5 text-blue-500" /></div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-blue-700">Upload PDF or take photo</p>
          <p className="text-[10px] text-blue-500">AI extracts all results automatically</p>
        </div>
        <ScanLine className="w-4 h-4 text-blue-400 flex-shrink-0" />
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Extracted — 10 Mar 2026</p>
      <div className="grid grid-cols-2 gap-1.5">
        {results.map((r) => (
          <div key={r.name} className="bg-white rounded-lg border border-slate-100 p-2">
            <p className="text-[9px] text-slate-400 truncate">{r.name}</p>
            <p className="text-sm font-bold text-slate-800 leading-tight">{r.val} <span className="text-[9px] font-normal text-slate-400">{r.unit}</span></p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s[r.status]}`}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MedicationsMock() {
  const meds = [
    { name: "Amlodipine", dose: "5mg", freq: "Once daily", color: "blue", cond: "HTN" },
    { name: "Metformin", dose: "500mg", freq: "Twice daily", color: "teal", cond: "DM" },
    { name: "Atorvastatin", dose: "20mg", freq: "Nightly", color: "indigo", cond: "HLD" },
  ];
  const allergies = ["Penicillin", "NSAIDs"];
  return (
    <div className="space-y-2 text-left">
      {meds.map((m) => (
        <div key={m.name} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg bg-${m.color}-50 flex items-center justify-center flex-shrink-0`}>
            <Pill className={`w-4 h-4 text-${m.color}-600`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800">{m.name} <span className="font-normal text-slate-400">{m.dose}</span></p>
            <p className="text-[10px] text-slate-400">{m.freq}</p>
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-${m.color}-50 text-${m.color}-700`}>{m.cond}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
        </div>
      ))}
      <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-bold text-amber-700">Known Allergies (self-reported)</p>
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {allergies.map(a => (
              <span key={a} className="text-[9px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{a}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WomensHealthMock() {
  const items = [
    { type: "Menstrual Cycle", detail: "Day 14 · Cycle length 28d", badge: "Ovulation", badgeColor: "pink" },
    { type: "Pregnancy Test", detail: "3 Feb 2026", badge: "Positive", badgeColor: "pink" },
    { type: "Blood Pressure", detail: "118/76 mmHg · Week 12", badge: "Normal", badgeColor: "emerald" },
    { type: "Folic Acid", detail: "450 µg/dL · Week 12", badge: "Good", badgeColor: "emerald" },
  ];
  return (
    <div className="space-y-2 text-left">
      {items.map((m) => (
        <div key={m.type} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
            <PersonStanding className="w-4 h-4 text-pink-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800">{m.type}</p>
            <p className="text-[10px] text-slate-400">{m.detail}</p>
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-${m.badgeColor}-50 text-${m.badgeColor}-700`}>{m.badge}</span>
        </div>
      ))}
    </div>
  );
}

function MskMock() {
  const items = [
    { label: "BMD T-score", value: "-1.8", badge: "Osteopenia", color: "purple" },
    { label: "SARC-F Score", value: "3/10", badge: "Low Risk", color: "emerald" },
    { label: "Gait Speed", value: "0.92 m/s", badge: "Normal", color: "emerald" },
    { label: "Vitamin D", value: "22 ng/mL", badge: "Insufficient", color: "amber" },
  ];
  return (
    <div className="space-y-2 text-left">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-3 flex items-center gap-2">
        <Bone className="w-4 h-4 text-purple-600 flex-shrink-0" />
        <div>
          <p className="text-[11px] font-bold text-purple-700">MSK Risk Classification</p>
          <p className="text-[10px] text-purple-500">EWGSOP2 · FRAX · SARC-F frameworks</p>
        </div>
      </div>
      {items.map((i) => (
        <div key={i.label} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800">{i.label}</p>
            <p className="text-[10px] text-slate-400 font-mono">{i.value}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-${i.color}-50 text-${i.color}-700`}>{i.badge}</span>
        </div>
      ))}
    </div>
  );
}

function MedicalDocsMock() {
  const docs = [
    { icon: "🩻", type: "Radiology", title: "Chest X-Ray", date: "12 Mar 2026", badge: "Normal" },
    { icon: "🫀", type: "ECG", title: "12-Lead ECG", date: "5 Jan 2026", badge: "Reviewed" },
    { icon: "🦴", type: "DXA Scan", title: "Bone Density Report", date: "2 Feb 2026", badge: "Osteopenia" },
  ];
  return (
    <div className="space-y-2 text-left">
      <div className="flex items-center gap-2 mb-3">
        <FolderHeart className="w-4 h-4 text-teal-600 flex-shrink-0" />
        <p className="text-[11px] font-bold text-teal-700">Secure Medical Archive</p>
      </div>
      {docs.map((d) => (
        <div key={d.title} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
          <span className="text-xl flex-shrink-0">{d.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800">{d.title}</p>
            <p className="text-[10px] text-slate-400">{d.type} · {d.date}</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">{d.badge}</span>
        </div>
      ))}
    </div>
  );
}

function FamilyHubMock() {
  const children = [
    { name: "Emily", age: "4 yrs", badge: "All vaccines up to date", color: "teal" },
    { name: "Lucas", age: "8 yrs", badge: "Due: MMR booster", color: "amber" },
  ];
  return (
    <div className="space-y-2 text-left">
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-3 flex items-center gap-2">
        <Baby className="w-4 h-4 text-teal-600 flex-shrink-0" />
        <div>
          <p className="text-[11px] font-bold text-teal-700">Family Hub</p>
          <p className="text-[10px] text-teal-500">2 children · Growth & vaccination tracking</p>
        </div>
      </div>
      {children.map((c) => (
        <div key={c.name} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-sm font-bold text-teal-700 flex-shrink-0">{c.name[0]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800">{c.name}</p>
            <p className="text-[10px] text-slate-400">{c.age}</p>
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-${c.color}-50 text-${c.color}-700 text-right max-w-[90px] leading-tight`}>{c.badge}</span>
        </div>
      ))}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1">
        <p className="text-[10px] text-slate-500 font-semibold mb-1">Recent milestone</p>
        <p className="text-[10px] text-slate-400">Emily · First steps recorded · 14 months</p>
      </div>
    </div>
  );
}

function GroupsMock() {
  const groups = [
    { name: "Hypertension Warriors", members: 234, tag: "Hypertension", color: "blue" },
    { name: "Type 2 Diabetes Hub", members: 189, tag: "Diabetes", color: "teal" },
    { name: "Cholesterol Busters", members: 97, tag: "Hyperlipidaemia", color: "indigo" },
  ];
  return (
    <div className="space-y-2 text-left">
      {groups.map((g) => (
        <div key={g.name} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">{g.name}</p>
            <p className="text-[10px] text-slate-400">{g.members} members</p>
          </div>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-${g.color}-50 text-${g.color}-700`}>{g.tag}</span>
        </div>
      ))}
    </div>
  );
}

function DigitalTwinMock() {
  const models = [
    { label: "HbA1c Trajectory", score: "6.4%", risk: "Borderline", trend: "↑ Worsening", color: "amber" },
    { label: "ASCVD 10-Year Risk", score: "8.2%", risk: "Moderate", trend: "→ Stable", color: "orange" },
    { label: "CKD Risk", score: "22", risk: "Low", trend: "↓ Improving", color: "emerald" },
  ];
  return (
    <div className="space-y-2 text-left">
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 mb-3 flex items-center gap-2">
        <Brain className="w-4 h-4 text-violet-600 flex-shrink-0" />
        <div>
          <p className="text-[11px] font-bold text-violet-700">Predictive Engine</p>
          <p className="text-[10px] text-violet-500">Trajectory modelling · Risk scoring</p>
        </div>
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 uppercase">Building</span>
      </div>
      {models.map((m) => (
        <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800">{m.label}</p>
            <p className="text-[10px] text-slate-400">{m.trend}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">{m.score}</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-${m.color}-50 text-${m.color}-700`}>{m.risk}</span>
          </div>
        </div>
      ))}
      <div className="bg-violet-50 border border-violet-100 rounded-xl p-2.5">
        <p className="text-[10px] font-semibold text-violet-700">📊 Trend Information</p>
        <p className="text-[10px] text-violet-600 mt-0.5">An HbA1c of 6.4% falls within the pre-diabetes range (5.7–6.4%) per the ADA classification. Diet and physical activity are known modifiable factors.</p>
      </div>
    </div>
  );
}

// ─── Features config ────────────────────────────────────────────────────────

const features = [
  {
    icon: Brain,
    title: "Cardiometabolic Insights",
    subtitle: "How does Unified Medical Record classify cardiometabolic risk?",
    description: "Unified Medical Record applies 2025–2026 AHA, ADA, ACC & ESC clinical guidelines to your health data, classifying your blood pressure, glucose, HbA1c and lipids against published clinical thresholds. Classifications are informational and help you understand where your readings sit within established ranges.",
    color: "blue",
    mockScreen: "cardiometabolic",
    bullets: [
      "Hypertension, diabetes & lipid risk classification",
      "Informational classifications based on published thresholds",
      "References 2025–2026 international guidelines (AHA, ADA, ACC, ESC)",
      "eGFR and CKM cardiorenal risk framework",
    ],
  },
  {
    icon: Bone,
    title: "Bone, Muscle & Frailty",
    subtitle: "How are bone density and muscle health assessed?",
    description: "Unified Medical Record uses BMD T-scores, the SARC-F questionnaire, handgrip strength and gait speed to classify bone density and muscle health according to EWGSOP2 and FRAX frameworks. All classifications are derived algorithmically from your inputs and are informational only.",
    color: "purple",
    mockScreen: "msk",
    bullets: [
      "BMD T-score: osteoporosis / osteopenia classification",
      "SARC-F & EWGSOP2 sarcopenia risk screening",
      "Frailty index based on gait speed & chair stand tests",
      "Vitamin D, protein intake & exercise tracking",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Cancer Screening",
    subtitle: "What cancer screening is recommended for you?",
    description: "Unified Medical Record provides screening information for breast, cervical, colorectal, and lung cancer based on your age, sex, family history, and smoking status. Protocols are drawn from USPSTF, WHO, Singapore MOH and Malaysia CPG guidelines. Screening eligibility should always be confirmed with a qualified healthcare provider.",
    color: "teal",
    mockScreen: "screening",
    bullets: [
      "Breast, cervical, colorectal & lung cancer protocols",
      "APCS score for colorectal risk stratification",
      "Pack-year lung cancer LDCT screening eligibility",
      "Clinical information matched to your risk profile",
    ],
  },
  {
    icon: Activity,
    title: "Health Measurements",
    subtitle: "How do your readings change over time?",
    description: "Log blood pressure, glucose, cholesterol, HbA1c, weight and more. Interactive charts visualise your readings over time, so you can review your trends and discuss them with your healthcare provider.",
    color: "blue",
    mockScreen: "measurements",
    bullets: [
      "Blood pressure, glucose, cholesterol & weight",
      "Trend charts over any time period",
      "Condition-specific views — hypertension, diabetes, lipids",
    ],
  },
  {
    icon: TestTube2,
    title: "Lab Results",
    subtitle: "How does Unified Medical Record extract lab results?",
    description: "Upload a blood test PDF or photo and Unified Medical Record uses AI to extract test names, values, units, and reference ranges. View trends across reports and see which results fall outside reference ranges. Always verify extracted values against your original report.",
    color: "indigo",
    mockScreen: "labresults",
    bullets: [
      "AI extracts every test, value & unit automatically",
      "Flags results outside reference ranges",
      "Trend analysis across multiple reports over time",
      "Supports PDF, JPEG, PNG lab reports",
    ],
  },
  {
    icon: Pill,
    title: "Medications & Allergies",
    subtitle: "How does Unified Medical Record track medications and allergies?",
    description: "Maintain a complete medication history with dosages, frequencies, and prescriptions. Record known allergies to medications, foods, and environmental triggers. Allergy information is self-reported and provided as reference only — it does not replace formal allergy assessment by a licensed pharmacist or physician.",
    color: "teal",
    mockScreen: "medications",
    bullets: [
      "Complete active and past medication history",
      "Photo-capture prescriptions for reference",
      "Known allergies tracked across medications, foods & triggers",
      "Allergy information is self-reported reference only",
    ],
  },
  {
    icon: PersonStanding,
    title: "Women's Health",
    subtitle: "What women's health data can Unified Medical Record track?",
    description: "Unified Medical Record supports menstrual cycle logging, ovulation tracking, and pregnancy health monitoring — including blood markers, immunisations, blood pressure and glucose. This provides a consolidated view of your reproductive and maternal health data.",
    color: "pink",
    mockScreen: "womenshealth",
    bullets: [
      "Menstrual cycle & ovulation tracking",
      "Pregnancy blood markers, BP & glucose monitoring",
      "Immunisation records for pregnancy",
    ],
  },
  {
    icon: FolderHeart,
    title: "Medical Documents",
    subtitle: "How does Unified Medical Record store medical documents?",
    description: "Upload and archive radiology, ECG, bone density, spirometry, histopathology and other clinical reports in one secure place. Unified Medical Record's AI extracts a summary from each document for quick reference. Files are stored in secure private storage and are never publicly accessible.",
    color: "teal",
    mockScreen: "medicaldocs",
    bullets: [
      "Radiology, ECG, DXA, spirometry & pathology",
      "AI-extracted summary of each report",
      "Secure private file storage — never publicly accessible",
      "Referenced in Health Summary for your doctor",
    ],
  },
  {
    icon: Baby,
    title: "Family Hub",
    subtitle: "How does Unified Medical Record track children's health?",
    description: "Manage children's health records from a single hub — growth measurements, vaccinations, medical visits, milestones, allergies and known conditions. Generate printable health summaries and transfer care to the child's own account when they come of age.",
    color: "teal",
    mockScreen: "familyhub",
    bullets: [
      "Growth tracking — height, weight, head circumference",
      "Vaccination records with WHO schedule reference",
      "Milestones, allergies & medical history per child",
      "Transfer-of-care workflow when child comes of age",
    ],
  },
  {
    icon: UsersRound,
    title: "Community & Support Groups",
    subtitle: "How does the Unified Medical Record community work?",
    description: "Connect with others living with the same conditions through condition-specific support groups. Share experiences and exchange information with full privacy controls, choosing to post openly or anonymously.",
    color: "blue",
    mockScreen: "groups",
    bullets: [
      "Condition-specific peer support communities",
      "Share your journey anonymously or openly",
      "Post, react, comment — with full privacy controls",
    ],
  },
];

// ─── Features in development ─────────────────────────────────────────────────

const buildingFeatures = [
  {
    icon: Cpu,
    title: "Digital Human Twin",
    subtitle: "Predictive modelling engine",
    description: "Computes mathematical risk trajectories for HbA1c, blood pressure, LDL, CKD, ASCVD, and fracture risk. The predictive engine is experimental and under active development — all projections are informational and have not been validated in clinical trials.",
    color: "violet",
    bullets: [
      "HbA1c, BP & LDL trajectory modelling",
      "ASCVD 10-year cardiovascular risk",
      "CKD risk scoring via eGFR trends",
      "FRAX fracture & sarcopenia risk index",
      "Experimental — not validated in clinical trials",
    ],
    mockScreen: "digitaltwin",
  },
  {
    icon: MapPin,
    title: "Find a Doctor / Clinic",
    subtitle: "Locate nearby care providers",
    description: "Search and filter GPs, specialists, and diagnostic centres near you. Share your Unified Medical Record health summary with your chosen provider when booking consultations.",
    color: "blue",
    bullets: [
      "GP, specialist & diagnostic centre search",
      "Filter by condition specialty",
      "Map-based proximity search",
      "Direct consultation booking",
    ],
  },
  {
    icon: FlaskConical,
    title: "Diagnostic Centre Finder",
    subtitle: "Blood tests & imaging near you",
    description: "Find accredited labs and radiology centres for blood draws, X-rays, MRIs and more. Compare services, opening hours, and walk-in availability.",
    color: "indigo",
    bullets: [
      "Blood testing, radiology & ECG services",
      "Walk-in vs appointment availability",
      "Opening hours & contact info",
      "Link results back to your Unified Medical Record record",
    ],
  },
];

const colorMap = {
  blue:   { bg: "bg-blue-50",   icon: "bg-blue-100 text-blue-600",   border: "border-blue-200",   check: "text-blue-500",   badge: "bg-blue-600" },
  teal:   { bg: "bg-teal-50",   icon: "bg-teal-100 text-teal-600",   border: "border-teal-200",   check: "text-teal-500",   badge: "bg-teal-600" },
  indigo: { bg: "bg-indigo-50", icon: "bg-indigo-100 text-indigo-600", border: "border-indigo-200", check: "text-indigo-500", badge: "bg-indigo-600" },
  pink:   { bg: "bg-pink-50",   icon: "bg-pink-100 text-pink-600",   border: "border-pink-200",   check: "text-pink-500",   badge: "bg-pink-600" },
  purple: { bg: "bg-purple-50", icon: "bg-purple-100 text-purple-600", border: "border-purple-200", check: "text-purple-500", badge: "bg-purple-600" },
  violet: { bg: "bg-violet-50", icon: "bg-violet-100 text-violet-600", border: "border-violet-200", check: "text-violet-500", badge: "bg-violet-600" },
};

const mockComponents = {
  cardiometabolic: CardiometabolicMock,
  screening: ScreeningMock,
  measurements: MeasurementsMock,
  labresults: LabResultsMock,
  medications: MedicationsMock,
  womenshealth: WomensHealthMock,
  msk: MskMock,
  medicaldocs: MedicalDocsMock,
  familyhub: FamilyHubMock,
  groups: GroupsMock,
  digitaltwin: DigitalTwinMock,
};

const principles = [
  { icon: Lock, title: "You own your data", body: "Your health records stay yours — private, secure, and portable. No one monetises your health data." },
  { icon: Brain, title: "AI that explains itself", body: "Every classification includes the clinical reasoning and guideline source behind it, so you understand the basis for each result." },
  { icon: Zap, title: "Access current evidence", body: "Guidelines referenced are current to 2025–2026. The latest clinical science, made accessible in one place." },
  { icon: Stethoscope, title: "Walk in informed", body: "Arrive at every consultation with your numbers, trends, and questions organised. Informed patients engage more effectively in their care." },
];

export default function Landing() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then((isAuth) => {
      setAuthed(isAuth);
    });
  }, []);

  const handleLogin = () => base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  const handleSignUp = () => base44.auth.redirectToLogin(createPageUrl("Dashboard"));

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <img
            src="/logo.png"
            alt="Unified Medical Record"
            className="h-9 w-auto"
          />
          <div className="flex items-center gap-3">
            <a href="/" onClick={(e) => { e.preventDefault(); handleLogin(); }} className="text-sm font-semibold text-slate-600 hover:text-blue-700 px-4 py-2.5 rounded-xl transition-colors">
              Log In
            </a>
            <a href="/" onClick={(e) => { e.preventDefault(); handleSignUp(); }} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-700/20">
              Get Started <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-teal-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-1/3 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-400 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-indigo-600 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span className="text-xs font-semibold text-blue-200 tracking-wide uppercase">Healthcare — Information You Own</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Your health, your data,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400">
              your decisions.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-5">
            Unified Medical Record is a personal health information platform that applies evidence-based clinical guidelines to your own health data — helping you understand your lab results, blood pressure trends, screening options, and cardiometabolic risk classification.
          </p>
          <p className="text-base text-blue-300 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
            Understand your health data. Access current evidence. Make informed decisions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/" onClick={(e) => { e.preventDefault(); handleSignUp(); }} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-xl shadow-blue-600/40">
              Start for free <ArrowRight className="w-5 h-5" />
            </a>
            <a href="/" onClick={(e) => { e.preventDefault(); handleLogin(); }} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-all">
              Log In
            </a>
          </div>

          {/* Hero stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
            {[
              { icon: Brain, value: "2025–26", label: "Clinical guidelines" },
              { icon: Activity, value: "10+", label: "Biomarkers tracked" },
              { icon: ShieldCheck, value: "4", label: "Cancer types screened" },
              { icon: Baby, value: "New", label: "Family Hub" },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center backdrop-blur-sm">
                <s.icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-3xl font-extrabold text-white">{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is Unified Medical Record? — Entity definition for AI search */}
      <section className="bg-white border-b border-slate-100 py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed">
            Unified Medical Record is a personal health information platform that applies evidence-based clinical guidelines — from the AHA, ADA, ACC, ESC, USPSTF, and WHO — to your own health data, helping you understand your lab results, blood pressure trends, cancer screening options, and cardiometabolic risk classification.
          </h2>
          <p className="text-sm text-slate-500 mt-4">Operated by MedNex Pte Ltd · Singapore</p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {guidelineLinks.map((g) => (
              <a key={g.name} href={g.url} target="_blank" rel="noopener noreferrer"
                 className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors">
                {g.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Manifesto strip */}
      <section className="bg-blue-700 text-white py-12 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xl md:text-2xl font-bold leading-relaxed max-w-4xl mx-auto">
            "Your health is not a single clinic visit once a year.<br className="hidden md:block" />
            It's every reading, every trend, every question you bring to your doctor.<br className="hidden md:block" />
            <span className="text-blue-200">Unified Medical Record gives you the information to understand it all."</span>
          </p>
        </div>
      </section>

      {/* Principles */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Why Unified Medical Record</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Why was Unified Medical Record built?</h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">Not your hospital. Not your insurer. You.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {principles.map((p) => (
            <div key={p.title} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:shadow-blue-50 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <p.icon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">{p.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features — Live */}
      <section className="max-w-6xl mx-auto px-6 py-8 space-y-24 pb-24">
        <div className="text-center mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">What's inside</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">What can Unified Medical Record do?</h2>
          <p className="text-slate-400 mt-3 text-sm max-w-xl mx-auto">All features below are live and available today.</p>
        </div>

        {features.map((f, i) => {
          const MockComp = mockComponents[f.mockScreen];
          const c = colorMap[f.color] || colorMap.blue;
          const isEven = i % 2 === 0;
          return (
            <div key={f.title} className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-12 md:gap-20`}>
              <div className="flex-1 space-y-5">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${c.bg} ${c.border} border`}>
                  <f.icon className={`w-4 h-4 ${c.icon.split(" ")[1]}`} />
                  <span className={`text-xs font-bold uppercase tracking-wide ${c.icon.split(" ")[1]}`}>{f.title}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">{f.subtitle}</h2>
                <p className="text-slate-500 leading-relaxed text-base">{f.description}</p>
                <ul className="space-y-2">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${c.check}`} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full max-w-md">
                <div className={`rounded-2xl border-2 ${c.border} ${c.bg} p-1 shadow-xl`}>
                  <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <div className="flex-1 mx-3 bg-slate-200 rounded-full h-4" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-6 h-6 rounded-lg ${c.icon.split(" ")[0]} flex items-center justify-center`}>
                          <f.icon className={`w-3.5 h-3.5 ${c.icon.split(" ")[1]}`} />
                        </div>
                        <p className="text-xs font-bold text-slate-700">{f.title}</p>
                      </div>
                      <MockComp />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Features — Building */}
      <section className="bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-full px-4 py-1.5 mb-6">
              <Construction className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-xs font-semibold text-amber-200 tracking-wide uppercase">Coming Soon</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">What's coming next?</h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">These features are actively in development. Early access users will be notified as each goes live.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {buildingFeatures.map((f) => {
              const c = colorMap[f.color] || colorMap.violet;
              const MockComp = f.mockScreen ? mockComponents[f.mockScreen] : null;
              return (
                <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${c.icon.split(" ")[0]} flex items-center justify-center`}>
                      <f.icon className={`w-5 h-5 ${c.icon.split(" ")[1]}`} />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wide">🚧 Building</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-xs text-slate-400 mb-4 font-medium">{f.subtitle}</p>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">{f.description}</p>
                  <ul className="space-y-1.5">
                    {f.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-slate-400">
                        <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${c.check}`} />
                        {b}
                      </li>
                    ))}
                  </ul>
                  {MockComp && (
                    <div className="mt-5 bg-white/5 border border-white/10 rounded-xl p-3">
                      <MockComp />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Disclaimer section */}
      <section className="bg-slate-50 border-y border-slate-200 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Important Disclaimer</h2>
              <p className="text-sm text-slate-500">Please read before using Unified Medical Record.</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>
              <strong className="text-slate-800">Unified Medical Record is a personal health information tool, not a medical device or clinical service.</strong> All content, insights, classifications, alerts, and information generated by Unified Medical Record are for informational and educational purposes only. They do not constitute, and must not be used as a substitute for, professional medical advice, clinical diagnosis, or treatment.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              {[
                {
                  title: "Cardiometabolic Insights",
                  body: "Risk classifications are derived from published 2025–2026 AHA, ADA, ACC and ESC guidelines for informational purposes only. They are not diagnostic decisions. Any change to your medication, diet or clinical management must be discussed with and directed by your treating physician."
                },
                {
                  title: "Cancer Screening",
                  body: "Screening information is generated from USPSTF, WHO, Singapore MOH and Malaysia CPG protocols based on self-reported data. Unified Medical Record cannot verify the accuracy of entered data. Screening eligibility and timing must always be confirmed with a qualified healthcare provider."
                },
                {
                  title: "Musculoskeletal & Frailty",
                  body: "BMD, sarcopenia and frailty assessments are algorithmic risk-stratification tools only. They do not replace a formal DXA scan report, specialist interpretation, or clinical assessment by a physician, physiotherapist, or rheumatologist."
                },
                {
                  title: "Lab Results",
                  body: "AI-extracted lab values may contain errors due to document quality, formatting or language variations. Always verify extracted values against your original report. Out-of-range flags do not constitute clinical alerts — consult your doctor for interpretation."
                },
                {
                  title: "Digital Human Twin (Predictive Engine)",
                  body: "The Predictive Twin is an experimental, early-access feature currently under active development. Trajectory models, risk scores, and AI-generated insights are mathematical projections based on historical data patterns and must not be used to make clinical or treatment decisions. Predictions carry inherent uncertainty and have not been validated in a clinical trial setting."
                },
                {
                  title: "Medications & Allergies",
                  body: "Allergy information recorded in Unified Medical Record is self-reported and is provided as a reference only. It does not replace a formal allergy assessment or prescribing safety check by a licensed pharmacist or prescribing physician. Unified Medical Record does not perform drug-allergy interaction screening."
                },
                {
                  title: "Family Hub & Children's Health",
                  body: "Child health records and vaccination data recorded in Unified Medical Record are informational tools for parental reference only. They do not replace assessments by a paediatrician, child health nurse, or other qualified healthcare professional. Vaccination schedules shown are for general guidance and may differ from national immunisation programmes in your country."
                },
                {
                  title: "Health Summary Report",
                  body: "The generated health summary compiles self-entered data into a structured document to facilitate discussions with your healthcare provider. It is not a clinical report, discharge summary or medical record, and should not be relied upon as such."
                },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-bold text-slate-700 mb-1.5">{item.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500 pt-2">
              By using Unified Medical Record, you acknowledge that MedNex Pte Ltd, its directors, employees, and clinical advisors accept no liability for clinical decisions, health outcomes, or actions taken based on information displayed in the platform. Unified Medical Record is not a regulated medical device and has not been evaluated or approved by any national health authority for clinical use.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative bg-gradient-to-r from-blue-700 via-blue-800 to-teal-800 text-white py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-300 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-200 mb-5">How do I get started?</p>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            Ready to explore your health data?<br />
            <span className="text-blue-300">Start using Unified Medical Record to understand<br className="hidden md:block" />your numbers and screening options.</span>
          </h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Evidence-based health information. Screening guidance. Cardiometabolic classification. Family health tracking. All in one place — owned entirely by you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/" onClick={(e) => { e.preventDefault(); handleSignUp(); }} className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-bold px-10 py-4 rounded-2xl text-base transition-all shadow-xl">
              Start for free <ArrowRight className="w-5 h-5" />
            </a>
            <a href="/" onClick={(e) => { e.preventDefault(); handleLogin(); }} className="inline-flex items-center gap-2 border border-white/30 hover:bg-white/10 text-white font-bold px-10 py-4 rounded-2xl text-base transition-all">
              Log In
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Get In Touch</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Ask us anything.</h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">Questions about Unified Medical Record, clinical content, or how it works? We read every message personally.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="space-y-4">
            {[
              { icon: Mail, title: "General Enquiries", body: "Questions about features, your account, or anything Unified Medical Record-related.", color: "blue" },
              { icon: Shield, title: "Clinical Queries", body: "For clinical content questions, we'll route your message to our advisory team.", color: "teal" },
            ].map((c) => (
              <div key={c.title} className={`bg-${c.color}-50 border border-${c.color}-200 rounded-2xl p-5`}>
                <div className={`w-9 h-9 rounded-xl bg-${c.color}-100 flex items-center justify-center mb-3`}>
                  <c.icon className={`w-4 h-4 text-${c.color}-600`} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">{c.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{c.body}</p>
              </div>
            ))}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <p className="text-xs font-bold text-slate-700 mb-1">Response time</p>
              <p className="text-xs text-slate-500">We typically reply within 1–2 business days, Mon–Fri (SGT).</p>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img
            src="/logo.png"
            alt="Unified Medical Record"
            className="h-8 w-auto"
          />
          <p className="text-xs text-slate-400 text-center max-w-md">
            Unified Medical Record provides health information only and is not a medical device. Always consult your healthcare provider before making clinical decisions. Not approved for diagnostic use.
          </p>
          <p className="text-xs text-slate-400">A MedNex Pte Ltd project</p>
        </div>
      </footer>
    </div>
  );
}