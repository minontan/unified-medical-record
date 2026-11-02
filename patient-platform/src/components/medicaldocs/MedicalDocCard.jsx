import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { FileDown, Loader2, Trash2, ChevronDown, ChevronUp } from "lucide-react";

export default function MedicalDocCard({ doc, onDelete, readOnly = false }) {
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleView = async (e) => {
    e.stopPropagation();
    setLoadingUrl(true);
    const res = await base44.functions.invoke("getLabFileSignedUrl", { file_uri: doc.file_uri });
    setLoadingUrl(false);
    if (res.data?.signed_url) window.open(res.data.signed_url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{doc.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {doc.report_date ? format(new Date(doc.report_date), "d MMM yyyy") : "No date"}
            {doc.facility && <span className="ml-2">· {doc.facility}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {doc.file_uri && (
            <button
              onClick={handleView}
              disabled={loadingUrl}
              title="View document"
              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors disabled:opacity-50"
            >
              {loadingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            </button>
          )}
          {!readOnly && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
              className="p-1.5 rounded-lg text-slate-200 hover:text-red-400 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && doc.summary && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Summary / Impression</p>
          <p className="text-xs text-slate-600 leading-relaxed">{doc.summary}</p>
          {doc.notes && (
            <p className="text-xs text-slate-400 mt-2 italic">{doc.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}