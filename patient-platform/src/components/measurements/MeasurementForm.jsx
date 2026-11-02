import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, FlaskConical } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

// Which measurement types can be pre-filled from lab results, and what keywords to match
const LAB_LINKED = {
  blood_glucose: ["glucose", "blood glucose", "fasting glucose", "random glucose", "plasma glucose", "serum glucose", "bsl", "fpg", "rpg"],
  hba1c: ["hba1c", "hb a1c", "glycated haemoglobin", "glycated hemoglobin", "a1c", "haemoglobin a1c", "hemoglobin a1c", "hba 1c", "glycohaemoglobin"],
  total_cholesterol: ["total cholesterol", "cholesterol total", "cholesterol, total", "chol", "tc", "t-chol", "serum cholesterol"],
  ldl_cholesterol: ["ldl", "ldl cholesterol", "ldl-c", "ldl-cholesterol", "low density lipoprotein", "low-density lipoprotein", "ldl chol", "ldl-c (calc)", "calculated ldl"],
  hdl_cholesterol: ["hdl", "hdl cholesterol", "hdl-c", "hdl-cholesterol", "high density lipoprotein", "high-density lipoprotein", "hdl chol"],
  triglycerides: ["triglycerides", "triglyceride", "tg", "trigs", "fasting triglycerides", "trig"],
};

const measurementTypes = {
  blood_pressure: { label: "Blood Pressure", unit: "mmHg", hasSecondary: true, condition: "hypertension", primaryLabel: "Systolic", secondaryLabel: "Diastolic" },
  heart_rate: { label: "Heart Rate", unit: "bpm", hasSecondary: false, condition: "hypertension", primaryLabel: "BPM" },
  blood_glucose: { label: "Blood Glucose", unit: "mg/dL", unitOptions: ["mg/dL", "mmol/L"], hasSecondary: false, condition: "diabetes", primaryLabel: "Glucose" },
  hba1c: { label: "HbA1c", unit: "%", unitOptions: ["%", "mmol/mol"], hasSecondary: false, condition: "diabetes", primaryLabel: "HbA1c" },
  total_cholesterol: { label: "Total Cholesterol", unit: "mg/dL", unitOptions: ["mg/dL", "mmol/L"], hasSecondary: false, condition: "hyperlipidaemia", primaryLabel: "Total" },
  ldl_cholesterol: { label: "LDL Cholesterol", unit: "mg/dL", unitOptions: ["mg/dL", "mmol/L"], hasSecondary: false, condition: "hyperlipidaemia", primaryLabel: "LDL" },
  hdl_cholesterol: { label: "HDL Cholesterol", unit: "mg/dL", unitOptions: ["mg/dL", "mmol/L"], hasSecondary: false, condition: "hyperlipidaemia", primaryLabel: "HDL" },
  triglycerides: { label: "Triglycerides", unit: "mg/dL", unitOptions: ["mg/dL", "mmol/L"], hasSecondary: false, condition: "hyperlipidaemia", primaryLabel: "Triglycerides" },
  weight: { label: "Weight", unit: "kg", hasSecondary: false, condition: "general", primaryLabel: "Weight" },
};

export default function MeasurementForm({ onSubmit, onClose }) {
  const [type, setType] = useState("");
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const getLocalDatetime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now - offset).toISOString().slice(0, 16);
  };
  const [date, setDate] = useState(getLocalDatetime());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [labSuggestions, setLabSuggestions] = useState([]);

  const config = measurementTypes[type];

  const handleTypeChange = async (newType) => {
    setType(newType);
    const newConfig = measurementTypes[newType];
    setSelectedUnit(newConfig?.unit || "");
    setLabSuggestions([]);

    const keywords = LAB_LINKED[newType];
    if (!keywords) return;

    const user = await base44.auth.me();
    const allResults = await base44.entities.LabResult.filter({ created_by: user.email }, "-collected_at", 200);
    const matches = allResults.filter((r) =>
      r.numeric_result != null &&
      keywords.some((kw) => r.test_name?.toLowerCase().includes(kw))
    );
    // Deduplicate by date+test, take most recent 5
    const seen = new Set();
    const deduped = matches.filter((r) => {
      const k = `${r.test_name}_${r.collected_at?.slice(0, 10)}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 5);
    setLabSuggestions(deduped);
  };

  const applyLabSuggestion = (r) => {
    setPrimary(String(r.numeric_result));
    if (r.unit) setSelectedUnit(r.unit);
    setDate(r.collected_at ? r.collected_at.slice(0, 16) : date);
    setLabSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      measurement_type: type,
      value_primary: parseFloat(primary),
      value_secondary: config?.hasSecondary ? parseFloat(secondary) : undefined,
      unit: selectedUnit || config.unit,
      measured_at: new Date(date).toISOString(),
      notes: notes || undefined,
      condition: config.condition,
    });
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl shadow-slate-200/50">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Log Measurement</h3>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Measurement Type</Label>
          <Select value={type} onValueChange={handleTypeChange}>
            <SelectTrigger className="mt-1.5 h-11 rounded-xl border-slate-200">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(measurementTypes).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {labSuggestions.length > 0 && (
          <div className="rounded-xl border border-teal-100 bg-teal-50 p-3 space-y-2">
            <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wide flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" /> From your lab results — tap to fill
            </p>
            {labSuggestions.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => applyLabSuggestion(r)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-teal-100 hover:border-teal-400 transition-colors text-left"
              >
                <span className="text-xs text-slate-600 truncate">{r.test_name}</span>
                <span className="text-xs font-semibold text-teal-700 ml-2 flex-shrink-0">
                  {r.numeric_result} {r.unit} &middot; {r.collected_at ? format(new Date(r.collected_at), "d MMM yyyy") : ""}
                </span>
              </button>
            ))}
          </div>
        )}

        {config && (
          <>
            {config.unitOptions && (
              <div>
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Unit</Label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="mt-1.5 h-11 rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {config.unitOptions.map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className={`grid ${config.hasSecondary ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
              <div>
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{config.primaryLabel}</Label>
                <div className="relative mt-1.5">
                  <Input
                    type="number"
                    step="0.1"
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 pr-20"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{selectedUnit || config.unit}</span>
                </div>
              </div>
              {config.hasSecondary && (
                <div>
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{config.secondaryLabel}</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type="number"
                      step="0.1"
                      value={secondary}
                      onChange={(e) => setSecondary(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 pr-20"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{selectedUnit || config.unit}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div>
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Date & Time</Label>
          <Input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1.5 h-11 rounded-xl border-slate-200"
            required
          />
        </div>

        <div>
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notes (optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1.5 rounded-xl border-slate-200 resize-none"
            rows={2}
            placeholder="Any additional notes..."
          />
        </div>

        <Button
          type="submit"
          disabled={!type || !primary || loading}
          className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium"
        >
          {loading ? "Saving..." : "Save Measurement"}
        </Button>
      </form>
    </div>
  );
}