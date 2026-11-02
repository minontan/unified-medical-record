import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Baby, ClipboardList, ArrowRightLeft, Trash2, FileText } from "lucide-react";
import ChildCard, { getAgeLabel } from "@/components/family/ChildCard";
import AddChildForm from "@/components/family/AddChildForm";
import ChildRecordList from "@/components/family/ChildRecordList";
import TransferCarePanel from "@/components/family/TransferCarePanel";
import ChildHealthSummary from "@/components/family/ChildHealthSummary";

export default function FamilyHub() {
  const [children, setChildren] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadChildren = async () => {
    const data = await base44.entities.ChildProfile.list("-created_date");
    setChildren(data);
    if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
    setLoading(false);
  };

  useEffect(() => { loadChildren(); }, []);

  const selected = children.find(c => c.id === selectedId);

  const handleDelete = async (child) => {
    if (!confirm(`Remove ${child.full_name} from your family hub?`)) return;
    await base44.entities.ChildProfile.delete(child.id);
    setSelectedId(null);
    loadChildren();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Family Hub</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your children's health records in one place</p>
        </div>
        {!showAddForm && (
          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-4 h-4" /> Add Child
          </Button>
        )}
      </div>

      {/* Add child form */}
      {showAddForm && (
        <AddChildForm
          onSaved={() => { setShowAddForm(false); loadChildren(); }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : children.length === 0 ? (
        /* Empty state */
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Baby className="w-8 h-8 text-teal-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No children added yet</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            Add your child's profile to start tracking their health records, vaccinations, and growth.
          </p>
          <Button
            className="mt-5 bg-teal-600 hover:bg-teal-700 text-white gap-2"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-4 h-4" /> Add First Child
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Children list */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1 mb-2">Children</p>
            {children.map(child => (
              <ChildCard
                key={child.id}
                child={child}
                isSelected={child.id === selectedId}
                onClick={() => setSelectedId(child.id)}
              />
            ))}
          </div>

          {/* Child detail */}
          {selected && (
            <div className="lg:col-span-3 space-y-5">
              {/* Child header */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selected.full_name}</h2>
                  <p className="text-slate-500 text-sm">
                    {getAgeLabel(selected.date_of_birth)} · {selected.sex}
                    {selected.known_conditions?.length > 0 && (
                      <span className="ml-2 text-rose-600">· {selected.known_conditions.join(", ")}</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(selected)}
                  className="text-slate-300 hover:text-red-400 transition-colors p-2"
                  title="Remove child"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="summary">
                <TabsList className="bg-slate-100">
                  <TabsTrigger value="summary" className="gap-1.5">
                    <FileText className="w-4 h-4" /> Summary
                  </TabsTrigger>
                  <TabsTrigger value="records" className="gap-1.5">
                    <ClipboardList className="w-4 h-4" /> Health Records
                  </TabsTrigger>
                  <TabsTrigger value="transfer" className="gap-1.5">
                    <ArrowRightLeft className="w-4 h-4" /> Transfer of Care
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="summary" className="mt-4">
                  <ChildHealthSummary child={selected} />
                </TabsContent>
                <TabsContent value="records" className="mt-4">
                  <ChildRecordList child={selected} />
                </TabsContent>
                <TabsContent value="transfer" className="mt-4">
                  <TransferCarePanel child={selected} onUpdated={loadChildren} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      )}
    </div>
  );
}