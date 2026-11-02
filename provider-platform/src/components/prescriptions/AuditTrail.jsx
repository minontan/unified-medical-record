import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { History } from "lucide-react";
import moment from "moment";

export default function AuditTrail({ traceId }) {
  const [entries, setEntries] = useState(null);
  useEffect(() => {
    let alive = true;
    base44.entities.AuditLog.filter({ trace_id: traceId }, "created_date", 200).then((rows) => {
      if (alive) setEntries(rows);
    });
    return () => {
      alive = false;
    };
  }, [traceId]);

  return (
    <div className="border rounded-lg bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3 font-medium text-sm">
        <History className="h-4 w-4" /> Audit Trail — append-only, tied to trace ID {traceId}
      </div>
      {entries === null ? (
        <p className="p-4 text-sm text-muted-foreground">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">No audit entries.</p>
      ) : (
        <ul className="divide-y">
          {entries.map((e) => (
            <li key={e.id} className="px-4 py-2 text-xs">
              <span className="font-mono text-muted-foreground">{moment(e.created_date).format("DD MMM YYYY, HH:mm")}</span>{" "}
              — <span className="font-medium">{e.action}</span> by {e.actor_name} ({e.actor_role}) —{" "}
              <span className="text-muted-foreground">{e.details}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}