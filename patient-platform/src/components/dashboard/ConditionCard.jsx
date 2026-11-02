import { Heart, Droplets, Beaker } from "lucide-react";

const conditionConfig = {
  hypertension: {
    icon: Heart,
    color: "from-rose-500 to-pink-600",
    bgLight: "bg-rose-50",
    textColor: "text-rose-700",
    label: "Hypertension",
    description: "Blood pressure monitoring",
  },
  diabetes: {
    icon: Droplets,
    color: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50",
    textColor: "text-amber-700",
    label: "Diabetes",
    description: "Blood glucose tracking",
  },
  hyperlipidaemia: {
    icon: Beaker,
    color: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50",
    textColor: "text-violet-700",
    label: "Hyperlipidaemia",
    description: "Cholesterol management",
  },
};

export default function ConditionCard({ condition, latestValue, unit, trend, onClick }) {
  const config = conditionConfig[condition] || conditionConfig.hypertension;
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-6 text-left transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 w-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            trend === "improving" ? "bg-emerald-50 text-emerald-600" :
            trend === "stable" ? "bg-blue-50 text-blue-600" :
            "bg-red-50 text-red-600"
          }`}>
            {trend === "improving" ? "↓ Improving" : trend === "stable" ? "→ Stable" : "↑ Attention"}
          </span>
        )}
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{config.label}</h3>
      <p className="text-xs text-slate-400 mb-4">{config.description}</p>
      {latestValue ? (
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900">{latestValue}</span>
          <span className="text-sm text-slate-400">{unit}</span>
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">No readings yet</p>
      )}
    </button>
  );
}