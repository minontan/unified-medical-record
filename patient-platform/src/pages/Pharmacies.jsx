import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Loader2, Pill, Phone, MapPin, Globe, Clock, Pencil, Trash2, Search, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

function PharmacyForm({ pharmacy, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: pharmacy?.name || "",
    address: pharmacy?.address || "",
    city: pharmacy?.city || "",
    postal_code: pharmacy?.postal_code || "",
    phone: pharmacy?.phone || "",
    email: pharmacy?.email || "",
    website: pharmacy?.website || "",
    opening_hours: pharmacy?.opening_hours || "",
    is_dispensing: pharmacy?.is_dispensing ?? false,
    accepts_walk_in: pharmacy?.accepts_walk_in ?? true,
    notes: pharmacy?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800 mb-4">{pharmacy ? "Edit Pharmacy" : "Add Pharmacy"}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Pharmacy Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl border-slate-200 h-10" placeholder="e.g. Guardian Pharmacy" required />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Address *</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-xl border-slate-200 h-10" placeholder="Street address" required />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">City</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-xl border-slate-200 h-10" />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Postal Code</Label>
            <Input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className="rounded-xl border-slate-200 h-10" />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl border-slate-200 h-10" />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Website</Label>
            <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="rounded-xl border-slate-200 h-10" placeholder="https://..." />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Opening Hours</Label>
            <Input value={form.opening_hours} onChange={(e) => setForm({ ...form, opening_hours: e.target.value })} className="rounded-xl border-slate-200 h-10" placeholder="e.g. Mon-Fri 9am-9pm, Sat-Sun 9am-6pm" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl border-slate-200 resize-none" rows={2} />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-1">
          <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Dispensing Pharmacy</p>
              <p className="text-xs text-slate-400">Can dispense medications with a prescription</p>
            </div>
            <Switch checked={form.is_dispensing} onCheckedChange={(v) => setForm({ ...form, is_dispensing: v })} />
          </div>
          <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Walk-in Accepted</p>
              <p className="text-xs text-slate-400">No appointment needed</p>
            </div>
            <Switch checked={form.accepts_walk_in} onCheckedChange={(v) => setForm({ ...form, accepts_walk_in: v })} />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">Cancel</Button>
          <Button type="submit" disabled={saving || !form.name || !form.address} className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function Pharmacies() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDispensing, setFilterDispensing] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [u, data] = await Promise.all([
      base44.auth.me(),
      base44.entities.Pharmacy.list("-created_date", 200),
    ]);
    setUser(u);
    setPharmacies(data);
    setLoading(false);
  };

  const handleSave = async (form) => {
    if (editingPharmacy) {
      const updated = await base44.entities.Pharmacy.update(editingPharmacy.id, form);
      setPharmacies((prev) => prev.map((p) => (p.id === editingPharmacy.id ? updated : p)));
    } else {
      const created = await base44.entities.Pharmacy.create(form);
      setPharmacies((prev) => [created, ...prev]);
    }
    setShowForm(false);
    setEditingPharmacy(null);
  };

  const handleDelete = async (id) => {
    await base44.entities.Pharmacy.delete(id);
    setPharmacies((prev) => prev.filter((p) => p.id !== id));
  };

  const handleEdit = (pharmacy) => {
    setEditingPharmacy(pharmacy);
    setShowForm(true);
  };

  const filtered = pharmacies.filter((p) => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.address?.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase());
    const matchDispensing = filterDispensing === "all" || (filterDispensing === "dispensing" && p.is_dispensing) || (filterDispensing === "non_dispensing" && !p.is_dispensing);
    return matchSearch && matchDispensing;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Under construction banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <HardHat className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">This page is under construction</p>
          <p className="text-xs text-amber-600 mt-0.5">The Pharmacies feature is not yet ready. We're working on it and it will be available soon.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pharmacies</h1>
          <p className="text-sm text-slate-400 mt-1">Find pharmacies near you, including those with dispensing capabilities</p>
        </div>
        {user?.role === "admin" && (
          <Button
            onClick={() => { setEditingPharmacy(null); setShowForm(!showForm); }}
            className="h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 px-5"
          >
            <Plus className="w-4 h-4" /> Add Pharmacy
          </Button>
        )}
      </div>

      {showForm && (
        <PharmacyForm
          pharmacy={editingPharmacy}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingPharmacy(null); }}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or location..." className="pl-9 rounded-xl border-slate-200 h-10" />
        </div>
        <div className="flex gap-2">
          {[["all", "All"], ["dispensing", "Dispensing"], ["non_dispensing", "Non-dispensing"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterDispensing(val)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${filterDispensing === val ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Pill className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">{pharmacies.length === 0 ? "No pharmacies added yet." : "No pharmacies match your search."}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <Pill className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 leading-tight">{p.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {p.is_dispensing && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Dispensing</span>
                      )}
                      {p.accepts_walk_in && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-600">Walk-in</span>
                      )}
                    </div>
                  </div>
                </div>
                {user?.role === "admin" && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg text-slate-300 hover:text-teal-500 hover:bg-teal-50 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-500">
                {p.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{p.address}{p.city ? `, ${p.city}` : ""}{p.postal_code ? ` ${p.postal_code}` : ""}</span>
                  </div>
                )}
                {p.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <a href={`tel:${p.phone}`} className="hover:text-teal-600">{p.phone}</a>
                  </div>
                )}
                {p.opening_hours && (
                  <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{p.opening_hours}</span>
                  </div>
                )}
                {p.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 truncate">{p.website.replace(/^https?:\/\//, "")}</a>
                  </div>
                )}
              </div>

              {p.notes && <p className="text-xs text-slate-400 italic border-t border-slate-100 pt-2">{p.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}