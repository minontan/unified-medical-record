import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import MeasurementForm from "@/components/measurements/MeasurementForm";
import MeasurementChart from "@/components/measurements/MeasurementChart";
import MeasurementHistory from "@/components/measurements/MeasurementHistory";
import { Plus, BarChart3, List, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

const measurementTypes = [
  { value: "blood_pressure", label: "Blood Pressure", condition: "hypertension" },
  { value: "heart_rate", label: "Heart Rate", condition: "hypertension" },
  { value: "blood_glucose", label: "Blood Glucose", condition: "diabetes" },
  { value: "weight", label: "Weight", condition: "general" },
];

export default function Measurements() {
  const { t } = useTranslation();
  const [measurements, setMeasurements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState("blood_pressure");
  const [view, setView] = useState("chart");
  const [loading, setLoading] = useState(true);
  const [conditionFilter, setConditionFilter] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cond = params.get("condition");
    if (cond) {
      setConditionFilter(cond);
      const firstType = measurementTypes.find((t) => t.condition === cond);
      if (firstType) setSelectedType(firstType.value);
    }
    loadMeasurements();
  }, []);

  const loadMeasurements = async () => {
    const user = await base44.auth.me();
    const data = await base44.entities.HealthMeasurement.filter({ created_by: user.email }, "-measured_at", 200);
    setMeasurements(data);
    setLoading(false);
  };

  const handleSubmit = async (data) => {
    await base44.entities.HealthMeasurement.create(data);
    await loadMeasurements();
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.HealthMeasurement.delete(id);
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  };

  const filteredTypes = conditionFilter === "all"
    ? measurementTypes
    : measurementTypes.filter((t) => t.condition === conditionFilter);

  const filteredMeasurements = conditionFilter === "all"
    ? measurements
    : measurements.filter((m) => m.condition === conditionFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('measurements.title')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('measurements.history')}</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 px-5"
        >
          <Plus className="w-4 h-4" /> {showForm ? "Close" : "Log Measurement"}
        </Button>
      </div>

      {showForm && (
        <MeasurementForm onSubmit={handleSubmit} onClose={() => setShowForm(false)} />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={conditionFilter} onValueChange={(v) => {
          setConditionFilter(v);
          const ft = v === "all" ? measurementTypes : measurementTypes.filter((t) => t.condition === v);
          if (ft.length && !ft.find((t) => t.value === selectedType)) {
            setSelectedType(ft[0].value);
          }
        }}>
          <SelectTrigger className="w-48 h-10 rounded-xl border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            <SelectItem value="hypertension">Hypertension</SelectItem>
            <SelectItem value="diabetes">Diabetes</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-52 h-10 rounded-xl border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filteredTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 ml-auto">
          <button
            onClick={() => setView("chart")}
            className={`p-2 rounded-md transition-all ${view === "chart" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-md transition-all ${view === "list" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "chart" ? (
        <MeasurementChart measurements={measurements} selectedType={selectedType} />
      ) : (
        <MeasurementHistory measurements={filteredMeasurements} onDelete={handleDelete} />
      )}
    </div>
  );
}