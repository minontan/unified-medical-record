import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import IntakeSource from "@/components/intake/IntakeSource";
import PrescriptionDocumentPanel from "@/components/prescriptions/PrescriptionDocumentPanel";
import { useToast } from "@/components/ui/use-toast";
import StatusBadge from "@/components/prescriptions/StatusBadge";
import MedicationTable from "@/components/prescriptions/MedicationTable";
import AuditTrail from "@/components/prescriptions/AuditTrail";
import PrintablePrescription from "@/components/prescriptions/PrintablePrescription";
import ReviewPanel from "@/components/prescriptions/ReviewPanel";
import { useRole, useProfile } from "@/lib/useRole";
import { computeItemFlags, logAudit } from "@/lib/audit";
import { DEFAULT_DATE_FORMAT, formatPrescriptionDate } from "@/lib/prescriptionDates";
import { AlertTriangle, ArrowLeft, Ban, Printer, X } from "lucide-react";

const EDITABLE_STATUSES = ["draft", "changes_requested", "in_review"];

export default function PrescriptionDetail() {
  const { id } = useParams();
  const { role } = useRole();
  const profile = useProfile();
  const [prescription, setPrescription] = useState(null);
  const [resident, setResident] = useState(null);
  const [items, setItems] = useState(null);
  const [intake, setIntake] = useState(null);
  const [changeLog, setChangeLog] = useState([]);
  const [showPrint, setShowPrint] = useState(false);
  const [dateFormat, setDateFormat] = useState(DEFAULT_DATE_FORMAT);
  const [error, setError] = useState("");
  const [voidReason, setVoidReason] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const p = await base44.entities.Prescription.get(id);
    setPrescription(p);
    const r = p.resident_id
      ? await base44.entities.Resident.get(p.resident_id).catch(() => null)
      : null;
    setResident(r);
    const its = await base44.entities.PrescriptionItem.filter({ prescription_id: id }, "created_date", 200);
    setItems(its);
    setIntake(p.intake_id ? await base44.entities.IntakeDocument.get(p.intake_id).catch(() => null) : null);
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!showPrint) return undefined;
    const t = setTimeout(() => window.print(), 200);
    const done = () => {
      setShowPrint(false);
      load();
    };
    window.addEventListener("afterprint", done);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", done);
    };
  }, [showPrint]);

  if (!prescription || !items) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const editable = EDITABLE_STATUSES.includes(prescription.status);
  const flagsCount = items.filter((i) => computeItemFlags(i).length > 0).length;

  const updateItem = (i, key, value) => {
    setItems((prev) => {
      const next = [...prev];
      const updated = { ...next[i], [key]: value };
      updated.flags = computeItemFlags(updated);
      next[i] = updated;
      return next;
    });
    if (key !== "flags")
      setChangeLog((prev) => [...prev, `Row ${i + 1} — ${key}: "${items[i][key] ?? ""}" → "${value}"`]);
  };

  const persistItems = async () => {
    await base44.entities.PrescriptionItem.bulkUpdate(
      items.map((i) => ({
        id: i.id,
        drug_code: i.drug_code,
        drug_name: i.drug_name,
        route: i.route,
        dose: i.dose,
        dosage_form: i.dosage_form,
        frequency: i.frequency,
        duration: i.duration,
        quantity: i.quantity,
        uom: i.uom,
        flags: computeItemFlags(i),
      }))
    );
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      await persistItems();
      await saveDraftAudit();
      toast({ title: "Medication rows saved" });
    } finally {
      setSaving(false);
    }
  };

  const saveDraftAudit = async () => {
    if (changeLog.length > 0) {
      const inReview = prescription.status === "in_review";
      await logAudit({
        traceId: prescription.trace_id,
        entityType: "PrescriptionItem",
        entityId: id,
        action: inReview ? "review_invalidated" : "draft_edited",
        details: inReview
          ? `Edited during pharmacist review — fresh review required: ${changeLog.join("; ")}`
          : changeLog.join("; "),
        version: prescription.version,
        role,
      });
    }
    setChangeLog([]);
  };

  const submitForReview = async () => {
    setError("");
    await saveDraft();
    const newVersion = prescription.status === "changes_requested" ? prescription.version + 1 : prescription.version;
    await base44.entities.Prescription.update(id, { status: "in_review", version: newVersion });
    await logAudit({
      traceId: prescription.trace_id,
      entityType: "Prescription",
      entityId: id,
      action: "submitted_for_review",
      details:
        newVersion > prescription.version
          ? `Resubmitted as version ${newVersion} after requested changes`
          : "Submitted for pharmacist review",
      version: newVersion,
      role,
    });
    load();
  };

  const approve = async ({ pharmacist, attestation, override }) => {
    const flagged = items.filter((i) => computeItemFlags(i).length > 0);
    if (flagged.length > 0 && !override) {
      return {
        error: "Cannot approve — resolve all validation flags on the medication rows first, or explicitly override them.",
      };
    }
    if (changeLog.length > 0) {
      await persistItems();
      await logAudit({
        traceId: prescription.trace_id,
        entityType: "PrescriptionItem",
        entityId: id,
        action: "review_edits_applied",
        details: `Pharmacist applied row edits before approving: ${changeLog.join("; ")}`,
        version: prescription.version,
        role,
      });
      setChangeLog([]);
    }
    try {
      await base44.functions.invoke("approvePrescription", {
        prescription_id: id,
        pharmacist_name: pharmacist,
        attestation,
        flagged_count: flagged.length,
      });
    } catch (err) {
      return {
        error:
          (err.response && err.response.data && err.response.data.error) ||
          err.message ||
          "Approval failed — a pharmacist account is required.",
      };
    }
    load();
    return {};
  };

  const requestChanges = async ({ notes }) => {
    await base44.entities.Prescription.update(id, { status: "changes_requested", review_notes: notes });
    await logAudit({
      traceId: prescription.trace_id,
      entityType: "Prescription",
      entityId: id,
      action: "changes_requested",
      details: notes,
      version: prescription.version,
      role,
    });
    load();
  };

  const doPrint = async () => {
    const printCount = (prescription.print_count || 0) + 1;
    await base44.entities.Prescription.update(id, { status: "printed", print_count: printCount });
    await logAudit({
      traceId: prescription.trace_id,
      entityType: "Prescription",
      entityId: id,
      action: "printed",
      details: `Controlled print — copy ${printCount} of pharmacist-approved version ${prescription.version}`,
      version: prescription.version,
      role,
    });
    setPrescription({ ...prescription, status: "printed", print_count: printCount });
    setShowPrint(true);
  };

  const voidPrescription = async () => {
    if (!voidReason.trim()) {
      setError("A reason is required to void a prescription.");
      return;
    }
    setError("");
    await base44.entities.Prescription.update(id, { status: "void", void_reason: voidReason });
    await logAudit({
      traceId: prescription.trace_id,
      entityType: "Prescription",
      entityId: id,
      action: "voided",
      details: voidReason,
      version: prescription.version,
      role,
    });
    load();
  };

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Work Queue
        </Link>
        <StatusBadge status={prescription.status} />
      </div>

      <div className="border rounded-lg bg-card p-4 grid md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Resident</p>
          <p className="font-medium">{resident ? resident.name : "—"}</p>
          <p className="text-xs text-muted-foreground">Internal resident number: {resident ? resident.identifier : ""}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Facility / Ward / Bed</p>
          <p className="font-medium">{prescription.facility || "—"}</p>
          <p className="text-xs text-muted-foreground">{prescription.facility_address || ""}</p>
          <p className="text-xs text-muted-foreground">
            {[prescription.ward, prescription.bed].filter(Boolean).join(" / ")}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Prescription</p>
          <p className="font-medium">{formatPrescriptionDate(prescription.prescription_date, dateFormat)}</p>
          <p className="text-xs text-muted-foreground">PSO {prescription.pso_number || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Trace ID / Version</p>
          <p className="font-mono text-xs font-medium">{prescription.trace_id}</p>
          <p className="text-xs text-muted-foreground">Version {prescription.version}</p>
        </div>
      </div>

      {flagsCount > 0 && prescription.status !== "void" && (
        <div className="flex items-center gap-2 border border-amber-300 bg-amber-50 text-amber-800 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {flagsCount} medication row(s) have unresolved validation issues — these block pharmacist approval and
          finalisation.
        </div>
      )}
      {prescription.status === "changes_requested" && prescription.review_notes && (
        <div className="border border-amber-300 bg-amber-50 text-amber-800 rounded-lg px-4 py-3 text-sm">
          <span className="font-medium">Pharmacist requested changes: </span>
          {prescription.review_notes}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className={intake && (intake.file_url || intake.file_uri) ? "grid lg:grid-cols-2 gap-4 items-start" : ""}>
        {intake && (intake.file_url || intake.file_uri) && (
          <div className="border rounded-lg bg-card p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Source document — verify every field against this image
            </p>
            <IntakeSource intake={intake} />
          </div>
        )}
        <div className="border rounded-lg bg-card p-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            Medication rows {editable ? "— all edits are recorded in the audit trail" : ""}
          </p>
          <MedicationTable items={items} editable={editable} onChange={updateItem} />
          {editable && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveDraft} disabled={changeLog.length === 0 || saving} variant="outline">
                {saving ? "Saving…" : "Save changes"}
              </Button>
              {prescription.status !== "in_review" && (
                <Button onClick={submitForReview}>Submit for pharmacist review</Button>
              )}
            </div>
          )}
        </div>
      </div>

      {prescription.status === "in_review" &&
        (role === "pharmacist" ? (
          <ReviewPanel
            onApprove={approve}
            onRequestChanges={requestChanges}
            prefillName={profile?.name || ""}
            prefillReg={profile?.regNo || ""}
          />
        ) : (
          <p className="text-sm text-muted-foreground border rounded-lg p-4">
            Awaiting pharmacist review — only pharmacist accounts can perform the check.
          </p>
        ))}

      {["approved", "printed", "signed", "transmitted"].includes(prescription.status) && (
        <PrescriptionDocumentPanel key={prescription.id} prescription={prescription} onPrint={doPrint} onUpdated={load} dateFormat={dateFormat} onDateFormatChange={setDateFormat} />
      )}

      {prescription.status === "printed" && (
        <div className="border border-emerald-300 bg-emerald-50 rounded-lg p-4 text-sm text-emerald-900">
          <p className="font-medium">
            Printed — {prescription.print_count} cop{prescription.print_count === 1 ? "y" : "ies"} recorded
          </p>
          <p className="text-xs">
            Hand the printed copy to the doctor for physical review, approval and signature. The doctor's approval takes
            place outside this platform — no further digital steps are required.
          </p>
        </div>
      )}

      {["draft", "in_review", "changes_requested", "approved"].includes(prescription.status) && (
        <div className="border rounded-lg bg-card p-4 space-y-2">
          <h3 className="font-medium text-sm text-destructive flex items-center gap-1">
            <Ban className="h-4 w-4" /> Void prescription
          </h3>
          <Textarea
            rows={2}
            placeholder="Reason for voiding (recorded in the audit trail)…"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
          />
          <Button variant="destructive" onClick={voidPrescription}>
            Void
          </Button>
        </div>
      )}

      <AuditTrail traceId={prescription.trace_id} />

      {showPrint && (
        <div className="fixed inset-0 z-50 bg-black/50 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-end mb-2">
              <Button variant="outline" onClick={() => setShowPrint(false)}>
                <X className="h-4 w-4 mr-1" /> Close
              </Button>
            </div>
            <PrintablePrescription prescription={prescription} resident={resident} items={items} dateFormat={dateFormat} />
          </div>
        </div>
      )}
    </div>
  );
}