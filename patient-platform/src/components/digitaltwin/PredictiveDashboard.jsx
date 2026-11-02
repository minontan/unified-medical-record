import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Brain, RefreshCw, Loader2, AlertTriangle, TrendingUp, TrendingDown,
  Minus, ChevronDown, ChevronUp, Sparkles, CheckCircle2, Info, Zap
} from "lucide-react";
import ModelTrajectoryChart from "./ModelTrajectoryChart";

const MODEL_META = {
  hba1c_trajectory:   { label: "HbA1c Trend",         unit: "%",    threshold: { warn: 5.7, danger: 6.5 }, color: "orange" },
  bp_trajectory:      { label: "Systolic BP Trend",    unit: "mmHg", threshold: { warn: 130,  danger: 140  }, color: "red" },
  lipid_trajectory:   { label: "LDL Cholesterol Trend",unit: "mmol/L",threshold:{ warn: 3.4, danger: 4.1 }, color: "yellow" },
  ckd_risk:           { label: "CKD Risk (eGFR)",       unit: "score",threshold: { warn: 40,   danger: 60   }, color: "blue" },
  ascvd_risk:         { label: "ASCVD 10-Year Risk",   unit: "%",    threshold: { warn: 5,    danger: 10   }, color: "rose" },
  frax_risk:          { label: "Fracture Risk (FRAX)", unit: "%",    threshold: { warn: 10,   danger: 20   }, color: "purple" },
  sarcopenia_index:   { label: "Sarcopenia Index",     unit: "score",threshold: { warn: 20,   danger: 40   }, color: "teal" },
  metabolic_age:      { label: "Metabolic Age",        unit: "yrs",  threshold: { warn: 5,    danger: 10   }, color: "green" },
};

const CATEGORY_CONFIG = {
  low:       { label: "Low Risk",       bg: "bg-emerald-50",  border: "border-emerald-200", text: "text-emerald-700",  dot: "bg-emerald-500" },
  borderline:{ label: "Borderline",     bg: "bg-yellow-50",   border: "border-yellow-200",  text: "text-yellow-700",   dot: "bg-yellow-400"  },
  moderate:  { label: "Moderate Risk",  bg: "bg-amber-50",    border: "border-amber-200",   text: "text-amber-700",    dot: "bg-amber-500"   },
  high:      { label: "High Risk",      bg: "bg-orange-50",   border: "border-orange-200",  text: "text-orange-700",   dot: "bg-orange-500"  },
  very_high: { label: "Very High Risk", bg: "bg-red-50",      border: "border-red-200",     text: "text-red-700",      dot: "bg-red-500"     },
};

