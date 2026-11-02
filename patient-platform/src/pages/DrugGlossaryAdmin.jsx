import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, CheckCircle2, Loader2, AlertCircle, Database, Eye, RefreshCw, Search, Pencil, Trash2, Plus, X, Save } from "lucide-react";
import { toast } from "sonner";

const TABS = ["Search & Edit", "Bulk Import"];

const EMPTY_DRUG = { drug_name: "", drug_form: "", strength: "", route: "", generic_name: "", brand_name: "" };

export default function DrugGlossaryAdmin() {
  const [tab, setTab] = useState("Search & Edit");

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Drug Glossary</h1>
        <p className="text-sm text-slate-400 mt-1">Search, edit individual entries, or bulk import from file.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Search & Edit" ? <SearchEditTab /> : <BulkImportTab />}
    </div>
  );
}

function SearchEditTab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newDrug, setNewDrug] = useState(EMPTY_DRUG);
  const [totalCount, setTotalCount] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    // Load count on mount
    base44.entities.DrugGlossary.list("drug_name", 1).then(() => {});
    fetchCount();
  }, []);

  const fetchCount = async () => {
    const all = await base44.entities.DrugGlossary.list("drug_name", 1);
    // count is not directly available, just show after search
  };

  const search = async (q) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("searchDrugGlossary", { query: q, limit: 30 });
      setResults(res.data?.results || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const startEdit = (drug) => {
    setEditingId(drug.id);
    setEditData({ ...drug });
    setAddingNew(false);
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async () => {
    setSaving(true);
    await base44.entities.DrugGlossary.update(editingId, {
      drug_name: editData.drug_name,
      drug_form: editData.drug_form,
      strength: editData.strength,
      route: editData.route,
      generic_name: editData.generic_name,
      brand_name: editData.brand_name,
    });
    setResults(prev => prev.map(r => r.id === editingId ? { ...r, ...editData } : r));
    setEditingId(null);
    setSaving(false);
    toast.success("Drug entry updated");
  };

  const deleteDrug = async (id) => {
    if (!confirm("Delete this drug entry?")) return;
    await base44.entities.DrugGlossary.delete(id);
    setResults(prev => prev.filter(r => r.id !== id));
    toast.success("Entry deleted");
  };

  const saveNew = async () => {
    if (!newDrug.drug_name.trim()) { toast.error("Drug name is required"); return; }
    setSaving(true);
    const created = await base44.entities.DrugGlossary.create(newDrug);
    setAddingNew(false);
    setNewDrug(EMPTY_DRUG);
    setSaving(false);
    toast.success("New drug entry added");
    // Re-run search to show it if relevant
    if (query.length >= 2) search(query);
  };

  const FIELDS = [
    { key: "drug_name", label: "Drug Name" },
    { key: "drug_form", label: "Form" },
    { key: "strength", label: "Strength" },
    { key: "route", label: "Route" },
    { key: "generic_name", label: "Generic Name" },
    { key: "brand_name", label: "Brand Name" },
  ];

  return (
    <div className="space-y-4">
      {/* Search bar + Add button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={query}
            onChange={handleQueryChange}
            placeholder="Search by drug name… (min 2 chars)"
            className="pl-9 h-10 rounded-xl"
          />
          {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500 animate-spin" />}
        </div>
        <Button
          onClick={() => { setAddingNew(true); setEditingId(null); }}
          className="h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Drug
        </Button>
      </div>

      {/* Add new form */}
      {addingNew && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-teal-800">New Drug Entry</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className="text-xs text-slate-500 mb-0.5 block">{f.label}{f.key === "drug_name" ? " *" : ""}</label>
                <Input
                  value={newDrug[f.key] || ""}
                  onChange={e => setNewDrug(p => ({ ...p, [f.key]: e.target.value }))}
                  className="h-8 text-sm rounded-lg"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => { setAddingNew(false); setNewDrug(EMPTY_DRUG); }} className="rounded-lg gap-1">
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
            <Button size="sm" onClick={saveNew} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg gap-1">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
            <p className="text-xs text-slate-500 font-medium">{results.length} result{results.length !== 1 ? "s" : ""} for "{query}"</p>
          </div>
          <div className="divide-y divide-slate-100">
            {results.map(drug => (
              <div key={drug.id} className="px-4 py-3">
                {editingId === drug.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {FIELDS.map(f => (
                        <div key={f.key}>
                          <label className="text-xs text-slate-400 mb-0.5 block">{f.label}</label>
                          <Input
                            value={editData[f.key] || ""}
                            onChange={e => setEditData(p => ({ ...p, [f.key]: e.target.value }))}
                            className="h-8 text-sm rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <Button variant="outline" size="sm" onClick={cancelEdit} className="rounded-lg gap-1">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </Button>
                      <Button size="sm" onClick={saveEdit} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg gap-1">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 leading-snug">{drug.drug_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {[drug.drug_form, drug.strength, drug.route].filter(Boolean).join(" · ") || "No additional details"}
                      </p>
                      {(drug.generic_name || drug.brand_name) && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {[drug.generic_name && `Generic: ${drug.generic_name}`, drug.brand_name && `Brand: ${drug.brand_name}`].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(drug)} className="h-7 w-7 text-slate-400 hover:text-teal-600">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteDrug(drug.id)} className="h-7 w-7 text-slate-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-8">No drugs found for "{query}"</p>
      )}

      {query.length === 0 && !addingNew && (
        <p className="text-sm text-slate-400 text-center py-8">Type at least 2 characters to search the glossary</p>
      )}
    </div>
  );
}

function BulkImportTab() {
  const [file, setFile] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const FIELD_LABELS = {
    drug_name: "Drug Name", generic_name: "Generic Name", brand_name: "Brand Name",
    drug_form: "Drug Form", strength: "Strength / Dosage", route: "Route", concept_id: "Concept ID",
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setPreview(null); setResult(null); setError(null); }
  };

  const handlePreview = async () => {
    if (!file) return;
    setPreviewing(true); setError(null); setPreview(null);
    const uploadRes = await base44.integrations.Core.UploadFile({ file });
    const response = await base44.functions.invoke("importDrugGlossary", { file_url: uploadRes.file_url, preview_only: true });
    const data = response.data;
    if (data.error) { setError(data.error); toast.error("Could not read file"); }
    else setPreview(data);
    setPreviewing(false);
  };

  const handleImport = async () => {
    if (!file || !preview) return;
    setImporting(true); setResult(null); setError(null);
    const uploadRes = await base44.integrations.Core.UploadFile({ file });
    const response = await base44.functions.invoke("importDrugGlossary", { file_url: uploadRes.file_url, preview_only: false });
    const data = response.data;
    if (data.success) { setResult(data); toast.success(`Imported ${data.inserted.toLocaleString()} drug entries`); }
    else { setError(data.error || "Import failed"); toast.error("Import failed"); }
    setImporting(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
          <Database className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Bulk Import from File</p>
          <p className="text-xs text-slate-400">Excel or CSV. Columns auto-detected. Replaces entire glossary.</p>
        </div>
      </div>

      <label className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors
        ${file ? "border-teal-300 bg-teal-50" : "border-slate-200 hover:border-teal-300 bg-slate-50 hover:bg-teal-50"}`}>
        <Upload className={`w-8 h-8 ${file ? "text-teal-500" : "text-slate-300"}`} />
        {file ? (
          <div className="text-center">
            <p className="text-sm font-medium text-teal-700">{file.name}</p>
            <p className="text-xs text-teal-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-slate-500 font-medium">Click to select file</p>
            <p className="text-xs text-slate-400 mt-0.5">.xlsx, .xls, or .csv</p>
          </div>
        )}
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
      </label>

      {file && !preview && (
        <Button onClick={handlePreview} disabled={previewing} variant="outline" className="w-full h-10 rounded-xl gap-2">
          {previewing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</> : <><Eye className="w-4 h-4" /> Preview Column Detection</>}
        </Button>
      )}

      {preview && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Detected Columns</p>
              <span className="text-xs text-slate-400">{preview.total_rows?.toLocaleString()} rows</span>
            </div>
            <div className="divide-y divide-slate-100">
              {Object.entries(preview.mapping).map(([field, col]) => (
                <div key={field} className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-slate-600">{FIELD_LABELS[field] || field}</span>
                  {col ? <span className="text-xs bg-teal-50 text-teal-700 font-medium px-2.5 py-1 rounded-lg">"{col}"</span>
                       : <span className="text-xs bg-slate-100 text-slate-400 px-2.5 py-1 rounded-lg">not found</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { setPreview(null); setFile(null); }} variant="outline" className="flex-1 h-10 rounded-xl gap-2">
              <RefreshCw className="w-4 h-4" /> Change File
            </Button>
            <Button onClick={handleImport} disabled={importing} className="flex-1 h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2">
              {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</> : <><Upload className="w-4 h-4" /> Confirm & Import</>}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Import successful</p>
            <p className="text-xs text-emerald-600 mt-0.5">{result.inserted.toLocaleString()} drugs imported from {result.total.toLocaleString()} rows</p>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 text-center">⚠️ Importing replaces all existing glossary entries. Admin only.</p>
    </div>
  );
}