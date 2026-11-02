import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

const SERVICES = [
  { value: "blood_testing", label: "Blood Testing" },
  { value: "radiology", label: "Radiology" },
  { value: "ecg", label: "ECG" },
  { value: "ultrasound", label: "Ultrasound" },
  { value: "xray", label: "X-Ray" },
  { value: "mri", label: "MRI" },
  { value: "ct_scan", label: "CT Scan" },
];

export default function DiagnosticCentreForm({ centre, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: centre?.name || "",
    address: centre?.address || "",
    city: centre?.city || "",
    postal_code: centre?.postal_code || "",
    phone: centre?.phone || "",
    website: centre?.website || "",
    opening_hours: centre?.opening_hours || "",
    services: centre?.services || [],
    accepts_walk_in: centre?.accepts_walk_in ?? true,
    appointment_required: centre?.appointment_required ?? false,
    notes: centre?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const toggleService = (val) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(val)
        ? f.services.filter((s) => s !== val)
        : [...f.services, val],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-slate-900">{centre ? "Edit Centre" : "Add Diagnostic Centre"}</h2>
        <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Centre Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="rounded-xl border-slate-200" placeholder="e.g. Raffles Medical Lab" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Address *</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required className="rounded-xl border-slate-200" placeholder="Street address" />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">City</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-xl border-slate-200" placeholder="City" />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Postal Code</Label>
            <Input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className="rounded-xl border-slate-200" placeholder="Postal code" />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl border-slate-200" placeholder="+65 6XXX XXXX" />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Website</Label>
            <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="rounded-xl border-slate-200" placeholder="https://..." />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Opening Hours</Label>
            <Input value={form.opening_hours} onChange={(e) => setForm({ ...form, opening_hours: e.target.value })} className="rounded-xl border-slate-200" placeholder="e.g. Mon–Fri 8am–6pm, Sat 8am–1pm" />
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium text-slate-600 mb-2 block">Services Offered *</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SERVICES.map((s) => (
              <label key={s.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={form.services.includes(s.value)}
                  onCheckedChange={() => toggleService(s.value)}
                />
                <span className="text-sm text-slate-700">{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={form.accepts_walk_in} onCheckedChange={(v) => setForm({ ...form, accepts_walk_in: !!v })} />
            <span className="text-sm text-slate-700">Walk-in accepted</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={form.appointment_required} onCheckedChange={(v) => setForm({ ...form, appointment_required: !!v })} />
            <span className="text-sm text-slate-700">Appointment required</span>
          </label>
        </div>

        <div>
          <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Notes</Label>
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl border-slate-200 resize-none" rows={2} placeholder="Any additional info..." />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">Cancel</Button>
          <Button type="submit" disabled={saving || !form.name || !form.address || form.services.length === 0} className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
            {saving ? "Saving..." : centre ? "Save Changes" : "Add Centre"}
          </Button>
        </div>
      </form>
    </div>
  );
}