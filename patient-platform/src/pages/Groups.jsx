import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Plus, Users, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const conditionOptions = [
  { value: "hypertension", label: "Hypertension", color: "bg-rose-100 text-rose-700" },
  { value: "diabetes", label: "Diabetes", color: "bg-amber-100 text-amber-700" },
  { value: "hyperlipidaemia", label: "Hyperlipidaemia", color: "bg-violet-100 text-violet-700" },
  { value: "general", label: "General Health", color: "bg-slate-100 text-slate-600" },
];

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [conditions, setConditions] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const data = await base44.entities.SupportGroup.list("-created_date", 50);
    setGroups(data);
    setLoading(false);
  };

  const toggleCondition = (c) => {
    setConditions((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    await base44.entities.SupportGroup.create({
      name,
      description,
      condition_focus: conditions,
      member_emails: user.email,
      member_count: 1,
    });
    setName(""); setDescription(""); setConditions([]);
    setShowForm(false);
    await loadData();
    setFormLoading(false);
  };

  const handleJoin = async (group) => {
    // M2 fix: membership mutations go through the server function (SupportGroup update
    // RLS is creator/admin-only, which made client-side join/leave fail for non-creators).
    await base44.functions.invoke("updateSupportGroupMembership", { group_id: group.id, action: "join" });
    await loadData();
  };

  const handleLeave = async (group) => {
    await base44.functions.invoke("updateSupportGroupMembership", { group_id: group.id, action: "leave" });
    await loadData();
  };

  const isMember = (group) => {
    return group.member_emails?.toLowerCase().includes(user?.email?.toLowerCase()) || group.created_by === user?.email;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Groups</h1>
          <p className="text-sm text-slate-400 mt-1">Join communities and support each other</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 px-5"
        >
          <Plus className="w-4 h-4" /> {showForm ? "Close" : "Create Group"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Create Support Group</h3>
            <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Group Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-11 rounded-xl border-slate-200" placeholder="e.g. Heart Health Warriors" required />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5 rounded-xl border-slate-200 resize-none" rows={3} placeholder="What is this group about?" required />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Condition Focus</Label>
              <div className="flex flex-wrap gap-3">
                {conditionOptions.map((c) => (
                  <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={conditions.includes(c.value)} onCheckedChange={() => toggleCondition(c.value)} />
                    <span className="text-sm text-slate-700">{c.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={!name || !description || !conditions.length || formLoading} className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium">
              {formLoading ? "Creating..." : "Create Group"}
            </Button>
          </form>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No support groups yet. Create the first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => {
            const member = isMember(group);
            return (
              <div key={group.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center border border-teal-100">
                    <Users className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{group.member_count || 0} members</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">{group.name}</h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-3">{group.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {group.condition_focus?.map((c) => {
                    const opt = conditionOptions.find((o) => o.value === c);
                    return (
                      <span key={c} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${opt?.color || "bg-slate-100 text-slate-600"}`}>
                        {opt?.label || c}
                      </span>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  {member ? (
                    <>
                      <Link to={createPageUrl("GroupDetail") + `?id=${group.id}`} className="flex-1">
                        <Button className="w-full h-9 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm">View Group</Button>
                      </Link>
                      <Button variant="outline" onClick={() => handleLeave(group)} className="h-9 rounded-xl text-sm text-red-500 border-red-200 hover:bg-red-50">Leave</Button>
                    </>
                  ) : (
                    <Button onClick={() => handleJoin(group)} className="w-full h-9 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm">
                      Join Group
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}