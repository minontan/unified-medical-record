import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import moment from "moment";

export default function AuditLogPage() {
  const [entries, setEntries] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    base44.entities.AuditLog.list("-created_date", 300).then(setEntries).catch(() => setEntries([]));
  }, []);

  const visible = (entries || []).filter((e) =>
    !search
      ? true
      : [e.trace_id, e.action, e.actor_name, e.actor_role, e.details].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Audit Log</h2>
        <p className="text-sm text-muted-foreground">
          Append-only record of every upload, edit, review, print, sign, transmit and void action.
        </p>
      </div>
      <Input
        className="h-9 w-full sm:w-80"
        placeholder="Search trace ID, action, actor…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="border rounded-lg bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/60 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Trace ID</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Entity</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Version</th>
              <th className="px-3 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((e) => (
              <tr key={e.id} className="border-b last:border-0 text-xs">
                <td className="px-3 py-2 font-mono whitespace-nowrap text-muted-foreground">
                  {moment(e.created_date).format("DD MMM YYYY, HH:mm")}
                </td>
                <td className="px-3 py-2 font-mono">{e.trace_id}</td>
                <td className="px-3 py-2 font-medium">{e.action}</td>
                <td className="px-3 py-2 text-muted-foreground">{e.entity_type || "—"}</td>
                <td className="px-3 py-2">
                  {e.actor_name} <span className="text-muted-foreground">({e.actor_role})</span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{e.version}</td>
                <td className="px-3 py-2 text-muted-foreground">{e.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries !== null && visible.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No audit entries match the search.</p>
        )}
      </div>
    </div>
  );
}