const SEVERITY_CONFIG = {
  info:     { icon: Info,          bg: "bg-blue-50",    border: "border-blue-200",   text: "text-blue-800",    iconColor: "text-blue-500"   },
  positive: { icon: CheckCircle2,  bg: "bg-emerald-50", border: "border-emerald-200",text: "text-emerald-800", iconColor: "text-emerald-500" },
  warning:  { icon: AlertTriangle, bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-800",   iconColor: "text-amber-500"  },
  urgent:   { icon: Zap,           bg: "bg-red-50",     border: "border-red-200",    text: "text-red-800",     iconColor: "text-red-500"    },
};

const TrendIcon = ({ direction }) => {
  if (direction === "worsening")  return <TrendingUp   className="w-4 h-4 text-red-500" />;
  if (direction === "improving")  return <TrendingDown  className="w-4 h-4 text-emerald-500" />;
  if (direction === "stable")     return <Minus         className="w-4 h-4 text-slate-400" />;
  return <Minus className="w-4 h-4 text-slate-300" />;
};

function ModelCard({ model }) {
  const [expanded, setExpanded] = useState(false);
  const meta = MODEL_META[model.model_type] || { label: model.model_type, unit: "" };
  const cat = CATEGORY_CONFIG[model.risk_category] || CATEGORY_CONFIG.low;
  const drivers = (() => { try { return JSON.parse(model.key_drivers || '[]'); } catch { return []; } })();
  const predicted = (() => { try { return JSON.parse(model.predicted_values || 'null'); } catch { return null; } })();
  const actual = (() => { try { return JSON.parse(model.actual_values || 'null'); } catch { return null; } })();
  const hasChart = predicted?.length > 0 && actual?.length > 0;

  return (
    <div className={`rounded-2xl border p-5 ${cat.bg} ${cat.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{meta.label}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.bg} ${cat.text} border ${cat.border}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cat.dot}`} />
              {cat.label}
            </span>
            <TrendIcon direction={model.trend_direction} />
            <span className="text-xs text-slate-500 capitalize">{model.trend_direction?.replace('_', ' ')}</span>
          </div>
        </div>
        <div className="text-right">
          {model.risk_score !== null && model.risk_score !== undefined && (
            <p className="text-2xl font-bold text-slate-900">{Math.round(model.risk_score * 10) / 10}</p>
          )}
          <p className="text-[10px] text-slate-400">{meta.unit}</p>
        </div>
      </div>

      {drivers.length > 0 && (
        <div className="mt-3 space-y-1">
          {drivers.slice(0, 2).map((d, i) => (
            <p key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
              <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
              {d}
            </p>
          ))}
        </div>
      )}

      {(hasChart || drivers.length > 2) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? "Show less" : "Show trajectory"}
        </button>
      )}

      {expanded && (
        <div className="mt-3 space-y-3">
          {drivers.slice(2).map((d, i) => (
            <p key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
              <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
              {d}
            </p>
          ))}
          {hasChart && (
            <ModelTrajectoryChart
              actual={actual}
              predicted={predicted}
              label={meta.label}
              unit={meta.unit}
            />
          )}
          {model.next_review_date && (
            <p className="text-xs text-slate-400">Next review: {model.next_review_date}</p>
          )}
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight, onDismiss }) {
  const cfg = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.info;
  const Icon = cfg.icon;
  return (
    <div className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${cfg.text}`}>{insight.title}</p>
          <p className={`text-xs mt-1 leading-relaxed ${cfg.text} opacity-80`}>{insight.body}</p>
          {insight.action_recommended && (
            <p className={`text-xs mt-2 font-semibold ${cfg.text}`}>→ {insight.action_recommended}</p>
          )}
        </div>
        <button onClick={() => onDismiss(insight.id)} className="text-slate-300 hover:text-slate-500 text-xs flex-shrink-0">✕</button>
      </div>
    </div>
  );
}

export default function PredictiveDashboard({ models, insights, onRecompute, isComputing }) {
  const [dismissedIds, setDismissedIds] = useState([]);
  const activeInsights = insights.filter(i => !dismissedIds.includes(i.id) && !i.is_dismissed);

  const urgentCount  = activeInsights.filter(i => i.severity === 'urgent').length;
  const warningCount = activeInsights.filter(i => i.severity === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-900">Predictive Modelling Engine</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {models.length} models computed · {activeInsights.length} active insights
            {urgentCount > 0 && <span className="ml-2 text-red-600 font-semibold">· {urgentCount} urgent</span>}
            {warningCount > 0 && <span className="ml-2 text-amber-600 font-semibold">· {warningCount} warnings</span>}
          </p>
        </div>
        <Button
          onClick={onRecompute}
          disabled={isComputing}
          size="sm"
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
        >
          {isComputing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {isComputing ? "Computing…" : "Run Models"}
        </Button>
      </div>

      {/* Insights feed */}
      {activeInsights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-bold text-slate-700">AI-Generated Insights</h3>
          </div>
          {activeInsights.map(ins => (
            <InsightCard
              key={ins.id}
              insight={ins}
              onDismiss={(id) => setDismissedIds(prev => [...prev, id])}
            />
          ))}
        </div>
      )}

      {/* Models grid */}
      {models.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-bold text-slate-700">Risk & Trajectory Models</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {models.map(m => <ModelCard key={m.id} model={m} />)}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
          <Brain className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">No models computed yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Click "Run Models" to compute your personalised risk scores and trajectories.</p>
          <p className="text-xs text-slate-400">You need at least 2 measurements or lab results per biomarker for trajectory modelling. Point-in-time scores (ASCVD, FRAX) require your health profile to be completed.</p>
        </div>
      )}
    </div>
  );
}