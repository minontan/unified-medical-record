import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Loader2, Search, PenLine } from "lucide-react";

/**
 * Drug name autocomplete backed by the DrugGlossary entity.
 * Falls back gracefully to free-text entry if no glossary entries exist.
 *
 * Props:
 *   value        – controlled string value
 *   onChange     – called with the typed/selected string
 *   onSelect     – called with the full glossary record when a suggestion is picked
 *   placeholder  – input placeholder
 *   className    – extra class for the wrapper
 */
export default function DrugAutocomplete({ value, onChange, onSelect, placeholder = "Search drug name…", className = "" }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const response = await base44.functions.invoke("searchDrugGlossary", { query });
      const results = response.data?.results || [];
      setSuggestions(results);
      setOpen(results.length > 0);
    } catch {
      setSuggestions([]);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 450);
  };

  const handleSelect = (item) => {
    onChange(item.drug_name);
    if (onSelect) onSelect(item);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <Input
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="pl-9 pr-9 h-11 rounded-xl border-slate-200"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500 animate-spin" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={() => handleSelect(item)}
              className="w-full text-left px-4 py-2.5 hover:bg-teal-50 transition-colors border-b border-slate-50 last:border-0"
            >
              <p className="text-sm font-medium text-slate-800 leading-tight truncate">{item.drug_name}</p>
              {(item.generic_name || item.strength || item.route) && (
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {[item.generic_name, item.strength, item.route].filter(Boolean).join(" · ")}
                </p>
              )}
            </button>
          ))}
          <button
            type="button"
            onMouseDown={() => { setOpen(false); setManualMode(true); }}
            className="w-full text-left px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            <PenLine className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">Not listed — enter manually</span>
          </button>
        </div>
      )}

      {!open && value && suggestions.length === 0 && !loading && value.length >= 3 && (
        <p className="text-[11px] text-slate-400 mt-1 px-1 flex items-center gap-1">
          <PenLine className="w-3 h-3" /> Not found in glossary — manual entry saved as-is
        </p>
      )}
    </div>
  );
}