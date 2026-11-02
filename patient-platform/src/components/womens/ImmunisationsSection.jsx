import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const IMMUNISATIONS = [
  { value: "influenza", label: "Influenza (Flu)" },
  { value: "tdap", label: "Tdap (Whooping Cough / Tetanus)" },
  { value: "covid19", label: "COVID-19" },
  { value: "hepatitis_b", label: "Hepatitis B" },
  { value: "rubella_check", label: "Rubella Immunity Check" },
  { value: "other", label: "Other" },
];

const STATUS_COLORS = {
  received: "bg-emerald-100 text-emerald-700",
  due: "bg-amber-100 text-amber-700",
  declined: "bg-slate-100 text-slate-500",
  checked: "bg-sky-100 text-sky-700",
};

const STATUS_LABELS = { received: "Received", due: "Due", declined: "Declined", checked: "Immunity Checked" };

const IMMUNISATION_LABELS = Object.fromEntries(IMMUNISATIONS.map((i) => [i.value, i.label]));

export default function ImmunisationsSection({ logs, onCreate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    logged_at: new Date().toISOString().slice(0, 16),
    immunisation_name: "influenza",
    immunisation_status: "received",
    immunisation_date: "",
    gestational_week: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const relevant = logs.filter((l) => l.log_type === "pregnancy_immunisation");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onCreate({
      log_type: "pregnancy_immunisation",
      logged_at: new Date(form.logged_at).toISOString(),
      immunisation_name: form.immunisation_name,
      immunisation_status: form.immunisation_status,
      immunisation_date: form.immunisation_date || undefined,
      gestational_week: form.gestational_week ? parseInt(form.gestational_week) : undefined,
      notes: form.notes,
    });
    setShowForm(false);
    setForm({ logged_at: new Date().toISOString().slice(0, 16), immunisation_name: "influenza", immunisation_status: "received", immunisation_date: "", gestational_week: "", notes: "" });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Immunisations in Pregnancy</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track vaccinations received or due during pregnancy</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white gap-2 h-9 px-4 text-sm">
          <Plus className="w-4 h-4" /> Add Record
        </Button>
      </div>

      {/* Info panel */}
      <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-pink-700 mb-1">Commonly recommended in pregnancy:</p>
        <ul className="text-xs text-pink-600 space-y-0.5 list-disc list-inside">
          <li>Influenza — any trimester</li>
          <li>Tdap (whooping cough) — 16–32 weeks</li>
          <li>COVID-19 — discuss with your doctor</li>
          <li>Hepatitis B — if not immune</li>
          <li>Rubella — check immunity (do NOT receive live vaccine when pregnant)</li>
        </ul>
      </div>

      {/* Disclaimer */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <p className="text-xs text-slate-500 italic">⚠️ This information is not medical advice. Please discuss all vaccinations and immunisation decisions with your doctor or healthcare provider.</p>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Immunisation</Label>
                <Select value={form.immunisation_name} onValueChange={(v) => setForm({ ...form, immunisation_name: v })}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {IMMUNISATIONS.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Status</Label>
                <Select value={form.immunisation_status} onValueChange={(v) => setForm({ ...form, immunisation_status: v })}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="due">Due</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="checked">Immunity Checked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Date Given / Checked</Label>
                <Input type="date" value={form.immunisation_date} onChange={(e) => setForm({ ...form, immunisation_date: e.target.value })} className="rounded-xl border-slate-200 h-10" />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Gestational Week (optional)</Label>
                <Input type="number" min="1" max="42" value={form.gestational_week} onChange={(e) => setForm({ ...form, gestational_week: e.target.value })} className="rounded-xl border-slate-200 h-10" placeholder="e.g. 20" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl border-slate-200 resize-none" rows={2} placeholder="Batch number, clinic, reaction notes..." />
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
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No immunisation records yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {relevant.map((l) => (
            <div key={l.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800">{IMMUNISATION_LABELS[l.immunisation_name] || l.immunisation_name}</span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[l.immunisation_status]}`}>{STATUS_LABELS[l.immunisation_status]}</span>
                </div>
                <div className="flex gap-2 mt-0.5 flex-wrap">
                  {l.immunisation_date && <p className="text-xs text-slate-400">{format(new Date(l.immunisation_date), "dd MMM yyyy")}</p>}
                  {l.gestational_week && <span className="text-xs text-pink-500">Week {l.gestational_week}</span>}
                </div>
                {l.notes && <p className="text-xs text-slate-500 mt-1 italic">{l.notes}</p>}
              </div>
              <button onClick={() => onDelete(l.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}