import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

const RECORD_TYPES = [
  { value: "growth", label: "Growth (Height/Weight)" },
  { value: "vaccination", label: "Vaccination" },
  { value: "measurement", label: "Measurement" },
  { value: "visit", label: "Doctor Visit" },
  { value: "medication", label: "Medication" },
  { value: "allergy_event", label: "Allergy Event" },
  { value: "dental", label: "Dental" },
  { value: "vision", label: "Vision" },
  { value: "development_milestone", label: "Development Milestone" },
];

export default function AddChildRecordForm({ childId, onSaved, onCancel }) {
  const [form, setForm] = useState({ record_type: "", recorded_at: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.ChildHealthRecord.create({ ...form, child_id: childId });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-700 text-sm">New Record</h4>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Record Type</Label>
          <Select value={form.record_type} onValueChange={v => set("record_type", v)}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {RECORD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Date</Label>
          <Input type="date" value={form.recorded_at} onChange={e => set("recorded_at", e.target.value)} />
        </div>
      </div>

      {form.record_type === "growth" && (
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Height (cm)</Label><Input type="number" placeholder="e.g. 95" onChange={e => set("height_cm", parseFloat(e.target.value))} /></div>
          <div><Label>Weight (kg)</Label><Input type="number" placeholder="e.g. 14.5" onChange={e => set("weight_kg", parseFloat(e.target.value))} /></div>
          <div><Label>Head Circ. (cm)</Label><Input type="number" placeholder="e.g. 48" onChange={e => set("head_circumference_cm", parseFloat(e.target.value))} /></div>
        </div>
      )}

      {form.record_type === "vaccination" && (
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Vaccine Name</Label><Input placeholder="e.g. MMR" onChange={e => set("vaccine_name", e.target.value)} /></div>
          <div><Label>Dose</Label><Input placeholder="e.g. 1st dose" onChange={e => set("vaccine_dose", e.target.value)} /></div>
        </div>
      )}

      {form.record_type === "measurement" && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Type</Label>
            <Select onValueChange={v => set("measurement_type", v)}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                {["blood_pressure","heart_rate","temperature","blood_glucose","spo2","other"].map(v => (
                  <SelectItem key={v} value={v}>{v.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Value</Label><Input type="number" onChange={e => set("measurement_value", parseFloat(e.target.value))} /></div>
          <div><Label>Unit</Label><Input placeholder="e.g. °C" onChange={e => set("measurement_unit", e.target.value)} /></div>
        </div>
      )}

      {form.record_type === "visit" && (
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Reason</Label><Input placeholder="e.g. Fever" onChange={e => set("visit_reason", e.target.value)} /></div>
          <div><Label>Doctor / Clinic</Label><Input placeholder="e.g. Dr. Lim, KKH" onChange={e => set("doctor_name", e.target.value)} /></div>
        </div>
      )}

      {form.record_type === "development_milestone" && (
        <div>
          <Label>Milestone</Label>
          <Input placeholder="e.g. First steps, First words" onChange={e => set("milestone_description", e.target.value)} />
        </div>
      )}

      <div>
        <Label>Notes (optional)</Label>
        <Input placeholder="Any additional notes" onChange={e => set("notes", e.target.value)} />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button
          size="sm"
          className="bg-teal-600 hover:bg-teal-700 text-white"
          onClick={handleSave}
          disabled={saving || !form.record_type || !form.recorded_at}
        >
          {saving ? "Saving…" : "Save Record"}
        </Button>
      </div>
    </div>
  );
}