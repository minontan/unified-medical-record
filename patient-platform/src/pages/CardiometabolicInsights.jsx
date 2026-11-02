import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Loader2, RefreshCw, Activity, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import InsightAlert from "@/components/insights/InsightAlert";
import ClinicalDisclaimerBanner from "@/components/ClinicalDisclaimerBanner";
import { useTranslation } from "react-i18next";

const DOMAINS = [
  { key: "all", label: "All" },
  { key: "hypertension", label: "Hypertension" },
  { key: "diabetes", label: "Diabetes" },
  { key: "hyperlipidaemia", label: "Lipids" },
  { key: "ckm", label: "Cardiometabolic" },
  { key: "renal", label: "Kidney" },
];

export default function CardiometabolicInsights() {
  const { t } = useTranslation();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [activeDomain, setActiveDomain] = useState("all");

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setLoading(true);
    const res = await base44.functions.invoke("generateCardiometabolicInsights", {});
    setInsights(res.data.insights || []);
    setHasData(res.data.has_data || false);
    setLoading(false);
  };

  const filtered = activeDomain === "all"
    ? insights
    : insights.filter((i) => i.domain === activeDomain);

  const criticalCount = insights.filter((i) => i.severity === "critical").length;
  const highCount = insights.filter((i) => i.severity === "high").length;
  const normalCount = insights.filter((i) => i.severity === "normal").length;

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <ClinicalDisclaimerBanner guidelines="American Diabetes Association (ADA 2025–2026), American Heart Association (AHA), American College of Cardiology (ACC), and European Society of Cardiology (ESC)" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('nav.cardiometabolicInsights')}</h1>
          <p className="text-sm text-slate-400 mt-1">
            Algorithmic analysis of your measurements and labs based on 2025–2026 ADA, AHA, ACC & ESC guidelines
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl("Measurements")}>
            <Button variant="outline" className="h-9 rounded-xl gap-2 text-sm">
              <Plus className="w-4 h-4" /> Log Measurement
            </Button>
          </Link>
          <Button onClick={loadInsights} disabled={loading} className="h-9 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 text-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary bar */}
      {!loading && hasData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{insights.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">Total Insights</p>
          </div>
          <div className={`rounded-2xl border p-4 text-center ${criticalCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
            <p className={`text-2xl font-bold ${criticalCount > 0 ? "text-red-700" : "text-slate-800"}`}>{criticalCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Critical Alerts</p>
          </div>
          <div className={`rounded-2xl border p-4 text-center ${highCount > 0 ? "bg-orange-50 border-orange-200" : "bg-white border-slate-200"}`}>
            <p className={`text-2xl font-bold ${highCount > 0 ? "text-orange-700" : "text-slate-800"}`}>{highCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">High Priority</p>
          </div>
          <div className={`rounded-2xl border p-4 text-center ${normalCount > 0 ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"}`}>
            <p className={`text-2xl font-bold ${normalCount > 0 ? "text-emerald-700" : "text-slate-800"}`}>{normalCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Within Target</p>
          </div>
        </div>
      )}

      {/* Domain filter tabs */}
      {!loading && hasData && (
        <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-0">
          {DOMAINS.filter((d) => d.key === "all" || insights.some((i) => i.domain === d.key)).map((d) => {
            const count = d.key === "all" ? insights.length : insights.filter((i) => i.domain === d.key).length;
            return (
              <button
                key={d.key}
                onClick={() => setActiveDomain(d.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
                  ${activeDomain === d.key ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                {d.label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeDomain === d.key ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 text-center">
          <Activity className="w-12 h-12 text-teal-300 mb-4" />
          <h3 className="text-base font-semibold text-slate-700 mb-1">No health data yet</h3>
          <p className="text-sm text-slate-400 mb-4 max-w-xs">
            Log your blood pressure, glucose, HbA1c, or cholesterol readings to generate personalised cardiometabolic insights.
          </p>
          <Link to={createPageUrl("Measurements")}>
            <Button className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2">
              <Plus className="w-4 h-4" /> Start Logging
            </Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
          <p className="text-sm text-slate-500">No insights in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((insight, i) => (
            <InsightAlert key={i} insight={insight} />
          ))}
        </div>
      )}


    </div>
  );
}