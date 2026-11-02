import { useState, useMemo } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, AreaChart
} from "recharts";
import { format } from "date-fns";
import { TrendingUp, AlertCircle } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="text-slate-500 mb-1">{label}</p>
      <p className="font-semibold text-slate-800">
        {d.value} <span className="font-normal text-slate-400">{d.payload.unit}</span>
      </p>
      <p className="text-slate-400">{d.payload.lab_name || ""}</p>
    </div>
  );
};

export default function LabTrendChart({ standardizedTests, allResults }) {
  const [selectedId, setSelectedId] = useState(null);

  // Auto-select first test with numeric data
  const selectedTest = selectedId
    ? standardizedTests.find((s) => s.id === selectedId)
    : standardizedTests.find((s) => {
        const synonyms = s.synonyms || [];
        return allResults.some((r) => synonyms.includes(r.test_name) && r.numeric_result != null);
      });

  const chartData = useMemo(() => {
    if (!selectedTest) return [];
    const synonyms = selectedTest.synonyms || [];
    return allResults
      .filter((r) => synonyms.includes(r.test_name) && r.numeric_result != null && r.collected_at)
      .map((r) => ({
        date: format(new Date(r.collected_at), "d MMM yy"),
        dateRaw: new Date(r.collected_at).getTime(),
        value: r.numeric_result,
        unit: r.unit || selectedTest.unit || "",
        lab_name: r.lab_name,
        test_name: r.test_name,
      }))
      .sort((a, b) => a.dateRaw - b.dateRaw);
  }, [selectedTest, allResults]);

  const refLow = selectedTest?.reference_range_low;
  const refHigh = selectedTest?.reference_range_high;

  const hasNumericTests = standardizedTests.some((s) =>
    (s.synonyms || []).some((syn) =>
      allResults.some((r) => r.test_name === syn && r.numeric_result != null)
    )
  );

  if (!hasNumericTests) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <TrendingUp className="w-8 h-8 text-slate-300 mb-3" />
        <p className="text-sm text-slate-500 font-medium">No trend data yet</p>
        <p className="text-xs text-slate-400 mt-1">Create standard tests and link your lab results above to see trends here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Test selector */}
      <div className="flex flex-wrap gap-2">
        {standardizedTests
          .filter((s) =>
            (s.synonyms || []).some((syn) =>
              allResults.some((r) => r.test_name === syn && r.numeric_result != null)
            )
          )
          .map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                (selectedTest?.id === s.id)
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"
              }`}
            >
              {s.display_name}
              {s.unit && <span className="ml-1 opacity-70">({s.unit})</span>}
            </button>
          ))}
      </div>

      {selectedTest && chartData.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          No numeric results found for <strong>{selectedTest.display_name}</strong>. Make sure results are linked and have numeric values.
        </div>
      )}

      {selectedTest && chartData.length >= 1 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">{selectedTest.display_name}</p>
              {selectedTest.unit && <p className="text-xs text-slate-400">{selectedTest.unit}</p>}
            </div>
            {chartData.length === 1 && (
              <p className="text-[10px] text-slate-400 italic">Only 1 data point — upload more reports to see a trend</p>
            )}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {refLow != null && (
                <ReferenceLine y={refLow} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Low ${refLow}`, position: "insideBottomRight", fontSize: 9, fill: "#f59e0b" }} />
              )}
              {refHigh != null && (
                <ReferenceLine y={refHigh} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `High ${refHigh}`, position: "insideTopRight", fontSize: 9, fill: "#f59e0b" }} />
              )}
              <Area type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2} fill="url(#trendGrad)" dot={{ fill: "#0d9488", r: 4, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>

          {/* Data points table */}
          <div className="mt-3 border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Value</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Lab</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Raw Name</th>
                  <th className="text-left px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...chartData].reverse().map((d, i) => {
                  let status = null;
                  let statusClass = "";
                  if (refLow != null && d.value < refLow) { status = "Low"; statusClass = "text-blue-600 bg-blue-50"; }
                  else if (refHigh != null && d.value > refHigh) { status = "High"; statusClass = "text-red-600 bg-red-50"; }
                  else if (refLow != null || refHigh != null) { status = "Normal"; statusClass = "text-emerald-600 bg-emerald-50"; }
                  return (
                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-3 py-2 text-slate-600">{d.date}</td>
                      <td className="px-3 py-2 font-semibold text-slate-800">{d.value} <span className="font-normal text-slate-400 text-[10px]">{d.unit}</span></td>
                      <td className="px-3 py-2 text-slate-400">{d.lab_name || "—"}</td>
                      <td className="px-3 py-2 text-slate-400">{d.test_name}</td>
                      <td className="px-3 py-2">
                        {status && <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusClass}`}>{status}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}