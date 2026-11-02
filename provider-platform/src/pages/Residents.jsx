import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import StatusBadge from "@/components/prescriptions/StatusBadge";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function Residents() {
  const [residents, setResidents] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    base44.entities.Resident.list().then(setResidents);
    base44.entities.Prescription.list("-updated_date", 200).then(setPrescriptions);
  }, []);

  if (residents === null) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const history = {};
  prescriptions.forEach((p) => {
    (history[p.resident_id] = history[p.resident_id] || []).push(p);
  });

  const q = search.toLowerCase();
  const visible = residents.filter(
    (r) => !q || `${r.name} ${r.identifier} ${r.facility || ""}`.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Residents</h2>
        <p className="text-sm text-muted-foreground">Click a resident to view their prescription history.</p>
      </div>
      <Input
        className="h-9 w-full sm:w-80"
        placeholder="Search name, internal number or facility…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="border rounded-lg bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/60 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 w-10"></th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Internal resident number</th>
              <th className="px-3 py-2">Facility</th>
              <th className="px-3 py-2">Ward / Bed</th>
              <th className="px-3 py-2">Prescriptions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const rx = history[r.id] || [];
              const open = openId === r.id;
              return (
                <React.Fragment key={r.id}>
                  <tr
                    className="border-b last:border-0 hover:bg-accent cursor-pointer"
                    onClick={() => setOpenId(open ? null : r.id)}
                  >
                    <td className="px-3 py-2">
                      {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-3 py-2 font-medium">{r.name}</td>
                    <td className="px-3 py-2">{r.identifier}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.facility || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {[r.ward, r.bed].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-3 py-2">{rx.length}</td>
                  </tr>
                  {open && (
                    <tr className="border-b last:border-0 bg-muted/30">
                      <td colSpan={6} className="px-4 py-3">
                        {rx.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No prescriptions yet.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {rx.map((p) => (
                              <li key={p.id} className="flex flex-wrap items-center gap-3 text-xs">
                                <Link
                                  to={`/prescriptions/${p.id}`}
                                  className="font-mono underline-offset-2 hover:underline"
                                >
                                  {p.trace_id}
                                </Link>
                                <StatusBadge status={p.status} />
                                <span className="text-muted-foreground">
                                  {p.prescription_date || "—"} · version {p.version}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && <p className="p-4 text-sm text-muted-foreground">No residents match the search.</p>}
      </div>
    </div>
  );
}