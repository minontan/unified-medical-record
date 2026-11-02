import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Syringe, Ruler, Stethoscope, Pill, Star, Eye, Smile, Activity } from "lucide-react";
import AddChildRecordForm from "./AddChildRecordForm";
import { format, parseISO } from "date-fns";

const TYPE_META = {
  growth:               { label: "Growth",       icon: Ruler,       color: "bg-emerald-100 text-emerald-700" },
  vaccination:          { label: "Vaccination",   icon: Syringe,     color: "bg-blue-100 text-blue-700" },
  measurement:          { label: "Measurement",   icon: Activity,    color: "bg-purple-100 text-purple-700" },
  visit:                { label: "Visit",         icon: Stethoscope, color: "bg-slate-100 text-slate-700" },
  medication:           { label: "Medication",    icon: Pill,        color: "bg-rose-100 text-rose-700" },
  allergy_event:        { label: "Allergy",       icon: Star,        color: "bg-amber-100 text-amber-700" },
  dental:               { label: "Dental",        icon: Smile,       color: "bg-teal-100 text-teal-700" },
  vision:               { label: "Vision",        icon: Eye,         color: "bg-indigo-100 text-indigo-700" },
  development_milestone:{ label: "Milestone",     icon: Star,        color: "bg-pink-100 text-pink-700" },
};

function RecordSummary({ record }) {
  const meta = TYPE_META[record.record_type] || { label: record.record_type, icon: Activity, color: "bg-slate-100 text-slate-700" };
  const Icon = meta.icon;

  let detail = record.notes || "";
  if (record.record_type === "growth") {
    const parts = [];
    if (record.height_cm) parts.push(`${record.height_cm} cm`);
    if (record.weight_kg) parts.push(`${record.weight_kg} kg`);
    detail = parts.join(" · ");
  } else if (record.record_type === "vaccination") {
    detail = [record.vaccine_name, record.vaccine_dose].filter(Boolean).join(" — ");
  } else if (record.record_type === "measurement") {
    detail = `${record.measurement_value}${record.measurement_unit ? " " + record.measurement_unit : ""}`;
    if (record.measurement_value_secondary) detail += ` / ${record.measurement_value_secondary}`;
  } else if (record.record_type === "visit") {
    detail = [record.visit_reason, record.doctor_name].filter(Boolean).join(" · ");
  } else if (record.record_type === "development_milestone") {
    detail = record.milestone_description || "";
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className={`p-2 rounded-lg ${meta.color} flex-shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">{meta.label}</span>
          <span className="text-xs text-slate-400">{format(parseISO(record.recorded_at), "d MMM yyyy")}</span>
        </div>
        {detail && <p className="text-sm text-slate-500 truncate">{detail}</p>}
      </div>
    </div>
  );
}

export default function ChildRecordList({ child }) {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRecords = async () => {
    setLoading(true);
    const data = await base44.entities.ChildHealthRecord.filter({ child_id: child.id }, "-recorded_at", 50);
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => { loadRecords(); }, [child.id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">Health Records</h3>
        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white gap-1" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Add Record
        </Button>
      </div>

      {showForm && (
        <AddChildRecordForm
          childId={child.id}
          onSaved={() => { setShowForm(false); loadRecords(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {loading ? (
          <div className="p-6 text-center text-slate-400 text-sm">Loading…</div>
        ) : records.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">No records yet. Add the first one!</div>
        ) : (
          <div className="p-4">
            {records.map(r => <RecordSummary key={r.id} record={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}