import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  FlaskConical, Activity, Pill, PersonStanding, Bone, FolderHeart,
  ShieldCheck, Brain, Dna, Cpu, Layers, ChevronRight, Construction,
  CheckCircle2, Circle, Clock, Zap, HeartPulse, Microscope, Atom,
  BarChart3, Network, Lock
} from "lucide-react";

const PHASES = [
  {
    phase: 1,
    label: "Clinical Data Layer",
    status: "active",
    description: "Aggregate all structured health records currently in Unified Medical Record as the foundational dataset for the twin.",
    pillars: [
      { label: "Physiological Measurements", icon: Activity, link: "Measurements", done: true },
      { label: "Lab Results", icon: FlaskConical, link: "LabResults", done: true },
      { label: "Medications", icon: Pill, link: "Medications", done: true },
      { label: "Medical Documents", icon: FolderHeart, link: "MedicalDocuments", done: true },
      { label: "Bone, Muscle & Frailty (MSK)", icon: Bone, link: "MusculoskeletalHealth", done: true },
      { label: "Women's Health", icon: PersonStanding, link: "WomensHealth", done: true },
      { label: "Cancer Screening Profile", icon: ShieldCheck, link: "ScreeningDashboard", done: true },
      { label: "Cardiometabolic Insights", icon: HeartPulse, link: "CardiometabolicInsights", done: true },
    ]
  },
  {
    phase: 2,
    label: "Predictive Modelling Engine",
    status: "planned",
    description: "Build longitudinal trend models and risk trajectories using the clinical data layer. Predict 3–12 month health trajectories for key cardiometabolic markers.",
    pillars: [
      { label: "HbA1c & Glucose Trend Forecasting", icon: BarChart3, done: false },
      { label: "Blood Pressure Trajectory Modelling", icon: Activity, done: false },
      { label: "CKD Risk Scoring (inspired by Mesh Bio)", icon: Microscope, done: false },
      { label: "Sarcopenia & Frailty Progression", icon: Bone, done: false },
      { label: "Metabolic Age Calculation", icon: Cpu, done: false },
    ]
  },
  {
    phase: 3,
    label: "Conversational AI Interface",
    status: "planned",
    description: "Integrate a retrieval-augmented LLM (DT-GPT pattern) so users can ask natural-language questions about their own health data and receive explainable, evidence-cited answers.",
    pillars: [
      { label: "Natural Language Health Q&A", icon: Brain, done: false },
      { label: "Reasoning Transparency (RAG)", icon: Network, done: false },
      { label: "Anomaly Detection & Alerts", icon: Zap, done: false },
      { label: "Clinician-Ready Summaries", icon: Layers, done: false },
    ]
  },
  {
    phase: 4,
    label: "Multiscale Biological Integration",
    status: "future",
    description: "Extend the twin toward molecular-level data — genomics, microbiome, wearable streams — enabling true Whole Body Digital Twin modelling aligned with the MSDT framework.",
    pillars: [
      { label: "Genomics / Omics Data Ingestion", icon: Dna, done: false },
      { label: "Continuous Wearable Sync (FHIR)", icon: Activity, done: false },
      { label: "Organ-Level Simulation Models", icon: Atom, done: false },
      { label: "Patient Data Sovereignty (SSI/Blockchain)", icon: Lock, done: false },
    ]
  },
];

const STATUS_CONFIG = {
  active:   { label: "Phase Active",  badge: "bg-teal-100 text-teal-700 border border-teal-300",  dot: "bg-teal-500" },
  planned:  { label: "Planned",       badge: "bg-amber-100 text-amber-700 border border-amber-300", dot: "bg-amber-400" },
  future:   { label: "Future Vision", badge: "bg-violet-100 text-violet-700 border border-violet-300", dot: "bg-violet-400" },
};

export default function DigitalTwinTeaser({ dataReadiness }) {
  return (
    <div className="space-y-5">
      {/* Under Construction Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
        <Construction className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800">🚧 Under Construction & Development</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            The Digital Twin module is a long-term research-driven initiative. What you see below is the <strong>architectural roadmap</strong> — Phase 1 data is already being collected within Unified Medical Record. Subsequent phases will be progressively activated as modelling and AI capabilities are built and validated. Clinical governance and responsible AI principles guide every step.
          </p>
        </div>
      </div>

      {/* Hero Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-400 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-teal-400" />
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Digital Human Twin</span>
          </div>
          <h2 className="text-xl font-bold mb-2 leading-tight">Your Personalised Physiological Mirror</h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            A continuously updated virtual replica of your health, synthesising every measurement, lab result, medication and assessment you record — evolving alongside you to surface personalised predictions and proactive health guidance.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-teal-400" /> Multiscale Physiological Mapping</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-teal-400" /> FHIR-Ready Architecture</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-teal-400" /> Human-in-the-Loop AI</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-teal-400" /> Evidence-Based Predictions</span>
          </div>
        </div>
      </div>

      {/* Data Readiness Panel */}
      {dataReadiness && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-1">Phase 1 Data Readiness</h3>
          <p className="text-xs text-slate-400 mb-4">Your current data captured in Unified Medical Record that will feed the twin's clinical layer.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {dataReadiness.map((item) => (
              <div key={item.label} className={`rounded-xl p-3 border ${item.count > 0 ? "bg-teal-50 border-teal-200" : "bg-slate-50 border-slate-200"}`}>
                <p className={`text-2xl font-bold ${item.count > 0 ? "text-teal-700" : "text-slate-300"}`}>{item.count}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase Roadmap */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Implementation Roadmap</h3>
        {PHASES.map((p) => {
          const sc = STATUS_CONFIG[p.status];
          return (
            <div key={p.phase} className={`bg-white rounded-2xl border p-5 ${p.status === "active" ? "border-teal-300 shadow-sm shadow-teal-100" : "border-slate-200/80"}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${p.status === "active" ? "bg-teal-600 text-white" : p.status === "planned" ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"}`}>
                    {p.phase}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{p.label}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${sc.badge}`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${sc.dot}`} />
                  {sc.label}
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-3 leading-relaxed">{p.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {p.pillars.map((pillar) => (
                  <div key={pillar.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${pillar.done ? "bg-teal-50 text-teal-800" : "bg-slate-50 text-slate-500"}`}>
                    {pillar.done
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                      : <Circle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
                    <pillar.icon className={`w-3 h-3 flex-shrink-0 ${pillar.done ? "text-teal-500" : "text-slate-400"}`} />
                    <span>{pillar.label}</span>
                    {pillar.link && pillar.done && (
                      <Link to={createPageUrl(pillar.link)} className="ml-auto text-teal-500 hover:text-teal-700">
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                    {!pillar.done && (
                      <Clock className="w-3 h-3 ml-auto text-slate-300 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Research Basis Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-xs font-semibold text-blue-800 mb-1">Research Basis</p>
        <p className="text-xs text-blue-700 leading-relaxed">
          This roadmap is informed by published research on Multiscale Digital Twins (MSDTs), the Twin Health / Cleveland Clinic metabolic twin RCT, Mesh Bio's HealthVector Diabetes (Singapore), Dassault Systèmes' Living Heart Project, and the DT-GPT / HDTwin LLM frameworks. Architecture follows IEEE P3333.1.3 multiscale health twin benchmarks and HL7 FHIR interoperability standards.
        </p>
      </div>
    </div>
  );
}