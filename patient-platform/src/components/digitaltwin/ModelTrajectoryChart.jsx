import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { format, parseISO } from "date-fns";

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs space-y-1">
      <p className="font-semibold text-slate-700">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? `${Math.round(p.value * 100) / 100} ${unit}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function ModelTrajectoryChart({ actual, predicted, label, unit }) {
  if (!actual?.length && !predicted?.length) return null;

  // Merge actual + predicted into a single timeline
  const actualMap = {};
  (actual || []).forEach(p => { actualMap[p.date] = p.value; });

  const allDates = new Set([
    ...(actual || []).map(p => p.date),
    ...(predicted || []).map(p => p.date)
  ]);

  const data = [...allDates].sort().map(date => {
    const pred = (predicted || []).find(p => p.date === date);
    return {
      date,
      label: (() => { try { return format(parseISO(date), "MMM yy"); } catch { return date; } })(),
      actual: actualMap[date] ?? null,
      predicted: pred?.predicted ?? null,
      lower_ci: pred?.lower_ci ?? null,
      upper_ci: pred?.upper_ci ?? null,
    };
  });

  // Split point — where actual ends and prediction begins
  const lastActualDate = (actual || []).slice(-1)[0]?.date;

  return (
    <div className="mt-2">
      <p className="text-xs text-slate-400 mb-2 font-medium">{label} — Historical + 12-Month Projection</p>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />

          {/* CI band */}
          <Area
            type="monotone"
            dataKey="upper_ci"
            stroke="none"
            fill="#8b5cf6"
            fillOpacity={0.08}
            legendType="none"
            name="Upper CI"
          />
          <Area
            type="monotone"
            dataKey="lower_ci"
            stroke="none"
            fill="#ffffff"
            fillOpacity={1}
            legendType="none"
            name="Lower CI"
          />

          {/* Actual values */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#0d9488"
            strokeWidth={2}
            dot={{ r: 3, fill: "#0d9488" }}
            connectNulls={false}
            name="Actual"
          />

          {/* Predicted trajectory */}
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            connectNulls={false}
            name="Predicted"
          />

          {/* Divider line between actual and forecast */}
          {lastActualDate && (
            <ReferenceLine
              x={(() => { try { return format(parseISO(lastActualDate), "MMM yy"); } catch { return lastActualDate; } })()}
              stroke="#cbd5e1"
              strokeDasharray="3 3"
              label={{ value: "Forecast →", position: "insideTopRight", fontSize: 8, fill: "#94a3b8" }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="w-4 h-0.5 bg-teal-500 rounded inline-block" /> Actual
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="w-4 h-0.5 bg-violet-500 rounded inline-block border-dashed" style={{ borderTop: '2px dashed #8b5cf6', background: 'none' }} /> Predicted
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="w-4 h-2 rounded inline-block" style={{ background: 'rgba(139,92,246,0.1)' }} /> 95% CI
        </span>
      </div>
    </div>
  );
}