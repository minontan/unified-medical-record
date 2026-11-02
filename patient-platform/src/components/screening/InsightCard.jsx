import { AlertTriangle, Info, ShieldCheck, Activity, BookOpen } from "lucide-react";

const CATEGORY_CONFIG = {
  screening_recommendation: { icon: ShieldCheck, bg: "bg-teal-50", border: "border-teal-200", iconColor: "text-teal-600", badgeClass: "bg-teal-100 text-teal-700", label: "Screening" },
  risk_factor:              { icon: Activity,     bg: "bg-orange-50", border: "border-orange-200", iconColor: "text-orange-500", badgeClass: "bg-orange-100 text-orange-700", label: "Risk Factor" },
  management_pathway:       { icon: BookOpen,     bg: "bg-blue-50",   border: "border-blue-200",   iconColor: "text-blue-600",   badgeClass: "bg-blue-100 text-blue-700",   label: "Management" },
  prevention:               { icon: ShieldCheck,  bg: "bg-green-50",  border: "border-green-200",  iconColor: "text-green-600",  badgeClass: "bg-green-100 text-green-700", label: "Prevention" },
  red_flag:                 { icon: AlertTriangle, bg: "bg-red-50",   border: "border-red-200",    iconColor: "text-red-600",    badgeClass: "bg-red-100 text-red-700",     label: "Red Flag" },
  general_info:             { icon: Info,         bg: "bg-slate-50",  border: "border-slate-200",  iconColor: "text-slate-500",  badgeClass: "bg-slate-100 text-slate-600", label: "Info" },
};

const CANCER_LABELS = {
  breast: "Breast", cervical: "Cervical", colorectal: "Colorectal",
  lung: "Lung", liver: "Liver", gastric: "Gastric", general: "General",
};

export default function InsightCard({ insight }) {
  const config = CATEGORY_CONFIG[insight.insight_category] || CATEGORY_CONFIG.general_info;
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border ${config.bg} ${config.border} p-4 flex gap-3`}>
      <div className={`mt-0.5 flex-shrink-0 ${config.iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-slate-800">{insight.title}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.badgeClass}`}>{config.label}</span>
          {insight.cancer_type && insight.cancer_type !== "general" && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">
              {CANCER_LABELS[insight.cancer_type] || insight.cancer_type}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">{insight.content}</p>
        {(insight.evidence_level || insight.source) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {insight.evidence_level && (
              <span className="text-[10px] text-slate-400 font-medium">Evidence: {insight.evidence_level}</span>
            )}
            {insight.source && (
              <span className="text-[10px] text-slate-400">· Source: {insight.source}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}