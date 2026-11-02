import { useState } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import moment from "moment";

const timeframes = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
  { label: "All", days: 9999 },
];

const typeColors = {
  blood_pressure: "#f43f5e",
  heart_rate: "#ec4899",
  blood_glucose: "#f59e0b",
  hba1c: "#d97706",
  total_cholesterol: "#8b5cf6",
  ldl_cholesterol: "#a855f7",
  hdl_cholesterol: "#6366f1",
  triglycerides: "#7c3aed",
  weight: "#14b8a6",
};

const typeLabels = {
  blood_pressure: "Blood Pressure",
  heart_rate: "Heart Rate",
  blood_glucose: "Blood Glucose",
  hba1c: "HbA1c",
  total_cholesterol: "Total Cholesterol",
  ldl_cholesterol: "LDL Cholesterol",
  hdl_cholesterol: "HDL Cholesterol",
  triglycerides: "Triglycerides",
  weight: "Weight",
};

export default function MeasurementChart({ measurements, selectedType }) {
  const [timeframe, setTimeframe] = useState(30);

  const cutoff = moment().subtract(timeframe, "days");
  const filtered = measurements
    .filter((m) => m.measurement_type === selectedType)
    .filter((m) => timeframe === 9999 || moment(m.measured_at).isAfter(cutoff))
    .sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));

  const data = filtered.map((m) => ({
    date: moment(m.measured_at).format("MMM D"),
    fullDate: moment(m.measured_at).format("MMM D, YYYY HH:mm"),
    value: m.value_primary,
    secondary: m.value_secondary,
  }));

  const color = typeColors[selectedType] || "#14b8a6";
  const isBP = selectedType === "blood_pressure";

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-lg">
        <p className="text-xs text-slate-400 mb-1">{d.fullDate}</p>
        <p className="text-sm font-semibold text-slate-900">
          {isBP ? `${d.value}/${d.secondary}` : d.value} {filtered[0]?.unit}
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{typeLabels[selectedType] || selectedType}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{data.length} readings</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {timeframes.map((tf) => (
            <button
              key={tf.label}
              onClick={() => setTimeframe(tf.days)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                timeframe === tf.days
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-slate-400">
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${selectedType}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#gradient-${selectedType})`} dot={{ r: 3, fill: color }} />
            {isBP && (
              <Area type="monotone" dataKey="secondary" stroke="#94a3b8" strokeWidth={1.5} fill="none" dot={{ r: 2, fill: "#94a3b8" }} strokeDasharray="4 4" />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}