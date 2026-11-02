import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { loadGlossary, searchGlossary } from "@/lib/glossary";

export default function DrugNameCombobox({ value, onChange, onSelectEntry, placeholder }) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleType = async (v) => {
    onChange(v);
    if (v.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const entries = await loadGlossary();
    const found = searchGlossary(entries, v, 8);
    setResults(found);
    setOpen(found.length > 0);
  };

  const pick = (entry) => {
    onSelectEntry(entry);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <Input
        className="h-8 text-xs"
        placeholder={placeholder || "Type to search drug glossary…"}
        value={value}
        onChange={(e) => handleType(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-[28rem] max-w-[90vw] max-h-56 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          <p className="px-2 py-1 text-[10px] text-muted-foreground border-b">
            Drug glossary — selecting fills form and route from the master record
          </p>
          {results.map((e, i) => (
            <button
              type="button"
              key={i}
              className="block w-full text-left px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground border-b border-border/40 last:border-b-0"
              onMouseDown={(ev) => {
                ev.preventDefault();
                pick(e);
              }}
            >
              <span className="font-medium">{e.drug_name}</span>
              <span className="text-muted-foreground">
                {" "}
                {e.route} {e.drug_form} {e.strength}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}