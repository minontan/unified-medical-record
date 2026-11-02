import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import IntakeSource from "@/components/intake/IntakeSource";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QuarantineResolve from "@/components/quarantine/QuarantineResolve";
import { useRole } from "@/lib/useRole";
import { ShieldAlert } from "lucide-react";
import moment from "moment";

export default function Quarantined() {
  const navigate = useNavigate();
  const { role } = useRole();
  const [docs, setDocs] = useState(null);
  const [active, setActive] = useState(null);

  useEffect(() => {
    base44.entities.IntakeDocument.filter({ status: "quarantined" }, "-created_date", 200).then(setDocs);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Quarantined Documents</h2>
        <p className="text-sm text-muted-foreground">
          Intakes with ambiguous patient identity or boundaries. Verify the patient, then resolve into a draft — or keep
          quarantined.
        </p>
      </div>
      {docs === null ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <p className="border rounded-lg bg-card p-4 text-sm text-muted-foreground">No quarantined documents.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {docs.map((d) => (
            <div key={d.id} className="border rounded-lg bg-card p-4 space-y-3">
              <div className="text-xs text-muted-foreground">
                <p>{moment(d.created_date).format("DD MMM YYYY, HH:mm")} — {d.source_type}</p>
                <p className="font-medium text-foreground mt-1 flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                  {d.remarks || "Ambiguous patient boundary"}
                </p>
              </div>
              {(d.file_url || d.file_uri) && <IntakeSource intake={d} />}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setActive(d)}>
                  Verify & resolve
                </Button>

              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verify patient & resolve quarantine</DialogTitle>
          </DialogHeader>
          {active && (
            <QuarantineResolve
              intake={active}
              role={role}
              onResolved={(p) => {
                setActive(null);
                navigate(`/prescriptions/${p.id}`);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}