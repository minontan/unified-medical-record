import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

export default function AddChildForm({ onSaved, onCancel }) {
  const [form, setForm] = useState({ full_name: "", date_of_birth: "", sex: "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.full_name || !form.date_of_birth || !form.sex) return;
    setSaving(true);
    await base44.entities.ChildProfile.create(form);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Add Child</h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Full Name</Label>
          <Input
            placeholder="e.g. Ethan Tan"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          />
        </div>
        <div>
          <Label>Date of Birth</Label>
          <Input
            type="date"
            value={form.date_of_birth}
            onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
          />
        </div>
        <div>
          <Label>Sex</Label>
          <Select value={form.sex} onValueChange={v => setForm(f => ({ ...f, sex: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select sex" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button
          size="sm"
          className="bg-teal-600 hover:bg-teal-700 text-white"
          onClick={handleSave}
          disabled={saving || !form.full_name || !form.date_of_birth || !form.sex}
        >
          {saving ? "Saving…" : "Add Child"}
        </Button>
      </div>
    </div>
  );
}