import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { Loader2, Save } from "lucide-react";

const CANCER_OPTIONS = ["breast", "colorectal", "lung", "cervical", "prostate", "ovarian", "other"];

export default function ScreeningProfileForm({ profile, onSaved }) {
  const [form, setForm] = useState({
    date_of_birth: profile?.date_of_birth || "",
    biological_sex: profile?.biological_sex || "",
    smoking_status: profile?.smoking_status || "never",
    pack_years: profile?.pack_years || "",
    apcs_score: profile?.apcs_score || "",
    sexually_active_ever: profile?.sexually_active_ever ?? false,
    high_risk_breast: profile?.high_risk_breast ?? false,
    family_history_cancers: profile?.family_history_cancers || [],
    alcohol_consumption: profile?.alcohol_consumption || "none",
    bmi: profile?.bmi || "",
  });
  const [saving, setSaving] = useState(false);

  const toggleCancer = (c) => {
    setForm((p) => ({
      ...p,
      family_history_cancers: p.family_history_cancers.includes(c)
        ? p.family_history_cancers.filter((x) => x !== c)
        : [...p.family_history_cancers, c],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      pack_years: form.pack_years !== "" ? parseFloat(form.pack_years) : undefined,
      apcs_score: form.apcs_score !== "" ? parseInt(form.apcs_score) : undefined,
      bmi: form.bmi !== "" ? parseFloat(form.bmi) : undefined,
    };
    if (profile?.id) {
      await base44.entities.UserHealthProfile.update(profile.id, data);
    } else {
      await base44.entities.UserHealthProfile.create(data);
    }
    setSaving(false);
    onSaved();
  };

  const Field = ({ label, children }) => (
    <div>
      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1 block">{label}</Label>
      {children}
    </div>
  );

  const selectClass = "w-full h-9 rounded-xl border border-slate-200 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date of Birth">
          <Input type="date" value={form.date_of_birth} onChange={(e) => setForm((p) => ({ ...p, date_of_birth: e.target.value }))} className="h-9 rounded-xl" />
        </Field>
        <Field label="Biological Sex">
          <select value={form.biological_sex} onChange={(e) => setForm((p) => ({ ...p, biological_sex: e.target.value }))} className={selectClass}>
            <option value="">Select…</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </Field>
        <Field label="Smoking Status">
          <select value={form.smoking_status} onChange={(e) => setForm((p) => ({ ...p, smoking_status: e.target.value }))} className={selectClass}>
            <option value="never">Never smoked</option>
            <option value="current">Current smoker</option>
            <option value="quit_lt_15y">Quit &lt; 15 years ago</option>
            <option value="quit_gt_15y">Quit ≥ 15 years ago</option>
          </select>
        </Field>
        <Field label="Pack-Years (if smoker/ex-smoker)">
          <Input type="number" min="0" value={form.pack_years} onChange={(e) => setForm((p) => ({ ...p, pack_years: e.target.value }))} className="h-9 rounded-xl" placeholder="e.g. 25" />
        </Field>
        <Field label="APCS Score (0–7)">
          <Input type="number" min="0" max="7" value={form.apcs_score} onChange={(e) => setForm((p) => ({ ...p, apcs_score: e.target.value }))} className="h-9 rounded-xl" placeholder="0–7" />
          <div className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-500">Asia-Pacific Colorectal Screening score</span> — score 1 point each for: age 50–69 (+1), age ≥70 (+2), male sex (+1), family history of colorectal cancer (+2), current/ex-smoker (+1), obese BMI ≥25 (+1). Score ≥3 = high risk.
          </div>
        </Field>
        <Field label="BMI">
          <Input type="number" min="10" max="70" step="0.1" value={form.bmi} onChange={(e) => setForm((p) => ({ ...p, bmi: e.target.value }))} className="h-9 rounded-xl" placeholder="e.g. 23.5" />
        </Field>
        <Field label="Alcohol Consumption">
          <select value={form.alcohol_consumption} onChange={(e) => setForm((p) => ({ ...p, alcohol_consumption: e.target.value }))} className={selectClass}>
            <option value="none">None</option>
            <option value="low">Low (1–2 drinks/week)</option>
            <option value="moderate">Moderate (3–7 drinks/week)</option>
            <option value="high">High (&gt;7 drinks/week)</option>
          </select>
        </Field>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { key: "sexually_active_ever", label: "Ever been sexually active" },
          { key: "high_risk_breast", label: "High risk for breast cancer (BRCA / family history)" },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setForm((p) => ({ ...p, [key]: !p[key] }))}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors text-left
              ${form[key] ? "bg-teal-50 border-teal-300 text-teal-700" : "bg-white border-slate-200 text-slate-500"}`}
          >
            <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${form[key] ? "bg-teal-600 border-teal-600" : "border-slate-300"}`}>
              {form[key] && <span className="text-white text-[10px] font-bold">✓</span>}
            </span>
            {label}
          </button>
        ))}
      </div>

      {/* Family history */}
      <div>
        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Family History of Cancer (first-degree relatives)</Label>
        <div className="flex flex-wrap gap-2">
          {CANCER_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCancer(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize
                ${form.family_history_cancers.includes(c) ? "bg-rose-100 border-rose-300 text-rose-700" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving || !form.date_of_birth || !form.biological_sex} className="h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Health Profile</>}
      </Button>
    </div>
  );
}