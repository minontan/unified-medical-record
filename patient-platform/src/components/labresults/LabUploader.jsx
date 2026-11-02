import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, Camera, FileText, Image, Loader2, AlertCircle, Info, Languages, BookOpen, Sparkles } from "lucide-react";
import { buildGlossaryMap, applyGlossaryTranslation, outputHasChinese } from "@/lib/chineseLabSeedGlossary";
import {
  detectLanguage,
  buildMultilingualGlossaryMap,
  applyMultilingualGlossary,
  LANG_LABELS,
} from "@/lib/multilingualLabTranslation";
import { sanitiseLabExtraction } from "@/lib/piiMasking";

const DATE_FORMATS = [
  { label: "DD/MM/YYYY (e.g. 23/12/2025)", value: "dmy" },
  { label: "MM/DD/YYYY (e.g. 12/23/2025)", value: "mdy" },
  { label: "YYYY/MM/DD (e.g. 2025/12/23)", value: "ymd" },
];

function parseDateWithFormat(rawDate, format) {
  if (!rawDate) return rawDate;
  if (/^\d{4}-\d{2}-\d{2}T/.test(rawDate)) return rawDate;
  const time = rawDate.match(/(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)/)?.[1] || "07:00";
  const parts = rawDate.match(/(\d{1,4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,4})/);
  if (!parts) return rawDate;
  let [, a, b, c] = parts;
  let day, month, year;
  if (format === "dmy") { day = a; month = b; year = c; }
  else if (format === "mdy") { month = a; day = b; year = c; }
  else if (format === "ymd") { year = a; month = b; day = c; }
  else { day = a; month = b; year = c; }
  if (year.length === 2) year = `20${year}`;
  const timePart = time.match(/(\d{1,2}):(\d{2})/);
  const hh = timePart ? timePart[1].padStart(2, "0") : "07";
  const mm = timePart ? timePart[2] : "00";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${hh}:${mm}:00`;
}

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    lab_name: { type: "string", description: "Laboratory or clinic name only. Do NOT include patient name, national ID, or any personal identifiers." },
    lab_report_id: { type: "string", description: "Lab report or pathlab reference number only. Do NOT include patient national ID, name, or personal identifiers." },
    collected_at: { type: "string", description: "ISO 8601 date-time of sample collection" },
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          test_name: { type: "string" },
          category: { type: "string" },
          numeric_result: { type: "number" },
          text_result: { type: "string" },
          unit: { type: "string" },
          reference_range_low: { type: "number" },
          reference_range_high: { type: "number" },
          reference_range_text: { type: "string" },
          notes: { type: "string" }
        }
      }
    }
  }
};

export default function LabUploader({ onExtracted }) {
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [error, setError] = useState(null);
  const [dateFormat, setDateFormat] = useState("dmy");
  const [chineseMode, setChineseMode] = useState(false);
  const [translationInfo, setTranslationInfo] = useState(null); // { glossaryHits, llmHits, language }
  const [pendingFiles, setPendingFiles] = useState([]); // queued files not yet processed
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Compress image files to WebP for space efficiency, leave PDFs as-is
  const prepareFile = async (file) => {
    if (file.type === "application/pdf") return { file, isPdf: true };
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        // Cap at 2400px on longest side for lab reports (preserves readability)
        const MAX = 2400;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const scale = MAX / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve({ file: new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }), isPdf: false }),
          "image/webp",
          0.88 // quality: 0.88 balances size vs readability for text-heavy lab reports
        );
      };
      img.src = url;
    });
  };

  const processFile = async (file) => {
    try {
      // Step 1: Compress (images → WebP) then upload to private storage
      setLoadingStage("Preparing file…");
      const { file: preparedFile } = await prepareFile(file);

      setLoadingStage("Uploading file securely…");
      // Upload to private storage for long-term secure archival
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: preparedFile });

      // Step 2: Extract via server-gated function (auth + quota enforced server-side)
      setLoadingStage("Extracting lab data…");
      const extractRes = await base44.functions.invoke("extractLabReport", {
        file_uri,
        json_schema: EXTRACTION_SCHEMA,
      });
      const extracted = extractRes.data?.extracted;

      if (extracted.status !== "success" || !extracted.output) {
        throw new Error(extracted.details || "Could not extract data from the file.");
      }

      let output = sanitiseLabExtraction(extracted.output);
      const fixedDate = parseDateWithFormat(output.collected_at, dateFormat);
      output = { ...output, collected_at: fixedDate };

      // Step 3: Translation — Chinese path OR multilingual path
      const isChinese = chineseMode || outputHasChinese(output);
      const allStrings = [output.lab_name, ...(output.results || []).flatMap(r => [r.test_name, r.category])].filter(Boolean);
      const detectedLang = !isChinese ? detectLanguage(allStrings) : null;
      const needsTranslation = isChinese || detectedLang !== null;

      if (needsTranslation) {
        if (isChinese) {
          // ── Chinese translation (existing logic) ──
          setLoadingStage("Translating Chinese terms…");
          let dbEntries = [];
          try { dbEntries = await base44.entities.ChineseLabGlossary.list(); } catch (_) {}

          const glossaryMap = buildGlossaryMap(dbEntries);
          const { translatedResults, unknownTerms } = applyGlossaryTranslation(output.results || [], glossaryMap);
          let llmHits = 0;
          let glossaryHits = (output.results?.length || 0) - unknownTerms.length;
          const uniqueUnknown = [...new Set(unknownTerms.map((t) => t.chinese))];

          if (uniqueUnknown.length > 0) {
            setLoadingStage(`Translating ${uniqueUnknown.length} new term(s) via AI…`);
            const llmRes = await base44.functions.invoke("invokeLlm", {
              prompt: `You are a medical terminology translator. Translate these Chinese lab test terms to their standard English clinical equivalents.
Return a JSON object where each key is the Chinese term and the value is an object with "english" (English name) and "category" (lab panel category like Haematology, Liver Function, etc).
Chinese terms to translate: ${JSON.stringify(uniqueUnknown)}
Return ONLY the JSON object, no explanation.`,
              response_json_schema: {
                type: "object",
                additionalProperties: { type: "object", properties: { english: { type: "string" }, category: { type: "string" } } }
              },
              purpose: "translate_lab_terms",
            });
            const llmResult = llmRes.data?.result;
            if (llmResult && typeof llmResult === "object") {
              const newEntries = Object.entries(llmResult)
                .filter(([, d]) => d?.english)
                .map(([chinese, d]) => ({ chinese_term: chinese, english_term: d.english, category: d.category || "", source: "llm_learned", variant: "both" }));
              if (newEntries.length > 0) {
                try { await base44.entities.ChineseLabGlossary.bulkCreate(newEntries); } catch (_) {}
              }
              const enhancedMap = { ...glossaryMap };
              for (const [chinese, data] of Object.entries(llmResult)) {
                if (data?.english) enhancedMap[chinese.trim()] = { english: data.english, category: data.category };
              }
              const { translatedResults: finalResults } = applyGlossaryTranslation(output.results || [], enhancedMap);
              llmHits = uniqueUnknown.length;
              output = { ...output, results: finalResults };
            } else {
              output = { ...output, results: translatedResults };
            }
          } else {
            output = { ...output, results: translatedResults };
          }
          setTranslationInfo({ glossaryHits, llmHits, language: "Chinese" });

        } else {
          // ── Multilingual translation ──
          const langLabel = LANG_LABELS[detectedLang] || detectedLang;
          setLoadingStage(`Detected ${langLabel} report — loading glossary…`);

          let dbEntries = [];
          try { dbEntries = await base44.entities.MultilingualLabGlossary.filter({ language_code: detectedLang }); } catch (_) {}

          const glossaryMap = buildMultilingualGlossaryMap(dbEntries);
          const { translatedResults, unknownTerms } = applyMultilingualGlossary(output.results || [], glossaryMap, detectedLang);
          let llmHits = 0;
          let glossaryHits = (output.results?.length || 0) - unknownTerms.length;
          const uniqueUnknown = [...new Set(unknownTerms.map((t) => t.term))];

          if (uniqueUnknown.length > 0) {
            setLoadingStage(`Translating ${uniqueUnknown.length} new term(s) via AI…`);
            const llmRes = await base44.functions.invoke("invokeLlm", {
              prompt: `You are a medical terminology translator. Translate these ${langLabel} lab test terms into their standard English clinical equivalents.
Return a JSON object where each key is the original term and the value is an object with "english" (English name) and "category" (lab panel category such as Haematology, Liver Function, Renal Function, Lipid Profile, Biochemistry, Thyroid, Immunology, Urinalysis, etc).
Terms to translate: ${JSON.stringify(uniqueUnknown)}
Return ONLY the JSON object, no explanation.`,
              response_json_schema: {
                type: "object",
                additionalProperties: { type: "object", properties: { english: { type: "string" }, category: { type: "string" } } }
              },
              purpose: "translate_lab_terms",
            });
            const llmResult = llmRes.data?.result;

            if (llmResult && typeof llmResult === "object") {
              const newEntries = Object.entries(llmResult)
                .filter(([, d]) => d?.english)
                .map(([term, d]) => ({ source_term: term, english_term: d.english, language_code: detectedLang, category: d.category || "", source: "llm_learned" }));
              if (newEntries.length > 0) {
                try { await base44.entities.MultilingualLabGlossary.bulkCreate(newEntries); } catch (_) {}
              }
              // Rebuild map with new LLM entries and retranslate
              const enhancedDbEntries = [...dbEntries, ...newEntries.map(e => ({ ...e, source_term: e.source_term, english_term: e.english_term }))];
              const enhancedMap = buildMultilingualGlossaryMap(enhancedDbEntries);
              const { translatedResults: finalResults } = applyMultilingualGlossary(output.results || [], enhancedMap, detectedLang);
              llmHits = uniqueUnknown.length;
              output = { ...output, results: finalResults };
            } else {
              output = { ...output, results: translatedResults };
            }
          } else {
            output = { ...output, results: translatedResults };
          }
          setTranslationInfo({ glossaryHits, llmHits, language: langLabel });
        }
      }

      return { output, file_uri };
    } catch (e) {
      throw new Error(e.message || "An error occurred during extraction.");
    }
  };

  const processFiles = async (files) => {
    setLoading(true);
    setError(null);
    setTranslationInfo(null);
    setPendingFiles([]);

    try {
      // Process each file and collect results
      let mergedResults = [];
      const fileUris = [];
      let sharedMeta = {};

      for (let i = 0; i < files.length; i++) {
        setLoadingStage(`Processing file ${i + 1} of ${files.length}…`);
        const { output, file_uri } = await processFile(files[i]);
        fileUris.push(file_uri);

        // Use metadata from the first file
        if (i === 0) {
          sharedMeta = {
            lab_name: output.lab_name,
            lab_report_id: output.lab_report_id,
            collected_at: output.collected_at,
          };
        }

        mergedResults = mergedResults.concat(output.results || []);
      }

      onExtracted({
        ...sharedMeta,
        results: mergedResults,
        source_file_url: fileUris[0],       // backward compat
        source_file_urls: fileUris,          // full array
      });
    } catch (e) {
      setError(e.message || "An error occurred during extraction.");
    }

    setLoading(false);
    setLoadingStage("");
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) processFiles(files);
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Date format selector */}
      <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-600 mb-1.5">Date format on your reports</p>
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

      {/* Translation info banner */}
      <div className="flex items-start gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl">
        <Languages className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-teal-700">Auto Language Translation</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Supports Chinese, Japanese, Korean, Thai, Vietnamese, Malay, Indonesian, Khmer &amp; Myanmar reports.
            Language is auto-detected and lab terms are translated to English. A seed glossary is used first to minimise AI credits.
          </p>
        </div>
        <div className="flex-shrink-0">
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border cursor-pointer transition-colors text-[11px] font-medium
              ${chineseMode ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-white border-slate-200 text-slate-500 hover:border-teal-300"}`}
            onClick={() => setChineseMode(!chineseMode)}
            title="Force Chinese mode (use if auto-detection misses Chinese text)"
          >
            <span>中文</span>
            <div className={`w-6 h-3 rounded-full flex items-center px-0.5 transition-colors ${chineseMode ? "bg-amber-500 justify-end" : "bg-slate-300 justify-start"}`}>
              <div className="w-2 h-2 bg-white rounded-full shadow" />
            </div>
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
        onClick={() => !loading && fileInputRef.current?.click()}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600">{loadingStage || "Processing…"}</p>
            <p className="text-xs text-slate-400">This may take a few seconds</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center">
              <Upload className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Upload PDF or Images</p>
              <p className="text-xs text-slate-400 mt-1">Click to browse — select multiple images for a multi-page report</p>
              <p className="text-xs text-teal-600 mt-1 font-medium">
                {chineseMode ? "Chinese mode forced 已启用中文翻译" : "Multi-language auto-detection active"}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> PDF</span>
              <span className="flex items-center gap-1"><Image className="w-3 h-3" /> JPG / PNG</span>
            </div>
          </div>
        )}
      </div>

      {/* Camera option (mobile) */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-11 rounded-xl gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          <FileText className="w-4 h-4" /> Choose File
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-11 rounded-xl gap-2"
          onClick={() => cameraInputRef.current?.click()}
          disabled={loading}
        >
          <Camera className="w-4 h-4" /> Take Photo
        </Button>
      </div>

      {/* Translation result info */}
      {translationInfo && (
        <div className="flex items-start gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl">
          <Languages className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-teal-800 space-y-0.5">
            <p className="font-semibold">
              {translationInfo.language} translation complete
            </p>
            <p className="flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              <span>{translationInfo.glossaryHits} term(s) translated from glossary (no AI credits used)</span>
            </p>
            {translationInfo.llmHits > 0 && (
              <p className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>{translationInfo.llmHits} new term(s) translated via AI and saved to your glossary for next time</span>
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" onChange={handleFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
    </div>
  );
}