import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FlaskConical, X } from "lucide-react";
import { format } from "date-fns";

function StatusBadge({ row }) {
  if (row.text_result) {
    const lower = row.text_result.toLowerCase();
    if (lower.includes("nonreactive") || lower.includes("negative") || lower.includes("normal") || lower.includes("immune")) {
      return <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">{row.text_result}</Badge>;
    }
    if (lower.includes("reactive") || lower.includes("positive") || lower.includes("abnormal")) {
      return <Badge className="bg-red-100 text-red-700 text-[10px]">{row.text_result}</Badge>;
    }
    return <Badge className="bg-slate-100 text-slate-600 text-[10px]">{row.text_result}</Badge>;
  }
  if (row.numeric_result == null) return null;
  const val = row.numeric_result;
  const lo = row.reference_range_low;
  const hi = row.reference_range_high;
  if (lo != null && hi != null) {
    if (val < lo) return <Badge className="bg-sky-100 text-sky-700 text-[10px]">Below range</Badge>;
    if (val > hi) return <Badge className="bg-amber-100 text-amber-700 text-[10px]">Above range</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Within range</Badge>;
  }
  return null;
}

export default function LabSearch({ allResults }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allResults.filter((r) =>
      r.test_name?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q) ||
      r.lab_name?.toLowerCase().includes(q)
    );
  }, [query, allResults]);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by test name, category or lab…"
          className="pl-9 pr-9 h-11 rounded-xl text-sm"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results */}
      {!query && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
          <Search className="w-8 h-8 mb-3 text-slate-300" />
          <p className="text-sm font-medium">Search your lab results</p>
          <p className="text-xs mt-1">Type a test name, category (e.g. Lipid Profile) or lab name</p>
        </div>
      )}

      {query && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
          <FlaskConical className="w-8 h-8 mb-3 text-slate-300" />
          <p className="text-sm font-medium">No results found for "{query}"</p>
          <p className="text-xs mt-1">Try a different test name or category</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-slate-400 mb-2">{filtered.length} result{filtered.length !== 1 ? "s" : ""} found</p>
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                <FlaskConical className="w-4 h-4 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{item.test_name}</p>
                <p className="text-[10px] text-slate-400">
                  {item.category && <span>{item.category} · </span>}
                  {item.lab_name || "Unknown Lab"}
                  {item.collected_at && <span> · {format(new Date(item.collected_at), "d MMM yyyy")}</span>}
                </p>
                {item.reference_range_text && (
                  <p className="text-[10px] text-slate-400">Ref: {item.reference_range_text}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-bold text-slate-800">
                  {item.numeric_result != null ? item.numeric_result : item.text_result}
                </span>
                {item.unit && <span className="text-[10px] text-slate-400">{item.unit}</span>}
                <StatusBadge row={item} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}