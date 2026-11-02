import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bone, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runMusculoskeletalEngine } from "@/lib/musculoskeletalEngine";
import MSKAssessmentForm from "@/components/musculoskeletal/MSKAssessmentForm";
import MSKInsightPanel from "@/components/musculoskeletal/MSKInsightPanel";
import ClinicalDisclaimerBanner from "@/components/ClinicalDisclaimerBanner";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function MusculoskeletalHealth() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [insights, setInsights] = useState([]);
  const [hasData, setHasData] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [pastAssessments, setPastAssessments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    const user = await base44.auth.me();
    const records = await base44.entities.MusculoskeletalAssessment.filter(
      { created_by: user.email },
      "-assessed_at",
      20
    );
    setPastAssessments(records);
    if (records.length > 0) {
      runAssessment(records[0]);
      setSelectedAssessment(records[0].id);
    }
    setLoadingHistory(false);
  };

  const runAssessment = (data) => {
    const result = runMusculoskeletalEngine(data);
    setInsights(result.insights);
    setHasData(result.has_data);
    setActiveTab("all");
  };

  const handleSubmit = async (formData) => {
    setSaving(true);
    const saved = await base44.entities.MusculoskeletalAssessment.create(formData);
    runAssessment(saved);
    setSelectedAssessment(saved.id);
    setShowForm(false);
    setPastAssessments((prev) => [saved, ...prev]);
    setSaving(false);
  };

  const handleSelectHistory = (record) => {
    setSelectedAssessment(record.id);
    runAssessment(record);
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <ClinicalDisclaimerBanner guidelines="Asian Working Group for Sarcopenia (AWGS 2019/2025), World Health Organization (WHO ICOPE 2.0), International Osteoporosis Foundation (IOF 2024), and National Osteoporosis Foundation (NOF)" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('musculoskeletal.title')}</h1>
          <p className="text-sm text-slate-400 mt-1">
            Algorithmic risk assessment for BMD, sarcopenia, and frailty — AWGS 2025 · WHO ICOPE 2.0 · IOF 2024
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 px-5 text-sm"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "New Assessment"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Enter Assessment Data</h2>
          <MSKAssessmentForm onSubmit={handleSubmit} saving={saving} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* History sidebar */}
        {pastAssessments.length > 0 && (
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide px-1 mb-3">Assessment History</p>
              {loadingHistory ? (
                <div className="animate-pulse space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}
                </div>
              ) : (
                pastAssessments.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectHistory(r)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors
                      ${selectedAssessment === r.id
                        ? "bg-teal-50 border-teal-200"
                        : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          {r.assessed_at ? format(new Date(r.assessed_at), "d MMM yyyy") : "Unknown date"}
                        </p>
                        <p className="text-[10px] text-slate-400">Age {r.age} · {r.sex}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Results */}
        <div className={pastAssessments.length > 0 ? "lg:col-span-3" : "lg:col-span-4"}>
          {!hasData && !showForm ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 text-center">
              <Bone className="w-12 h-12 text-teal-200 mb-4" />
              <h3 className="text-base font-semibold text-slate-700 mb-1">No assessment yet</h3>
              <p className="text-sm text-slate-400 mb-4 max-w-sm">
                Enter your BMD T-score, handgrip strength, gait speed, or other musculoskeletal data to generate a personalised risk analysis.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2"
              >
                <Plus className="w-4 h-4" /> Start Assessment
              </Button>
            </div>
          ) : hasData ? (
            <MSKInsightPanel
              insights={insights}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}