import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MaskingEditor from "@/components/intake/MaskingEditor";
import SectionPanel from "@/components/intake/SectionPanel";
import { createPrescriptionFromIntake, hashFile, medicationFromExtract } from "@/lib/intake";
import { buildMaskedBlob } from "@/lib/masking";
import { singaporeToday } from "@/lib/prescriptionDates";
import { AlertTriangle, Loader2, ScanLine, ShieldAlert, Upload } from "lucide-react";

const EMPTY_HEADER = {
  pso_number: "",
  resident_name: "",
  identifier: "",
  created_on: "",
  remarks: "",
  facility: "",
  ward: "",
  bed: "",
};

const ACCEPT =
  "image/*,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function ScreenshotIntake({ role, onCreated, onQuarantined }) {
  const [fileUrl, setFileUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [sourceHash, setSourceHash] = useState("");
  const [objectUrl, setObjectUrl] = useState("");
  const [masks, setMasks] = useState([]);
  const [extraction, setExtraction] = useState(null);
  const [sections, setSections] = useState([]);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [quarantineReason, setQuarantineReason] = useState("");

  const isImage = fileType.startsWith("image/");
  const multiPatient = !!extraction && (extraction.multi_patient_detected || sections.length > 1);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setExtraction(null); setSections([]); setActive(0); setMasks([]);
    setFileUrl(""); setSourceHash(""); setSelectedFile(null);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl("");
    if (file.size > 20 * 1024 * 1024) { setError("Choose a file smaller than 20 MB."); return; }
    setFileType(file.type || (file.name.toLowerCase().endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : ""));
    setObjectUrl(URL.createObjectURL(file)); setSelectedFile(file); setFileName(file.name);
  };

  const extract = async () => {
    if (!selectedFile) {
      setError("Choose a document before running extraction.");
      return;
    }
    setError("");
    try {
      let sourceFile = selectedFile;
      if (isImage) {
        setBusy(masks.length ? "Preparing masked copy…" : "Preparing image…");
        const blob = await buildMaskedBlob(objectUrl, masks);
        sourceFile = new File([blob], masks.length ? "redacted-screenshot.png" : "screenshot.png", { type: "image/png" });
      }
      setBusy("Uploading document…");
      setSourceHash(await hashFile(sourceFile));
      const uploaded = await base44.integrations.Core.UploadPrivateFile({ file: sourceFile });
      setFileUrl(uploaded.file_uri);
      setBusy("Running OCR extraction…");
      const res = await base44.functions.invoke("extractIntakeScreenshot", { file_uri: uploaded.file_uri });
      const data = res.data;
      const secs = data.patient_sections || [];
      if (!secs.length) {
        setError("No medication data could be read from this document. Verify the file or quarantine it.");
        return;
      }
      setExtraction(data);
      setSections(
        secs.map((s) => ({
          header: {
            ...EMPTY_HEADER,
            prescription_date: singaporeToday(),
            pso_number: s.pso_number || "",
            created_on: s.created_on || "",
            remarks: s.remarks || "",
            date_of_birth: s.date_of_birth || "",
            gender: s.gender || "",
            drug_allergy: s.drug_allergy || "",
          },
          meds: (s.medications || []).map(medicationFromExtract),
          created: false,
          prescriptionId: null,
        }))
      );
      setActive(0);
    } catch (err) {
      const detail = err.response?.data?.error || err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : (err.message || "Extraction failed. Please select the file and try again."));
    } finally {
      setBusy("");
    }
  };

  const changeHeader = (key, value) =>
    setSections((prev) => prev.map((s, i) => (i === active ? { ...s, header: { ...s.header, [key]: value } } : s)));
  const updateMed = (rowIndex, key, value) =>
    setSections((prev) =>
      prev.map((s, i) =>
        i === active ? { ...s, meds: s.meds.map((m, r) => (r === rowIndex ? { ...m, [key]: value } : m)) } : s
      )
    );
  const removeMed = (rowIndex) =>
    setSections((prev) =>
      prev.map((s, i) => (i === active ? { ...s, meds: s.meds.filter((_, r) => r !== rowIndex) } : s))
    );

  const createDraft = async (index) => {
    const s = sections[index];
    setBusy("Creating draft…");
    setError("");
    try {
      const secData = ((extraction && extraction.patient_sections) || [])[index] || {};
      const { prescription } = await createPrescriptionFromIntake({
        data: {
          source_type: isImage ? "screenshot" : "document",
          file_uri: fileUrl,
          file_type: isImage ? "image/png" : fileType,
          source_hash: sourceHash,
          header: s.header,
          medications: s.meds,
          extracted_data: {
            ...secData,
            section_index: index + 1,
            multi_patient_detected: sections.length > 1,
          },
        },
        role,
      });
      const next = sections.map((sec, i) =>
        i === index ? { ...sec, created: true, prescriptionId: prescription.id } : sec
      );
      setSections(next);
      if (next.length === 1 || next.every((x) => x.created)) {
        onCreated(prescription);
        return;
      }
      const nextIdx = next.findIndex((x) => !x.created);
      if (nextIdx >= 0) setActive(nextIdx);
    } catch (err) {
      setError(err.message);
    }
    setBusy("");
  };

  const quarantine = async () => {
    setBusy("Quarantining…");
    setError("");
    try {
      await createPrescriptionFromIntake({
        data: {
          source_type: isImage ? "screenshot" : "document",
          file_uri: fileUrl,
          file_type: isImage ? "image/png" : fileType,
          source_hash: sourceHash,
          header: sections[active] ? sections[active].header : EMPTY_HEADER,
          medications: [],
          extracted_data: extraction || {},
        },
        role,
        quarantine: true,
        quarantineReason: quarantineReason || "Ambiguous patient boundary",
      });
      onQuarantined();
    } catch (err) {
      setError(err.message);
    }
    setBusy("");
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Label className="text-sm flex items-center gap-1">
            <Upload className="h-4 w-4" /> Infocare document (screenshot, PDF or DOCX)
          </Label>
          <input type="file" accept={ACCEPT} onChange={handleFile} disabled={!!busy} className="text-sm" />
          {selectedFile && !extraction && (
            <Button onClick={extract} size="sm" disabled={!!busy}>
              <ScanLine className="h-4 w-4 mr-1" /> Run OCR extraction{isImage && masks.length > 0 ? " on masked copy" : ""}
            </Button>
          )}
        </div>
        {busy && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {busy}
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">
          Masking is optional. Files stay on this device until you run extraction, then the document is uploaded
          and retained privately. Any masks you draw are applied before upload; without masks, visible personal
          information is also uploaded for OCR processing. Redact sensitive information where appropriate.
          Identity extraction remains disabled. Use an internal resident number, not a national ID, in the form.
          Each patient section becomes its own prescription. Complete the patient ID only in your local Word copy.
        </p>
      </div>

      {selectedFile && isImage && !extraction && objectUrl && (
        <div className="border rounded-lg bg-card p-4">
          <MaskingEditor src={objectUrl} masks={masks} onMasksChange={setMasks} />
        </div>
      )}

      {selectedFile && !extraction && !isImage && (
        <div className="border border-amber-300 bg-amber-50 text-amber-800 rounded-lg p-3 text-xs flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Redaction is optional for PDF/DOCX. If you choose to redact, do so on your device before uploading:
            permanently remove sensitive text and metadata — covering text with a shape is not sufficient.
            Without redaction, the document is uploaded as provided.
          </p>
        </div>
      )}

      {extraction && sections.length > 0 && (
        <>
          {multiPatient && (
            <div className="border border-amber-300 bg-amber-50 text-amber-800 rounded-lg p-4 text-sm flex items-start gap-2">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Multiple patients detected in this document</p>
                <p className="text-xs">
                  Process each section separately: enter that patient&apos;s identity from the source document and
                  create one draft per section. Never merge fields or medication rows across sections.
                </p>
              </div>
            </div>
          )}
          <div className="grid lg:grid-cols-2 gap-4 items-start">
            <div className="border rounded-lg bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Source document — verify against this</p>
              {isImage ? (
                <Image src={objectUrl} fittingType="fit" className="w-full rounded border max-h-[70vh]" />
              ) : fileType === "application/pdf" ? (
                <iframe
                  src={objectUrl}
                  title="Source document"
                  className="w-full h-[70vh] rounded border bg-muted"
                />
              ) : (
                <div className="border rounded p-6 text-center space-y-2">
                  <p className="text-sm font-medium truncate">{fileName}</p>
                  <a href={objectUrl} target="_blank" rel="noreferrer" className="text-sm underline">
                    Open original document in a new tab
                  </a>
                </div>
              )}
            </div>
            <div className="border rounded-lg bg-card p-3 space-y-3">
              {sections.length > 1 && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Patient section</Label>
                  <Select value={String(active)} onValueChange={(v) => setActive(Number(v))}>
                    <SelectTrigger className="w-64 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((s, i) => (
                        <SelectItem key={i} value={String(i)}>
                          Section {i + 1}
                          {s.created ? " — draft created" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <SectionPanel
                section={sections[active]}
                index={active}
                total={sections.length}
                busy={busy}
                onChangeHeader={changeHeader}
                onChangeMed={updateMed}
                onRemoveMed={removeMed}
                onCreate={createDraft}
              />
              <div className="border-t pt-3 space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Quarantine reason (if patient boundaries are ambiguous)
                </Label>
                <Textarea rows={2} value={quarantineReason} onChange={(e) => setQuarantineReason(e.target.value)} />
                <Button variant="outline" onClick={quarantine} disabled={!!busy}>
                  <AlertTriangle className="h-4 w-4 mr-1" /> Quarantine document
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}