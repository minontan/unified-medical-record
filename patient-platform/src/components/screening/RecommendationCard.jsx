import { Badge } from "@/components/ui/badge";
import { Microscope, Scan, TestTube2, Radiation } from "lucide-react";

const CANCER_CONFIG = {
  breast: {
    icon: Microscope,
    color: "bg-pink-50 border-pink-200",
    iconColor: "text-pink-500",
    badgeColor: "bg-pink-100 text-pink-700",
    label: "Breast Cancer",
  },
  cervical: {
    icon: Microscope,
    color: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-500",
    badgeColor: "bg-purple-100 text-purple-700",
    label: "Cervical Cancer",
  },
  colorectal: {
    icon: TestTube2,
    color: "bg-amber-50 border-amber-200",
    iconColor: "text-amber-500",
    badgeColor: "bg-amber-100 text-amber-700",
    label: "Colorectal Cancer",
  },
  lung: {
    icon: Scan,
    color: "bg-sky-50 border-sky-200",
    iconColor: "text-sky-500",
    badgeColor: "bg-sky-100 text-sky-700",
    label: "Lung Cancer",
  },
};

export default function RecommendationCard({ recommendation }) {
  const cfg = CANCER_CONFIG[recommendation.cancer_type] || {
    icon: Radiation,
    color: "bg-slate-50 border-slate-200",
    iconColor: "text-slate-500",
    badgeColor: "bg-slate-100 text-slate-700",
    label: recommendation.cancer_type,
  };
  const Icon = cfg.icon;

  return (
    <div className={`rounded-2xl border p-5 ${cfg.color} space-y-3`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0 border border-white`}>
          <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">{cfg.label}</p>
          <p className="text-sm font-semibold text-slate-800">{recommendation.test_type}</p>
        </div>
        <Badge className={`text-[10px] font-semibold flex-shrink-0 ${cfg.badgeColor}`}>
          {recommendation.evidence_level}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-600 bg-white/60 rounded-xl px-3 py-2">
        <span className="font-semibold">Frequency:</span>
        <span>{recommendation.frequency}</span>
      </div>

      {recommendation.notes && (
        <p className="text-[11px] text-slate-500 leading-relaxed">{recommendation.notes}</p>
      )}
    </div>
  );
}