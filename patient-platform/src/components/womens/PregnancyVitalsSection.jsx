import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Heart, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const CONTEXT_LABELS = {
  fasting: "Fasting",
  "1hr_post_meal": "1hr Post-meal",
  "2hr_post_meal": "2hr Post-meal",
  random: "Random",
};

export default function PregnancyVitalsSection({ logs, onCreate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [vitalType, setVitalType] = useState("pregnancy_bp");
  const [form, setForm] = useState({
    logged_at: new Date().toISOString().slice(0, 16),
    bp_systolic: "", bp_diastolic: "",
    glucose_value: "", glucose_unit: "mmol/L", glucose_context: "fasting",
    gestational_week: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const relevant = logs.filter((l) => ["pregnancy_bp", "pregnancy_glucose"].includes(l.log_type));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const entry = {
      log_type: vitalType,
      logged_at: new Date(form.logged_at).toISOString(),
      gestational_week: form.gestational_week ? parseInt(form.gestational_week) : undefined,
      notes: form.notes,
    };
    if (vitalType === "pregnancy_bp") {
      entry.bp_systolic = parseFloat(form.bp_systolic);
      entry.bp_diastolic = parseFloat(form.bp_diastolic);
    } else {
      entry.glucose_value = parseFloat(form.glucose_value);
      entry.glucose_unit = form.glucose_unit;
      entry.glucose_context = form.glucose_context;
    }
    await onCreate(entry);
    setShowForm(false);
    setForm({ logged_at: new Date().toISOString().slice(0, 16), bp_systolic: "", bp_diastolic: "", glucose_value: "", glucose_unit: "mmol/L", glucose_context: "fasting", gestational_week: "", notes: "" });
    setSaving(false);
  };

  const getBpStatus = (sys, dia) => {
    if (sys >= 140 || dia >= 90) return { label: "High — see doctor", color: "text-red-600 bg-red-50" };
    if (sys >= 130 || dia >= 85) return { label: "Borderline", color: "text-amber-600 bg-amber-50" };
    return { label: "Normal", color: "text-emerald-600 bg-emerald-50" };
  };

  const getGlucoseStatus = (val, context, unit) => {
    const v = unit === "mg/dL" ? val / 18 : val;
    if (context === "fasting" && v > 5.1) return { label: "Above target", color: "text-red-600 bg-red-50" };
    if (context === "1hr_post_meal" && v > 10.0) return { label: "Above target", color: "text-red-600 bg-red-50" };
    if (context === "2hr_post_meal" && v > 8.5) return { label: "Above target", color: "text-red-600 bg-red-50" };
    return { label: "Within target", color: "text-emerald-600 bg-emerald-50" };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Blood Pressure & Glucose in Pregnancy</h2>
          <p className="text-xs text-slate-400 mt-0.5">Monitor for pre-eclampsia and gestational diabetes</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white gap-2 h-9 px-4 text-sm">
          <Plus className="w-4 h-4" /> Log Reading
        </Button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Reading Type</Label>
                <Select value={vitalType} onValueChange={setVitalType}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pregnancy_bp">Blood Pressure</SelectItem>
                    <SelectItem value="pregnancy_glucose">Blood Glucose</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Date & Time</Label>
                <Input type="datetime-local" value={form.logged_at} onChange={(e) => setForm({ ...form, logged_at: e.target.value })} className="rounded-xl border-slate-200 h-10" required />
              </div>

              {vitalType === "pregnancy_bp" && (
                <>
                  <div>
                    <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Systolic (mmHg)</Label>
                    <Input type="number" value={form.bp_systolic} onChange={(e) => setForm({ ...form, bp_systolic: e.target.value })} className="rounded-xl border-slate-200 h-10" placeholder="e.g. 120" required />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Diastolic (mmHg)</Label>
                    <Input type="number" value={form.bp_diastolic} onChange={(e) => setForm({ ...form, bp_diastolic: e.target.value })} className="rounded-xl border-slate-200 h-10" placeholder="e.g. 80" required />
                  </div>
                </>
              )}

              {vitalType === "pregnancy_glucose" && (
                <>
                  <div>
                    <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Glucose Value</Label>
                    <Input type="number" step="0.1" value={form.glucose_value} onChange={(e) => setForm({ ...form, glucose_value: e.target.value })} className="rounded-xl border-slate-200 h-10" placeholder="e.g. 5.0" required />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Unit</Label>
                    <Select value={form.glucose_unit} onValueChange={(v) => setForm({ ...form, glucose_unit: v })}>
                      <SelectTrigger className="rounded-xl border-slate-200 h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mmol/L">mmol/L</SelectItem>
                        <SelectItem value="mg/dL">mg/dL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600 mb-1.5 block">When Measured</Label>
                    <Select value={form.glucose_context} onValueChange={(v) => setForm({ ...form, glucose_context: v })}>
                      <SelectTrigger className="rounded-xl border-slate-200 h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fasting">Fasting (&lt;5.1)</SelectItem>
                        <SelectItem value="1hr_post_meal">1hr Post-meal (&lt;10.0)</SelectItem>
                        <SelectItem value="2hr_post_meal">2hr Post-meal (&lt;8.5)</SelectItem>
                        <SelectItem value="random">Random</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Gestational Week (optional)</Label>
                <Input type="number" min="1" max="42" value={form.gestational_week} onChange={(e) => setForm({ ...form, gestational_week: e.target.value })} className="rounded-xl border-slate-200 h-10" placeholder="e.g. 28" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl border-slate-200 resize-none" rows={2} placeholder="Symptoms, context..." />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={saving} className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white">{saving ? "Saving..." : "Save"}</Button>
            </div>
          </form>
        </div>
      )}

      {relevant.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <Heart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No BP or glucose readings yet. Start tracking above.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {relevant.map((l) => {
            const isBP = l.log_type === "pregnancy_bp";
            const status = isBP
              ? getBpStatus(l.bp_systolic, l.bp_diastolic)
              : getGlucoseStatus(l.glucose_value, l.glucose_context, l.glucose_unit);
            return (
              <div key={l.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isBP ? "bg-red-50" : "bg-amber-50"}`}>
                  {isBP ? <Heart className="w-4 h-4 text-red-400" /> : <Droplets className="w-4 h-4 text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{isBP ? `${l.bp_systolic}/${l.bp_diastolic} mmHg` : `${l.glucose_value} ${l.glucose_unit}`}</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                  </div>
                  <div className="flex gap-2 mt-0.5">
                    <p className="text-xs text-slate-400">{format(new Date(l.logged_at), "dd MMM yyyy, HH:mm")}</p>
                    {!isBP && l.glucose_context && <span className="text-xs text-slate-400">· {CONTEXT_LABELS[l.glucose_context]}</span>}
                    {l.gestational_week && <span className="text-xs text-pink-500">Week {l.gestational_week}</span>}
                  </div>
                  {l.notes && <p className="text-xs text-slate-500 mt-1 italic">{l.notes}</p>}
                </div>
                <button onClick={() => onDelete(l.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}