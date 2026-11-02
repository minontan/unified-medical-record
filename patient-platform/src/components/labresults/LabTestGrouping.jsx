import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save, ChevronDown, ChevronUp, Edit2, Trash2 } from "lucide-react";

export default function LabTestGrouping({ allResults, standardizedTests, onStandardizedTestsChange }) {
  // Find all unique raw test names from LabResults
  const rawTestNames = [...new Set(allResults.map((r) => r.test_name).filter(Boolean))];

  // Which raw names are already mapped
  const mappedNames = new Set(standardizedTests.flatMap((s) => s.synonyms || []));
  const unmappedNames = rawTestNames.filter((n) => !mappedNames.has(n));

  const [creating, setCreating] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newRefLow, setNewRefLow] = useState("");
  const [newRefHigh, setNewRefHigh] = useState("");
  const [selectedRaws, setSelectedRaws] = useState([]);
  const [saving, setSaving] = useState(false);
  const [expandedStd, setExpandedStd] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // Link a raw name to an existing standardized test
  const handleLink = async (stdTest, rawName) => {
    const updated = {
      ...stdTest,
      synonyms: [...(stdTest.synonyms || []), rawName],
    };
    await base44.entities.StandardizedLabTest.update(stdTest.id, { synonyms: updated.synonyms });
    onStandardizedTestsChange();
  };

  const handleUnlink = async (stdTest, rawName) => {
    const updated = {
      ...stdTest,
      synonyms: (stdTest.synonyms || []).filter((s) => s !== rawName),
    };
    await base44.entities.StandardizedLabTest.update(stdTest.id, { synonyms: updated.synonyms });
    onStandardizedTestsChange();
  };

  const handleCreate = async () => {
    if (!newDisplayName.trim()) return;
    setSaving(true);
    await base44.entities.StandardizedLabTest.create({
      display_name: newDisplayName.trim(),
      unit: newUnit.trim() || undefined,
      category: newCategory.trim() || undefined,
      reference_range_low: newRefLow !== "" ? parseFloat(newRefLow) : undefined,
      reference_range_high: newRefHigh !== "" ? parseFloat(newRefHigh) : undefined,
      synonyms: selectedRaws,
    });
    setCreating(false);
    setNewDisplayName("");
    setNewUnit("");
    setNewCategory("");
    setNewRefLow("");
    setNewRefHigh("");
    setSelectedRaws([]);
    setSaving(false);
    onStandardizedTestsChange();
  };

  const handleDelete = async (id) => {
    await base44.entities.StandardizedLabTest.delete(id);
    onStandardizedTestsChange();
  };

  const startEdit = (stdTest) => {
    setEditingId(stdTest.id);
    setEditData({
      display_name: stdTest.display_name,
      unit: stdTest.unit || "",
      category: stdTest.category || "",
      reference_range_low: stdTest.reference_range_low ?? "",
      reference_range_high: stdTest.reference_range_high ?? "",
    });
  };

  const saveEdit = async (stdTest) => {
    await base44.entities.StandardizedLabTest.update(stdTest.id, {
      display_name: editData.display_name,
      unit: editData.unit || undefined,
      category: editData.category || undefined,
      reference_range_low: editData.reference_range_low !== "" ? parseFloat(editData.reference_range_low) : undefined,
      reference_range_high: editData.reference_range_high !== "" ? parseFloat(editData.reference_range_high) : undefined,
    });
    setEditingId(null);
    onStandardizedTestsChange();
  };

  const toggleRaw = (name) => {
    setSelectedRaws((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="space-y-5">
      {/* Unmapped tests */}
      {unmappedNames.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Unmatched Tests ({unmappedNames.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {unmappedNames.map((name) => (
              <div key={name} className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
                <span className="text-xs text-amber-800">{name}</span>
                <div className="flex items-center gap-1 ml-1">
                  {standardizedTests.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleLink(s, name)}
                      title={`Link to: ${s.display_name}`}
                      className="text-[10px] text-teal-600 hover:text-teal-800 border border-teal-200 rounded px-1 py-0.5 bg-white"
                    >
                      + {s.display_name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Click a button next to each test to link it to an existing standard, or create a new standard below.</p>
        </div>
      )}
      {unmappedNames.length === 0 && rawTestNames.length > 0 && (
        <p className="text-xs text-emerald-600 font-medium">All test names are matched to a standard. ✓</p>
      )}

      {/* Existing standardized tests */}
      {standardizedTests.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Your Standards</p>
          {standardizedTests.map((std) => (
            <div key={std.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-white">
                {editingId === std.id ? (
                  <div className="flex flex-wrap gap-2 flex-1 mr-3">
                    <Input value={editData.display_name} onChange={(e) => setEditData((p) => ({ ...p, display_name: e.target.value }))} className="h-7 text-xs w-40" placeholder="Name" />
                    <Input value={editData.unit} onChange={(e) => setEditData((p) => ({ ...p, unit: e.target.value }))} className="h-7 text-xs w-24" placeholder="Unit" />
                    <Input value={editData.category} onChange={(e) => setEditData((p) => ({ ...p, category: e.target.value }))} className="h-7 text-xs w-36" placeholder="Category" />
                    <Input type="number" value={editData.reference_range_low} onChange={(e) => setEditData((p) => ({ ...p, reference_range_low: e.target.value }))} className="h-7 text-xs w-20" placeholder="Ref Low" />
                    <Input type="number" value={editData.reference_range_high} onChange={(e) => setEditData((p) => ({ ...p, reference_range_high: e.target.value }))} className="h-7 text-xs w-20" placeholder="Ref High" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-medium text-slate-800">{std.display_name}</span>
                    {std.unit && <span className="text-xs text-slate-400">({std.unit})</span>}
                    {std.category && <Badge className="bg-slate-100 text-slate-600 text-[10px]">{std.category}</Badge>}
                    <span className="text-[10px] text-slate-400 ml-1">{(std.synonyms || []).length} linked</span>
                  </div>
                )}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {editingId === std.id ? (
                    <button onClick={() => saveEdit(std)} className="p-1.5 text-teal-600 hover:text-teal-800"><Save className="w-3.5 h-3.5" /></button>
                  ) : (
                    <button onClick={() => startEdit(std)} className="p-1.5 text-slate-400 hover:text-slate-600"><Edit2 className="w-3.5 h-3.5" /></button>
                  )}
                  <button onClick={() => setExpandedStd((p) => ({ ...p, [std.id]: !p[std.id] }))} className="p-1.5 text-slate-400 hover:text-slate-600">
                    {expandedStd[std.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => handleDelete(std.id)} className="p-1.5 text-slate-200 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {expandedStd[std.id] && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Linked raw test names</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(std.synonyms || []).length === 0 && <p className="text-xs text-slate-400">No names linked yet.</p>}
                    {(std.synonyms || []).map((syn) => (
                      <div key={syn} className="flex items-center gap-1 bg-teal-50 border border-teal-200 rounded-lg px-2 py-0.5">
                        <span className="text-xs text-teal-700">{syn}</span>
                        <button onClick={() => handleUnlink(std, syn)} className="text-teal-400 hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create new standard */}
      {creating ? (
        <div className="border border-teal-200 rounded-xl p-4 space-y-3 bg-teal-50/40">
          <p className="text-xs font-semibold text-slate-700">New Standard Test</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Input value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} className="h-8 text-xs" placeholder="Display name *" />
            <Input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="h-8 text-xs" placeholder="Unit (e.g. g/dL)" />
            <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="h-8 text-xs" placeholder="Category (e.g. Haematology)" />
            <Input type="number" value={newRefLow} onChange={(e) => setNewRefLow(e.target.value)} className="h-8 text-xs" placeholder="Ref range low" />
            <Input type="number" value={newRefHigh} onChange={(e) => setNewRefHigh(e.target.value)} className="h-8 text-xs" placeholder="Ref range high" />
          </div>
          {rawTestNames.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-500 mb-1.5">Select raw test names to link (optional):</p>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {rawTestNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => toggleRaw(name)}
                    className={`text-xs px-2 py-0.5 rounded-lg border transition-colors ${
                      selectedRaws.includes(name)
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={saving || !newDisplayName.trim()} className="h-8 text-xs rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-4">
              {saving ? "Saving…" : "Create Standard"}
            </Button>
            <Button variant="outline" onClick={() => setCreating(false)} className="h-8 text-xs rounded-lg px-4">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-800 font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> Create new standard test
        </button>
      )}
    </div>
  );
}