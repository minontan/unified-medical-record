import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X, CheckCircle2, FlaskConical, TrendingUp, Settings, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import LabUploader from "@/components/labresults/LabUploader";
import LabReviewTable from "@/components/labresults/LabReviewTable";
import LabHistoryList from "@/components/labresults/LabHistoryList";
import LabTestGrouping from "@/components/labresults/LabTestGrouping";
import LabTrendChart from "@/components/labresults/LabTrendChart";
import LabSearch from "@/components/labresults/LabSearch";
import NonLabWarningBanner from "@/components/labresults/NonLabWarningBanner";
import { useTranslation } from "react-i18next";

export default function LabResults() {
  const { t } = useTranslation();
  const TABS = [
    { id: "history", label: t('labResults.history'), icon: FlaskConical },
    { id: "trends", label: t('labResults.trends'), icon: TrendingUp },
    { id: "search", label: t('labResults.search'), icon: Search },
    { id: "grouping", label: "Manage Standards", icon: Settings },
  ];
  const [results, setResults] = useState([]);
  const [standardizedTests, setStandardizedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("history");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    const [data, stdTests] = await Promise.all([
      base44.entities.LabResult.filter({ created_by: user.email }, "-collected_at", 500),
      base44.entities.StandardizedLabTest.filter({ created_by: user.email }, "display_name", 200),
    ]);
    setResults(data);
    setStandardizedTests(stdTests);
    setLoading(false);
  };

  const loadStandardizedTests = async () => {
    const user = await base44.auth.me();
    const stdTests = await base44.entities.StandardizedLabTest.filter({ created_by: user.email }, "display_name", 200);
    setStandardizedTests(stdTests);
  };

  const handleExtracted = (data) => {
    setExtracted(data);
    setShowUpload(false);
  };

  const autoMatch = async (savedRecords) => {
    const user = await base44.auth.me();
    const stdTests = await base44.entities.StandardizedLabTest.filter({ created_by: user.email }, "display_name", 200);
    const updates = {};
    for (const record of savedRecords) {
      for (const std of stdTests) {
        const synonyms = std.synonyms || [];
        if (synonyms.some((s) => s.toLowerCase() === record.test_name.toLowerCase())) {
          if (!synonyms.includes(record.test_name)) {
            if (!updates[std.id]) updates[std.id] = [...synonyms];
            if (!updates[std.id].includes(record.test_name)) updates[std.id].push(record.test_name);
          }
        }
      }
    }
    for (const [id, synonyms] of Object.entries(updates)) {
      await base44.entities.StandardizedLabTest.update(id, { synonyms });
    }
  };

  const handleSave = async () => {
    if (!extracted?.results?.length) return;
    setSaving(true);
    const records = extracted.results.map((r) => ({
      test_name: r.test_name,
      category: r.category,
      numeric_result: r.numeric_result,
      text_result: r.text_result,
      unit: r.unit,
      reference_range_low: r.reference_range_low,
      reference_range_high: r.reference_range_high,
      reference_range_text: r.reference_range_text,
      notes: r.notes,
      collected_at: extracted.collected_at,
      lab_name: extracted.lab_name,
      lab_report_id: extracted.lab_report_id,
      source_file_url: extracted.source_file_url,
      source_file_urls: extracted.source_file_urls || (extracted.source_file_url ? [extracted.source_file_url] : []),
    }));
    await base44.entities.LabResult.bulkCreate(records);
    await autoMatch(records);
    await loadAll();
    setExtracted(null);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDelete = async (id) => {
    await base44.entities.LabResult.delete(id);
    setResults((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRemoveExtractedItem = (idx) => {
    setExtracted((prev) => ({ ...prev, results: prev.results.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('labResults.title')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('labResults.uploadPdfOrImage')}</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Saved successfully
            </span>
          )}
          <Button
            onClick={() => { setShowUpload(!showUpload); setExtracted(null); }}
            className="h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 px-5"
          >
            {showUpload ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Upload Report</>}
          </Button>
        </div>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Upload Blood Test Report</h2>
          <p className="text-xs text-slate-400">
            Supported formats: <strong>PDF</strong>, <strong>JPG</strong>, <strong>PNG</strong>. For best results, ensure the report is clear and well-lit.
          </p>
          <LabUploader onExtracted={handleExtracted} />
        </div>
      )}

      {/* Extracted review panel */}
      {extracted && (
        <div className="bg-white border border-teal-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Review Extracted Results</h2>
              <p className="text-xs text-slate-400 mt-0.5">Check and edit values before saving. You can remove any incorrect entries.</p>
            </div>
            <button onClick={() => setExtracted(null)} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Lab Name</label>
              <Input value={extracted.lab_name || ""} onChange={(e) => setExtracted((p) => ({ ...p, lab_name: e.target.value }))} className="h-9 text-sm rounded-xl" placeholder="e.g. PathLab" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Report ID</label>
              <Input value={extracted.lab_report_id || ""} onChange={(e) => setExtracted((p) => ({ ...p, lab_report_id: e.target.value }))} className="h-9 text-sm rounded-xl" placeholder="e.g. 36514861" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Collection Date</label>
              <Input type="datetime-local" value={extracted.collected_at ? extracted.collected_at.slice(0, 16) : ""} onChange={(e) => setExtracted((p) => ({ ...p, collected_at: e.target.value + ":00" }))} className="h-9 text-sm rounded-xl" />
            </div>
          </div>

          <NonLabWarningBanner results={extracted.results} />

          {extracted.results?.length > 0 ? (
            <LabReviewTable results={extracted.results} onResultsChange={(updated) => setExtracted((p) => ({ ...p, results: updated }))} onRemove={handleRemoveExtractedItem} />
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">No results were extracted. Try a clearer image or a PDF.</p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-400">{extracted.results?.length || 0} test results ready to save</span>
            <Button onClick={handleSave} disabled={saving || !extracted.results?.length} className="h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 px-6">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle2 className="w-4 h-4" /> Save All Results</>}
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-100">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px
                ${activeTab === tab.id
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : (
            <>
              {activeTab === "history" && (
                <LabHistoryList
                  results={results}
                  onDelete={handleDelete}
                  onDateChange={loadAll}
                  onResultsUpdate={(id, newNotes) => {
                    setResults((prev) => prev.map((r) => r.id === id ? { ...r, notes: newNotes } : r));
                  }}
                />
              )}
              {activeTab === "trends" && (
                <LabTrendChart standardizedTests={standardizedTests} allResults={results} />
              )}
              {activeTab === "search" && (
                <LabSearch allResults={results} />
              )}
              {activeTab === "grouping" && (
                <LabTestGrouping
                  allResults={results}
                  standardizedTests={standardizedTests}
                  onStandardizedTestsChange={loadStandardizedTests}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}