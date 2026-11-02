import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, UserCog, AlertCircle, RefreshCw, Lightbulb } from "lucide-react";
import ClinicalDisclaimerBanner from "@/components/ClinicalDisclaimerBanner";
import ScreeningProfileForm from "@/components/screening/ScreeningProfileForm";
import RecommendationCard from "@/components/screening/RecommendationCard";
import InsightCard from "@/components/screening/InsightCard";
import { useTranslation } from "react-i18next";

const CANCER_ORDER = ["breast", "cervical", "colorectal", "lung"];

export default function ScreeningDashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [insights, setInsights] = useState([]);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [age, setAge] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("recommendations");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    const profiles = await base44.entities.UserHealthProfile.filter({ created_by: user.email });
    setProfile(profiles[0] || null);
    if (profiles[0]) {
      await fetchRecommendations();
    } else {
      setProfileIncomplete(true);
      setShowForm(true);
    }
    setLoading(false);
  };

  const fetchRecommendations = async () => {
    setGenerating(true);
    const [recRes, insRes] = await Promise.all([
      base44.functions.invoke("generateScreeningRecommendations", {}),
      base44.functions.invoke("generateMedicalInsights", {}),
    ]);
    setRecommendations(recRes.data.recommendations || []);
    setInsights(insRes.data.insights || []);
    setProfileIncomplete(recRes.data.profile_incomplete);
    setAge(recRes.data.age);
    setGenerating(false);
  };

  const handleProfileSaved = async () => {
    setShowForm(false);
    const user = await base44.auth.me();
    const profiles = await base44.entities.UserHealthProfile.filter({ created_by: user.email });
    setProfile(profiles[0] || null);
    await fetchRecommendations();
  };

  // Group recommendations by cancer type in defined order
  const grouped = CANCER_ORDER.reduce((acc, type) => {
    const items = recommendations.filter((r) => r.cancer_type === type);
    if (items.length) acc[type] = items;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <ClinicalDisclaimerBanner guidelines="United States Preventive Services Task Force (USPSTF), World Health Organization (WHO), Singapore Ministry of Health (MOH), Malaysia Clinical Practice Guidelines (CPG), and Asia-Pacific Association for the Study of the Liver (APASL)" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('screening.title')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('screening.completeProfile')}</p>
        </div>
        <div className="flex items-center gap-2">
          {profile && (
            <Button variant="outline" onClick={() => setShowForm(!showForm)} className="h-9 rounded-xl gap-2 text-sm">
              <UserCog className="w-4 h-4" />
              {showForm ? "Hide Profile" : "Edit Health Profile"}
            </Button>
          )}
          {profile && !showForm && (
            <Button onClick={fetchRecommendations} disabled={generating} className="h-9 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 text-sm">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Profile form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCog className="w-5 h-5 text-teal-600" />
            <h2 className="text-sm font-semibold text-slate-800">Your Health Profile</h2>
          </div>
          <p className="text-xs text-slate-400">
            This information is used <strong>only</strong> to generate personalised screening recommendations. It is stored privately and only visible to you.
          </p>
          <ScreeningProfileForm profile={profile} onSaved={handleProfileSaved} />
        </div>
      )}

      {/* Incomplete profile warning */}
      {profileIncomplete && !showForm && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Health profile incomplete</p>
            <p className="text-xs text-amber-600 mt-0.5">Please complete your health profile to generate personalised recommendations.</p>
            <Button onClick={() => setShowForm(true)} size="sm" className="mt-2 h-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs">Complete Profile</Button>
          </div>
        </div>
      )}

      {/* Recommendations + Insights */}
      {!profileIncomplete && !showForm && (
        <>
          {/* Summary bar */}
          {profile && age != null && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl px-5 py-3 flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-teal-700">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-semibold">Recommendations for</span>
              </div>
              <span className="text-slate-600">Age <strong>{age}</strong></span>
              <span className="text-slate-600 capitalize">Sex: <strong>{profile.biological_sex}</strong></span>
              {profile.smoking_status && profile.smoking_status !== "never" && (
                <span className="text-slate-600 capitalize">Smoking: <strong>{profile.smoking_status.replace(/_/g, " ")}</strong></span>
              )}
              {recommendations.length > 0 && (
                <span className="ml-auto text-teal-700 font-semibold">{recommendations.length} screening{recommendations.length !== 1 ? "s" : ""} recommended</span>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-slate-200 gap-1">
            <button
              onClick={() => setActiveTab("recommendations")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                ${activeTab === "recommendations" ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              <ShieldCheck className="w-4 h-4" />
              Screenings
              {recommendations.length > 0 && <span className="ml-1 bg-teal-100 text-teal-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{recommendations.length}</span>}
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                ${activeTab === "insights" ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              <Lightbulb className="w-4 h-4" />
              Clinical Pearls
              {insights.length > 0 && <span className="ml-1 bg-teal-100 text-teal-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{insights.length}</span>}
            </button>
          </div>

          {generating ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : activeTab === "recommendations" ? (
            recommendations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-slate-200 rounded-2xl">
                <ShieldCheck className="w-10 h-10 text-teal-400 mb-3" />
                <p className="text-sm font-medium text-slate-600">No screenings currently recommended</p>
                <p className="text-xs text-slate-400 mt-1">Based on your health profile, no active screening protocols apply at this time.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([type, items]) => (
                  <div key={type}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 px-1 capitalize">{type} Cancer</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map((rec, i) => <RecommendationCard key={i} recommendation={rec} />)}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            insights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-slate-200 rounded-2xl">
                <Lightbulb className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-600">No personalised insights available</p>
                <p className="text-xs text-slate-400 mt-1">Complete your health profile to unlock personalised clinical pearls.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {insights.map((insight, i) => <InsightCard key={i} insight={insight} />)}
              </div>
            )
          )}


        </>
      )}
    </div>
  );
}