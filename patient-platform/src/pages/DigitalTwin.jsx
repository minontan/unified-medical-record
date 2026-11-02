import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Brain, Map, Cpu } from "lucide-react";
import DigitalTwinTeaser from "@/components/digitaltwin/DigitalTwinTeaser";
import PredictiveDashboard from "@/components/digitaltwin/PredictiveDashboard";

const TABS = [
  { id: "roadmap", label: "Roadmap", icon: Map },
  { id: "phase2",  label: "Predictive Engine", icon: Cpu },
];

export default function DigitalTwin() {
  const [activeTab, setActiveTab] = useState("roadmap");
  const [loading, setLoading] = useState(true);
  const [isComputing, setIsComputing] = useState(false);
  const [dataReadiness, setDataReadiness] = useState([]);
  const [models, setModels] = useState([]);
  const [insights, setInsights] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const u = await base44.auth.me();
    const email = u.email;

    const [measurements, labResults, medications, medDocs, mskAssessments, womensLogs, appointments, latestModels, latestInsights] = await Promise.all([
      base44.entities.HealthMeasurement.filter({ created_by: email }, "-measured_at", 500),
      base44.entities.LabResult.filter({ created_by: email }, "-collected_at", 200),
      base44.entities.Medication.filter({ created_by: email }, "-created_date", 100),
      base44.entities.MedicalDocument.filter({ created_by: email }, "-report_date", 200),
      base44.entities.MusculoskeletalAssessment.filter({ created_by: email }, "-assessed_at", 10),
      base44.entities.WomensHealthLog.filter({ created_by: email }, "-logged_at", 200),
      base44.entities.Appointment.filter({ created_by: email }, "-appointment_date", 50),
      base44.entities.PredictiveModel.filter({ created_by: email, is_latest: true }, "-computed_at", 20),
      base44.entities.PredictiveInsight.filter({ created_by: email, is_dismissed: false }, "-generated_at", 20),
    ]);

    setDataReadiness([
      { label: "Measurements",        count: measurements.length },
      { label: "Lab Results",         count: labResults.length },
      { label: "Active Medications",  count: medications.filter(m => m.is_active).length },
      { label: "Medical Documents",   count: medDocs.length },
      { label: "MSK Assessments",     count: mskAssessments.length },
      { label: "Women's Health Logs", count: womensLogs.length },
      { label: "Appointments",        count: appointments.length },
      { label: "Past Medications",    count: medications.filter(m => !m.is_active).length },
    ]);
    setModels(latestModels);
    setInsights(latestInsights);
    setLoading(false);
  };

  const handleRecompute = async () => {
    setIsComputing(true);
    await base44.functions.invoke("computePredictiveModels", {});
    await base44.functions.invoke("generatePredictiveInsights", {});
    await loadData();
    setIsComputing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center flex-shrink-0">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Digital Human Twin</h1>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-300 uppercase tracking-wide">🚧 In Development</span>
          </div>
          <p className="text-sm text-slate-400 mt-1">Personalised physiological modelling — predictive health intelligence, powered by your data</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "roadmap" && (
        <DigitalTwinTeaser dataReadiness={dataReadiness} />
      )}

      {activeTab === "phase2" && (
        <PredictiveDashboard
          models={models}
          insights={insights}
          onRecompute={handleRecompute}
          isComputing={isComputing}
        />
      )}
    </div>
  );
}