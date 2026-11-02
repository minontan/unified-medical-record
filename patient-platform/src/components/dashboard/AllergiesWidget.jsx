import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AllergiesWidget() {
  const [profile, setProfile] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [newAllergy, setNewAllergy] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const user = await base44.auth.me();
    const profiles = await base44.entities.UserHealthProfile.filter({ created_by: user.email }, "-created_date", 1);
    if (profiles.length > 0) {
      setProfile(profiles[0]);
      setAllergies(profiles[0].allergies || []);
    }
    setLoading(false);
  };

  const saveAllergies = async (updated) => {
    setSaving(true);
    const user = await base44.auth.me();
    if (profile) {
      await base44.entities.UserHealthProfile.update(profile.id, { allergies: updated });
    } else {
      // Create a minimal profile just to store allergies
      const created = await base44.entities.UserHealthProfile.create({
        date_of_birth: "2000-01-01",
        biological_sex: "male",
        allergies: updated,
      });
      setProfile(created);
    }
    setAllergies(updated);
    setSaving(false);
  };

  const handleAdd = async () => {
    const trimmed = newAllergy.trim();
    if (!trimmed) return;
    const updated = [...allergies, trimmed];
    setNewAllergy("");
    setAdding(false);
    await saveAllergies(updated);
  };

  const handleRemove = async (index) => {
    const updated = allergies.filter((_, i) => i !== index);
    await saveAllergies(updated);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") { setAdding(false); setNewAllergy(""); }
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <h2 className="text-sm font-semibold text-slate-700">Known Allergies</h2>
        </div>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-slate-300" />}
      </div>

      {allergies.length === 0 && !adding ? (
        <p className="text-sm text-slate-400 text-center py-2 mb-3">No allergies recorded</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-3">
          {allergies.map((allergy, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full"
            >
              {allergy}
              <button
                onClick={() => handleRemove(i)}
                className="hover:text-red-500 transition-colors ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {adding ? (
        <div className="flex gap-2">
          <Input
            autoFocus
            value={newAllergy}
            onChange={e => setNewAllergy(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Penicillin, Peanuts, Dust mites…"
            className="h-8 text-sm rounded-lg"
          />
          <Button size="sm" onClick={handleAdd} className="h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-3">Add</Button>
          <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewAllergy(""); }} className="h-8 rounded-lg px-2">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-teal-600 font-medium hover:text-teal-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add allergy
        </button>
      )}
    </div>
  );
}