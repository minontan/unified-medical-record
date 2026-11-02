import { AlertTriangle, AlertCircle, Info, CheckCircle2, TrendingDown, Heart, Activity, FlaskConical, Zap } from "lucide-react";

const DOMAIN_CONFIG = {
  hypertension: { label: "Hypertension", color: "red", icon: Activity },
  diabetes: { label: "Diabetes", color: "amber", icon: Zap },
  hyperlipidaemia: { label: "Lipids", color: "purple", icon: TrendingDown },
  ckm: { label: "Cardiometabolic", color: "teal", icon: Heart },
  renal: { label: "Kidney", color: "blue", icon: FlaskConical },
};

const SEVERITY_CONFIG = {
  critical: { icon: AlertTriangle, bg: "bg-red-50", border: "border-red-200", title: "text-red-800", badge: "bg-red-100 text-red-700", icon_color: "text-red-500", label: "Critical" },
  high:     { icon: AlertCircle,  bg: "bg-orange-50", border: "border-orange-200", title: "text-orange-800", badge: "bg-orange-100 text-orange-700", icon_color: "text-orange-500", label: "High" },
  medium:   { icon: AlertCircle,  bg: "bg-amber-50", border: "border-amber-200", title: "text-amber-800", badge: "bg-amber-100 text-amber-700", icon_color: "text-amber-500", label: "Moderate" },
  low:      { icon: Info,         bg: "bg-blue-50", border: "border-blue-200", title: "text-blue-800", badge: "bg-blue-100 text-blue-700", icon_color: "text-blue-500", label: "Low" },
  info:     { icon: Info,         bg: "bg-slate-50", border: "border-slate-200", title: "text-slate-700", badge: "bg-slate-100 text-slate-600", icon_color: "text-slate-400", label: "Info" },
  normal:   { icon: CheckCircle2, bg: "bg-emerald-50", border: "border-emerald-200", title: "text-emerald-800", badge: "bg-emerald-100 text-emerald-700", icon_color: "text-emerald-500", label: "Normal" },
};

export default function InsightAlert({ insight }) {
  const sc = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.info;
  const dc = DOMAIN_CONFIG[insight.domain] || DOMAIN_CONFIG.ckm;
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
      {insight.avg_label && (
        <p className="ml-8 text-[10px] text-slate-400">{insight.avg_label}</p>
      )}
      {insight.guideline && (
        <p className="ml-8 text-[10px] text-slate-400 italic">Source: {insight.guideline}</p>
      )}
    </div>
  );
}