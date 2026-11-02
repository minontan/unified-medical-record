import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { AlertTriangle, ArrowRight, Loader2, TrendingUp, CheckCircle2 } from "lucide-react";

const SEVERITY_STYLE = {
  critical: "text-red-600 bg-red-50",
  high:     "text-orange-600 bg-orange-50",
  medium:   "text-amber-600 bg-amber-50",
  low:      "text-blue-600 bg-blue-50",
  info:     "text-slate-500 bg-slate-50",
  normal:   "text-emerald-600 bg-emerald-50",
};

export default function CardiometabolicAlertWidget() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    base44.functions.invoke("generateCardiometabolicInsights", {})
      .then((res) => {
        setInsights(res.data.insights || []);
        setHasData(res.data.has_data || false);
      })
      .finally(() => setLoading(false));
  }, []);

  const alertInsights = insights.filter((i) => ["critical", "high", "medium"].includes(i.severity)).slice(0, 4);
  const criticalCount = insights.filter((i) => i.severity === "critical").length;
  const highCount = insights.filter((i) => i.severity === "high").length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${criticalCount > 0 ? "bg-red-50" : highCount > 0 ? "bg-orange-50" : "bg-teal-50"}`}>
            {criticalCount > 0
              ? <AlertTriangle className="w-4 h-4 text-red-500" />
              : <TrendingUp className="w-4 h-4 text-teal-600" />
            }
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Cardiometabolic Insights</h2>
            {(criticalCount > 0 || highCount > 0) && (
              <p className="text-[10px] text-red-600 font-medium">
                {criticalCount > 0 ? `${criticalCount} critical · ` : ""}{highCount > 0 ? `${highCount} high priority` : ""}
              </p>
            )}
          </div>
        </div>
        <Link to={createPageUrl("CardiometabolicInsights")} className="text-xs text-teal-600 font-medium flex items-center gap-1 hover:text-teal-700">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
        </div>
      ) : !hasData ? (
        <div className="text-center py-4">
          <p className="text-sm text-slate-400 mb-2">Log measurements to generate insights</p>
          <Link to={createPageUrl("Measurements")} className="text-xs text-teal-600 font-medium hover:text-teal-700">
            Log your first reading →
          </Link>
        </div>
      ) : alertInsights.length === 0 ? (
        <div className="flex items-center gap-3 py-3 text-sm text-emerald-600">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>All tracked values within target range. Great work!</span>
        </div>
      ) : (
        <div className="space-y-2">
          {alertInsights.map((insight, i) => (
            <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl ${SEVERITY_STYLE[insight.severity]}`}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-tight truncate">{insight.title}</p>
                <p className="text-[11px] leading-snug opacity-80 mt-0.5 line-clamp-2">{insight.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}