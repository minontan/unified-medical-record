import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Droplets, TestTube2, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const FLOW_COLORS = { light: "bg-pink-100 text-pink-600", medium: "bg-pink-200 text-pink-700", heavy: "bg-red-100 text-red-700", spotting: "bg-rose-50 text-rose-500" };

const LOG_TYPES = [
  { value: "menstrual_cycle", label: "Period / Cycle Day", icon: Droplets },
  { value: "ovulation_test", label: "Ovulation Test Strip", icon: TestTube2 },
  { value: "pregnancy_test", label: "Pregnancy Test", icon: Baby },
];

export default function MenstrualSection({ logs, onCreate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [logType, setLogType] = useState("menstrual_cycle");
  const [form, setForm] = useState({ logged_at: new Date().toISOString().slice(0, 16), result: "", cycle_day: "", cycle_length_days: "", period_flow: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const relevant = logs.filter((l) => ["menstrual_cycle", "ovulation_test", "pregnancy_test"].includes(l.log_type));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const entry = { log_type: logType, logged_at: new Date(form.logged_at).toISOString(), notes: form.notes };
    if (logType === "menstrual_cycle") {
      if (form.period_flow) entry.period_flow = form.period_flow;
      if (form.cycle_day) entry.cycle_day = parseInt(form.cycle_day);
      if (form.cycle_length_days) entry.cycle_length_days = parseInt(form.cycle_length_days);
    }
    if (logType === "ovulation_test" || logType === "pregnancy_test") {
      entry.result = form.result;
    }
    await onCreate(entry);
    setShowForm(false);
    setForm({ logged_at: new Date().toISOString().slice(0, 16), result: "", cycle_day: "", cycle_length_days: "", period_flow: "", notes: "" });
    setSaving(false);
  };

  const typeLabel = { menstrual_cycle: "Period", ovulation_test: "Ovulation Test", pregnancy_test: "Pregnancy Test" };
  const typeIcon = { menstrual_cycle: Droplets, ovulation_test: TestTube2, pregnancy_test: Baby };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Cycle & Fertility Tracking</h2>
        <Button onClick={() => setShowForm(!showForm)} className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white gap-2 h-9 px-4 text-sm">
          <Plus className="w-4 h-4" /> Log Entry
        </Button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Entry Type</Label>
                <Select value={logType} onValueChange={setLogType}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOG_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Date & Time</Label>
                <Input type="datetime-local" value={form.logged_at} onChange={(e) => setForm({ ...form, logged_at: e.target.value })} className="rounded-xl border-slate-200 h-10" required />
              </div>
            </div>

            {logType === "menstrual_cycle" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Flow</Label>
                  <Select value={form.period_flow} onValueChange={(v) => setForm({ ...form, period_flow: v })}>
                    <SelectTrigger className="rounded-xl border-slate-200 h-10"><SelectValue placeholder="Select flow" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spotting">Spotting</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Cycle Day</Label>
                  <Input type="number" min="1" max="40" value={form.cycle_day} onChange={(e) => setForm({ ...form, cycle_day: e.target.value })} className="rounded-xl border-slate-200 h-10" placeholder="e.g. 1" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Cycle Length (days)</Label>
                  <Input type="number" min="20" max="45" value={form.cycle_length_days} onChange={(e) => setForm({ ...form, cycle_length_days: e.target.value })} className="rounded-xl border-slate-200 h-10" placeholder="e.g. 28" />
                </div>
              </div>
            )}

            {(logType === "ovulation_test" || logType === "pregnancy_test") && (
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Result</Label>
                <Select value={form.result} onValueChange={(v) => setForm({ ...form, result: v })}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-10"><SelectValue placeholder="Select result" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive ✓</SelectItem>
                    <SelectItem value="negative">Negative ✗</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl border-slate-200 resize-none" rows={2} placeholder="Any symptoms, observations..." />
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
          <Droplets className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No cycle or fertility entries yet. Start logging above.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {relevant.map((l) => {
            const Icon = typeIcon[l.log_type] || Droplets;
            return (
              <div key={l.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-pink-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{typeLabel[l.log_type]}</span>
                    {l.result && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${l.result === "positive" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                        {l.result === "positive" ? "Positive ✓" : "Negative ✗"}
                      </span>
                    )}
                    {l.period_flow && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FLOW_COLORS[l.period_flow]}`}>{l.period_flow}</span>}
                    {l.cycle_day && <span className="text-xs text-slate-400">Day {l.cycle_day}</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{format(new Date(l.logged_at), "dd MMM yyyy, HH:mm")}</p>
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