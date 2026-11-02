import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FlaskConical, Plus, Phone, Globe, Clock, MapPin, Search, X, Pencil, Trash2, CheckCircle2, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DiagnosticCentreForm from "../components/diagnostics/DiagnosticCentreForm";

const SERVICE_LABELS = {
  blood_testing: "Blood Testing",
  radiology: "Radiology",
  ecg: "ECG",
  ultrasound: "Ultrasound",
  xray: "X-Ray",
  mri: "MRI",
  ct_scan: "CT Scan",
};

const SERVICE_COLORS = {
  blood_testing: "bg-red-50 text-red-700 border-red-200",
  radiology: "bg-violet-50 text-violet-700 border-violet-200",
  ecg: "bg-amber-50 text-amber-700 border-amber-200",
  ultrasound: "bg-sky-50 text-sky-700 border-sky-200",
  xray: "bg-slate-100 text-slate-700 border-slate-200",
  mri: "bg-indigo-50 text-indigo-700 border-indigo-200",
  ct_scan: "bg-teal-50 text-teal-700 border-teal-200",
};

export default function DiagnosticCentres() {
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingCentre, setEditingCentre] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [u, data] = await Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.DiagnosticCentre.list(),
    ]);
    setUser(u);
    setCentres(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.DiagnosticCentre.delete(id);
    setCentres((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = async (data) => {
    if (editingCentre) {
      const updated = await base44.entities.DiagnosticCentre.update(editingCentre.id, data);
      setCentres((prev) => prev.map((c) => (c.id === editingCentre.id ? updated : c)));
    } else {
      const created = await base44.entities.DiagnosticCentre.create(data);
      setCentres((prev) => [...prev, created]);
    }
    setShowForm(false);
    setEditingCentre(null);
  };

  const filtered = centres.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.address || "").toLowerCase().includes(search.toLowerCase());
    const matchService =
      serviceFilter === "all" || (c.services || []).includes(serviceFilter);
    return matchSearch && matchService;
  });

  const isAdmin = user?.role === "admin";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
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
          <p className="text-xs text-amber-600 mt-0.5">The Diagnostic Centres feature is not yet ready. We're working on it and it will be available soon.</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Diagnostic Centres</h1>
          <p className="text-sm text-slate-400 mt-1">Find nearby blood testing and radiology services</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => { setEditingCentre(null); setShowForm(true); }}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-2"
          >
            <Plus className="w-4 h-4" /> Add Centre
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <DiagnosticCentreForm
          centre={editingCentre}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingCentre(null); }}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-slate-200 h-10"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", ...Object.keys(SERVICE_LABELS)].map((s) => (
            <button
              key={s}
              onClick={() => setServiceFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                serviceFilter === s
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
              }`}
            >
              {s === "all" ? "All Services" : SERVICE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/80 p-16 text-center">
          <FlaskConical className="w-12 h-12 text-slate-300 mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">No centres found</h2>
          <p className="text-sm text-slate-400 max-w-xs">
            {isAdmin ? "Add the first diagnostic centre using the button above." : "No diagnostic centres have been added yet. Check back soon."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((centre) => (
            <div key={centre.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
              {/* Title row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900 text-base leading-tight">{centre.name}</h3>
                  {centre.city && <p className="text-xs text-slate-400 mt-0.5">{centre.city}</p>}
                </div>
                {isAdmin && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setEditingCentre(centre); setShowForm(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(centre.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Services */}
              <div className="flex flex-wrap gap-1.5">
                {(centre.services || []).map((s) => (
                  <span key={s} className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${SERVICE_COLORS[s] || "bg-slate-100 text-slate-600"}`}>
                    {SERVICE_LABELS[s] || s}
                  </span>
                ))}
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-sm text-slate-500">
                {centre.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                    <span className="text-xs leading-snug">{centre.address}{centre.postal_code ? `, ${centre.postal_code}` : ""}</span>
                  </div>
                )}
                {centre.opening_hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                    <span className="text-xs">{centre.opening_hours}</span>
                  </div>
                )}
                {centre.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                    <a href={`tel:${centre.phone}`} className="text-xs text-teal-600 hover:underline">{centre.phone}</a>
                  </div>
                )}
                {centre.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                    <a href={centre.website} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline truncate">{centre.website.replace(/^https?:\/\//, "")}</a>
                  </div>
                )}
              </div>

              {/* Walk-in badge */}
              <div className="flex gap-2 mt-auto">
                {centre.accepts_walk_in && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Walk-in accepted
                  </span>
                )}
                {centre.appointment_required && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                    Appointment required
                  </span>
                )}
              </div>

              {centre.notes && (
                <p className="text-xs text-slate-400 italic border-t border-slate-100 pt-3">{centre.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}