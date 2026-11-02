import moment from "moment";
import { Trash2 } from "lucide-react";

const typeLabels = {
  blood_pressure: "Blood Pressure",
  heart_rate: "Heart Rate",
  blood_glucose: "Blood Glucose",
  hba1c: "HbA1c",
  total_cholesterol: "Total Cholesterol",
  ldl_cholesterol: "LDL",
  hdl_cholesterol: "HDL",
  triglycerides: "Triglycerides",
  weight: "Weight",
};

const conditionColors = {
  hypertension: "bg-rose-100 text-rose-700",
  diabetes: "bg-amber-100 text-amber-700",
  hyperlipidaemia: "bg-violet-100 text-violet-700",
  general: "bg-slate-100 text-slate-600",
};

export default function MeasurementHistory({ measurements, onDelete }) {
  if (!measurements.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
        <p className="text-slate-400 text-sm">No measurements recorded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
      <div className="divide-y divide-slate-100">
        {measurements.map((m) => (
          <div key={m.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-slate-900">{typeLabels[m.measurement_type]}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${conditionColors[m.condition]}`}>
                  {m.condition}
                </span>
              </div>
              <p className="text-xs text-slate-400">{moment(m.measured_at).format("MMM D, YYYY · h:mm A")}</p>
              {m.notes && <p className="text-xs text-slate-400 mt-1 truncate">{m.notes}</p>}
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-slate-900">
                {m.measurement_type === "blood_pressure" ? `${m.value_primary}/${m.value_secondary}` : m.value_primary}
              </span>
              <span className="text-xs text-slate-400 ml-1">{m.unit}</span>
            </div>
            <button
              onClick={() => onDelete(m.id)}
              className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}