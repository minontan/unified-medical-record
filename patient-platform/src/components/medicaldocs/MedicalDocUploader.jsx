/**
 * Simplified medical document uploader.
 * On file selection → immediately upload + AI-extract title, facility, date, summary.
 * Supports date format selection and multilingual document translation.
 * User reviews/edits the AI-extracted fields, then saves.
 */
import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { maskIdentifiers } from "@/lib/piiMasking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Upload, Camera, FileText, Image, Loader2, AlertCircle,
  Sparkles, X, CheckCircle2, Pencil, Info, Languages
} from "lucide-react";

const DATE_FORMATS = [
  { label: "DD/MM/YYYY (e.g. 23/12/2025)", value: "dmy" },
  { label: "MM/DD/YYYY (e.g. 12/23/2025)", value: "mdy" },
  { label: "YYYY/MM/DD (e.g. 2025/12/23)", value: "ymd" },
];

function parseDateToISO(rawDate, format) {
  if (!rawDate) return "";
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return rawDate;
  if (/^\d{4}-\d{2}-\d{2}T/.test(rawDate)) return rawDate.slice(0, 10);
  const parts = rawDate.match(/(\d{1,4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,4})/);
  if (!parts) return rawDate;
  let [, a, b, c] = parts;
  let day, month, year;
  if (format === "dmy") { day = a; month = b; year = c; }
  else if (format === "mdy") { month = a; day = b; year = c; }
  else if (format === "ymd") { year = a; month = b; day = c; }
  else { day = a; month = b; year = c; }
  if (year.length === 2) year = `20${year}`;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function MedicalDocUploader({ docType, onSaved, onCancel }) {
  const [file, setFile] = useState(null);
  const [fileUri, setFileUri] = useState(null);
  const [dateFormat, setDateFormat] = useState("dmy");
  const [translateMode, setTranslateMode] = useState(false);

  // AI-extracted + user-editable fields
  const [title, setTitle] = useState("");
  const [facility, setFacility] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState(null);

  const [extracting, setExtracting] = useState(false);
  const [extractingStage, setExtractingStage] = useState("");
  const [extracted, setExtracted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setFile(f);
    setExtracted(false);
    setError(null);
    setDetectedLanguage(null);
    await uploadAndExtract(f);
  };

  const uploadAndExtract = async (f) => {
    setExtracting(true);
    setExtractingStage("Uploading file securely…");
    setError(null);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: f });
      setFileUri(file_uri);

      setExtractingStage("AI reading document…");

      const translateInstruction = translateMode
        ? " The document may be in a non-English language — translate all extracted text to English."
        : " If the document is not in English, translate the extracted fields to English.";

      const extractRes = await base44.functions.invoke("extractLabReport", {
        file_uri,
        prompt: `You are a medical document assistant. Analyse this medical report and extract the following fields. Be concise and accurate.${translateInstruction}

Date format on this document is: ${DATE_FORMATS.find(d => d.value === dateFormat)?.label || "DD/MM/YYYY"} — parse dates accordingly and return them in YYYY-MM-DD format.

Return a JSON object with these fields:
- title: The report title or investigation type (e.g. "Chest X-Ray", "Holter Monitor Report", "MRI Brain", "PAP Smear"). Infer from context if not explicit.
- facility: The hospital, clinic, or radiology centre name. Empty string if not found.
- report_date: The report or examination date in YYYY-MM-DD format. Empty string if not found.
- summary: A concise clinical summary of 2–4 sentences covering the key findings, any abnormalities, and the overall impression/conclusion. Do not include patient name or ID.
- detected_language: The language the document is written in (e.g. "English", "Chinese", "Malay", "Japanese"). Return "English" if it is already in English.`,
        json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            facility: { type: "string" },
            report_date: { type: "string" },
            summary: { type: "string" },
            detected_language: { type: "string" },
          },
        },
      });
      const result = extractRes.data?.extracted;

      if (result) {
        setTitle(result.title || "");
        setFacility(result.facility || "");
        // Apply date format parsing to whatever the AI returns
        const parsedDate = parseDateToISO(result.report_date || "", dateFormat);
        setReportDate(parsedDate);
        setSummary(maskIdentifiers(result.summary || ""));
        if (result.detected_language && result.detected_language !== "English") {
          setDetectedLanguage(result.detected_language);
        }
        setExtracted(true);
      }
    } catch (err) {
      setError("AI extraction failed. Please fill in the fields manually.");
      setExtracted(true);
    } finally {
      setExtracting(false);
      setExtractingStage("");
    }
  };

  const handleSave = async () => {
    if (!file || !title || !reportDate) return;
    setSaving(true);
    setError(null);
    try {
      let uri = fileUri;
      if (!uri) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        uri = file_uri;
        setFileUri(uri);
      }
      const record = await base44.entities.MedicalDocument.create({
        doc_type: docType,
        title,
        facility,
        report_date: reportDate,
        summary,
        file_uri: uri,
        notes,
      });
      onSaved(record);
    } catch (e) {
      setError(e.message || "Save failed.");
    }
    setSaving(false);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileUri(null);
    setTitle("");
    setFacility("");
    setReportDate("");
    setSummary("");
    setNotes("");
    setExtracted(false);
    setDetectedLanguage(null);
    setError(null);
  };

  return (
    <div className="space-y-4">

      {/* Date format selector */}
      <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-600 mb-1.5">Date format on your report</p>
          <div className="flex flex-wrap gap-2">
            {DATE_FORMATS.map((fmt) => (
              <button
                key={fmt.value}
                onClick={() => setDateFormat(fmt.value)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors
                  ${dateFormat === fmt.value
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"}`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Translation toggle */}
      <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl">
        <Languages className="w-4 h-4 text-teal-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-teal-700">Non-English Document</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            AI auto-detects language and translates the summary and fields to English. Enable this if your report is not in English.
          </p>
        </div>
        <button
          onClick={() => setTranslateMode(!translateMode)}
          title="Force translation mode"
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors flex-shrink-0
            ${translateMode ? "bg-teal-100 border-teal-400 text-teal-700" : "bg-white border-slate-200 text-slate-500 hover:border-teal-300"}`}
        >
          <span>Translate</span>
          <div className={`w-6 h-3 rounded-full flex items-center px-0.5 transition-colors ${translateMode ? "bg-teal-500 justify-end" : "bg-slate-300 justify-start"}`}>
            <div className="w-2 h-2 bg-white rounded-full shadow" />
          </div>
        </button>
      </div>

      {/* File drop zone — only show if no file selected */}
      {!file && (
        <>
          <div
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-7 h-7 text-teal-500" />
              <p className="text-sm font-medium text-slate-600">Click to upload PDF or Image</p>
              <p className="text-xs text-slate-400">
                AI will automatically extract the title, date, facility and summary
              </p>
              <p className="text-xs text-slate-300 flex gap-3 mt-1">
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> PDF</span>
                <span className="flex items-center gap-1"><Image className="w-3 h-3" /> JPG / PNG</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-10 rounded-xl gap-2" onClick={() => fileInputRef.current?.click()}>
              <FileText className="w-4 h-4" /> Choose File
            </Button>
            <Button variant="outline" className="flex-1 h-10 rounded-xl gap-2" onClick={() => cameraInputRef.current?.click()}>
              <Camera className="w-4 h-4" /> Take Photo
            </Button>
          </div>
        </>
      )}

      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

      {/* File selected — show status */}
      {file && (
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <FileText className="w-5 h-5 text-teal-600 flex-shrink-0" />
          <span className="text-sm font-medium text-slate-700 flex-1 truncate">{file.name}</span>
          {extracting && (
            <span className="flex items-center gap-1.5 text-xs text-teal-600 font-medium whitespace-nowrap">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {extractingStage || "Processing…"}
            </span>
          )}
          {extracted && !extracting && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5" />
              AI extracted
            </span>
          )}
          {!extracting && (
            <button onClick={handleRemoveFile} className="text-slate-300 hover:text-red-400 transition-colors ml-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Detected non-English language banner */}
      {detectedLanguage && (
        <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl">
          <Languages className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <p className="text-xs text-teal-700">
            <span className="font-semibold">{detectedLanguage} document detected</span> — fields have been translated to English.
          </p>
        </div>
      )}

      {/* Extracted / editable form */}
      {extracted && (
        <>
          <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
            <Pencil className="w-3 h-3" />
            <span>Review and edit the AI-extracted details before saving</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Report Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chest X-Ray, Holter Monitor Report"
                className="h-9 text-sm rounded-xl"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Facility / Centre</label>
              <Input
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                placeholder="e.g. Pantai Radiology"
                className="h-9 text-sm rounded-xl"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Report Date *</label>
              <Input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="h-9 text-sm rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">AI Summary / Impression</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Key findings and impression from the report…"
                rows={3}
                className="w-full text-sm border border-input rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Personal Notes</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any personal notes…"
                className="h-9 text-sm rounded-xl"
              />
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button variant="outline" onClick={onCancel} className="rounded-xl h-9" disabled={saving || extracting}>
          Cancel
        </Button>
        {extracted && (
          <Button
            onClick={handleSave}
            disabled={saving || !file || !title || !reportDate}
            className="rounded-xl h-9 bg-teal-600 hover:bg-teal-700 text-white gap-2"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><CheckCircle2 className="w-4 h-4" /> Save Document</>
            }
          </Button>
        )}
      </div>
    </div>
  );
}