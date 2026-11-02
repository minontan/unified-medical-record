import { AlertTriangle, AlertCircle, Info, CheckCircle2, Bone, Dumbbell, PersonStanding, Leaf, Zap } from "lucide-react";

const DOMAIN_CONFIG = {
  bone:          { label: "Bone Health", color: "violet", icon: Bone },
  sarcopenia:    { label: "Sarcopenia", color: "orange", icon: Dumbbell },
  frailty:       { label: "Frailty", color: "rose", icon: PersonStanding },
  nutrition:     { label: "Nutrition & Lifestyle", color: "teal", icon: Leaf },
  osteosarcopenia: { label: "Osteosarcopenia", color: "red", icon: Zap },
};

const SEVERITY_CONFIG = {
  critical: { icon: AlertTriangle, bg: "bg-red-50", border: "border-red-200", title: "text-red-800", badge: "bg-red-100 text-red-700", icon_color: "text-red-500", label: "Critical" },
  high:     { icon: AlertCircle,  bg: "bg-orange-50", border: "border-orange-200", title: "text-orange-800", badge: "bg-orange-100 text-orange-700", icon_color: "text-orange-500", label: "High" },
  medium:   { icon: AlertCircle,  bg: "bg-amber-50", border: "border-amber-200", title: "text-amber-800", badge: "bg-amber-100 text-amber-700", icon_color: "text-amber-500", label: "Moderate" },
  low:      { icon: Info,         bg: "bg-blue-50", border: "border-blue-200", title: "text-blue-800", badge: "bg-blue-100 text-blue-700", icon_color: "text-blue-500", label: "Low" },
  info:     { icon: Info,         bg: "bg-slate-50", border: "border-slate-200", title: "text-slate-700", badge: "bg-slate-100 text-slate-600", icon_color: "text-slate-400", label: "Info" },
  normal:   { icon: CheckCircle2, bg: "bg-emerald-50", border: "border-emerald-200", title: "text-emerald-800", badge: "bg-emerald-100 text-emerald-700", icon_color: "text-emerald-500", label: "Normal" },
};

const DOMAIN_TABS = ["all", "osteosarcopenia", "bone", "sarcopenia", "frailty", "nutrition"];

function InsightCard({ insight }) {
  const sc = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.info;
  const dc = DOMAIN_CONFIG[insight.domain] || DOMAIN_CONFIG.bone;
  const SevIcon = sc.icon;

  return (
    <div className={`rounded-2xl border ${sc.bg} ${sc.border} p-4 space-y-2.5`}>
      <div className="flex items-start gap-3">
        <SevIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${sc.icon_color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className={`text-sm font-semibold ${sc.title} leading-tight`}>{insight.title}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${sc.badge}`}>
              {sc.label}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/70 text-slate-500 border border-slate-200">
              {dc.label}
            </span>
            {insight.value && (
              <span className="text-[11px] font-bold text-slate-600 ml-auto">{insight.value}</span>
            )}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{insight.message}</p>
        </div>
      </div>
      <div className="ml-8 bg-white/60 rounded-xl px-3 py-2 border border-white">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Recommended Action</p>
        <p className="text-xs text-slate-700 leading-relaxed">{insight.action}</p>
      </div>
      {insight.guideline && (
        <p className="ml-8 text-[10px] text-slate-400 italic">Source: {insight.guideline}</p>
      )}
    </div>
  );
}

export default function MSKInsightPanel({ insights, activeTab, onTabChange }) {
  const filtered = activeTab === "all" ? insights : insights.filter((i) => i.domain === activeTab);

  const criticalCount = insights.filter((i) => i.severity === "critical").length;
  const highCount = insights.filter((i) => i.severity === "high").length;
  const normalCount = insights.filter((i) => i.severity === "normal").length;

  const domainTabs = DOMAIN_TABS.filter(
    (d) => d === "all" || insights.some((i) => i.domain === d)
  );

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{insights.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Total Findings</p>
        </div>
        <div className={`rounded-2xl border p-4 text-center ${criticalCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
          <p className={`text-2xl font-bold ${criticalCount > 0 ? "text-red-700" : "text-slate-800"}`}>{criticalCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Critical</p>
        </div>
        <div className={`rounded-2xl border p-4 text-center ${highCount > 0 ? "bg-orange-50 border-orange-200" : "bg-white border-slate-200"}`}>
          <p className={`text-2xl font-bold ${highCount > 0 ? "text-orange-700" : "text-slate-800"}`}>{highCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">High Priority</p>
        </div>
        <div className={`rounded-2xl border p-4 text-center ${normalCount > 0 ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"}`}>
          <p className={`text-2xl font-bold ${normalCount > 0 ? "text-emerald-700" : "text-slate-800"}`}>{normalCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Normal</p>
        </div>
      </div>

      {/* Domain tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {domainTabs.map((d) => {
          const count = d === "all" ? insights.length : insights.filter((i) => i.domain === d).length;
          const label = d === "all" ? "All" : (DOMAIN_CONFIG[d]?.label || d);
          return (
            <button
              key={d}
              onClick={() => onTabChange(d)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
                ${activeTab === d ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              {label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === d ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Insights list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
          <p className="text-sm text-slate-500">No findings in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((insight, i) => <InsightCard key={i} insight={insight} />)}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          <strong className="text-slate-500">Clinical Disclaimer:</strong> These findings are generated algorithmically based on AWGS 2025, WHO ICOPE 2.0, IOF 2024, and USPSTF 2025 guidelines. They are for informational and educational purposes only and do not constitute a medical diagnosis or treatment recommendation. All clinical decisions must be made with your healthcare provider. Individual risk may vary based on comorbidities, medications, and clinical context.
        </p>
      </div>
    </div>
  );
}