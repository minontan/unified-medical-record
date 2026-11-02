import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import StatusBadge from "@/components/prescriptions/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import moment from "moment";

const STATUSES = ["all", "draft", "in_review", "changes_requested", "approved", "printed", "void"];

const STAT_CARDS = [
  ["draft", "Drafts"],
  ["in_review", "In Review"],
  ["approved", "Approved"],
  ["printed", "Printed"],
];

const loadState = () => {
  try {
    return JSON.parse(sessionStorage.getItem("np_queue_state")) || {};
  } catch {
    return {};
  }
};

export default function Home() {
  const initial = loadState();
  const [prescriptions, setPrescriptions] = useState(null);
  const [residents, setResidents] = useState({});
  const [quarantinedCount, setQuarantinedCount] = useState(0);
  const [search, setSearch] = useState(initial.search || "");
  const [statusFilter, setStatusFilter] = useState(initial.statusFilter || "all");
  const [facilityFilter, setFacilityFilter] = useState(initial.facilityFilter || "all");
  const [sort, setSort] = useState(initial.sort || { key: "updated", dir: "desc" });

  useEffect(() => {
    base44.entities.Prescription.list("-updated_date", 200).then(setPrescriptions);
    base44.entities.IntakeDocument.filter({ status: "quarantined" }, "-created_date", 50).then((rows) =>
      setQuarantinedCount(rows.length)
    );
    base44.entities.Resident.list().then((rows) => {
      const map = {};
      (rows || []).forEach((r) => {
        map[r.id] = r;
      });
      setResidents(map);
    });
  }, []);

  useEffect(() => {
    sessionStorage.setItem("np_queue_state", JSON.stringify({ search, statusFilter, facilityFilter, sort }));
  }, [search, statusFilter, facilityFilter, sort]);

  if (prescriptions === null) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const counts = {};
  prescriptions.forEach((p) => {
    counts[p.status] = (counts[p.status] || 0) + 1;
  });

  const facilities = [...new Set(prescriptions.map((p) => p.facility).filter(Boolean))];

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const sortValue = (p) => {
    const r = residents[p.resident_id];
    switch (sort.key) {
      case "resident":
        return (r?.name || "").toLowerCase();
      case "facility":
        return (p.facility || "").toLowerCase();
      case "prescription_date":
        return p.prescription_date || "";
      case "version":
        return p.version || 0;
      case "status":
        return p.status;
      default:
        return p.updated_date || "";
    }
  };

  const filtered = prescriptions.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (facilityFilter !== "all" && p.facility !== facilityFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const r = residents[p.resident_id];
    return [p.trace_id, p.pso_number, r?.name, r?.identifier].some((v) => (v || "").toLowerCase().includes(q));
  });

  const dir = sort.dir === "asc" ? 1 : -1;
  const visible = [...filtered].sort((a, b) => {
    const va = sortValue(a);
    const vb = sortValue(b);
    return va < vb ? -dir : va > vb ? dir : 0;
  });

  const chips = [];
  if (statusFilter !== "all")
    chips.push({ label: `Status: ${statusFilter.replace("_", " ")}`, clear: () => setStatusFilter("all") });
  if (facilityFilter !== "all")
    chips.push({ label: `Facility: ${facilityFilter}`, clear: () => setFacilityFilter("all") });
  if (search) chips.push({ label: `Search: ${search}`, clear: () => setSearch("") });

  const SortTH = ({ k, label }) => (
    <th className="px-3 py-2 cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort(k)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sort.key === k && (sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </span>
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Work Queue</h2>
          <p className="text-sm text-muted-foreground">
            Patient-specific prescriptions — each one is reviewed and finalised independently.
          </p>
        </div>
        <Link to="/intake/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" /> New Intake
          </Button>
        </Link>
      </div>

      {quarantinedCount > 0 && (
        <div className="border border-amber-300 bg-amber-50 rounded-lg p-4 text-sm flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 font-medium text-amber-800">
            <AlertTriangle className="h-4 w-4" /> {quarantinedCount} quarantined document(s) awaiting verification.
          </p>
          <Link to="/quarantined" className="text-amber-900 underline text-xs">
            Review quarantined documents →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAT_CARDS.map(([key, label]) => (
          <div key={key} className="border rounded-lg bg-card p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold">{counts[key] || 0}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          className="h-9 w-full sm:w-72"
          placeholder="Search resident, internal number, trace or PSO…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={facilityFilter} onValueChange={setFacilityFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All facilities</SelectItem>
            {facilities.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1 border rounded-full bg-card px-2.5 py-1 text-xs"
            >
              {chip.label}
              <button
                aria-label={`Clear ${chip.label}`}
                onClick={chip.clear}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="border rounded-lg bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/60 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2">Trace ID</th>
              <SortTH k="resident" label="Resident" />
              <SortTH k="facility" label="Facility" />
              <th className="px-3 py-2">PSO No</th>
              <SortTH k="prescription_date" label="Date" />
              <SortTH k="version" label="Version" />
              <SortTH k="status" label="Status" />
              <SortTH k="updated" label="Updated" />
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => {
              const r = residents[p.resident_id];
              return (
                <tr key={p.id} className="border-b last:border-0 hover:bg-accent">
                  <td className="px-3 py-2 font-mono text-xs">
                    <Link to={`/prescriptions/${p.id}`} className="text-foreground underline-offset-2 hover:underline">
                      {p.trace_id}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link to={`/prescriptions/${p.id}`} className="text-foreground">
                      {r ? `${r.name} (${r.identifier})` : "—"}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{p.facility || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.pso_number || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.prescription_date || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.version}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {moment(p.updated_date).format("DD MMM HH:mm")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No prescriptions match the current filters.</p>
        )}
      </div>
    </div>
  );
}