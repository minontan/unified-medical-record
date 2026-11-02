export const GLOSSARY_FLAG = "No exact drug glossary match — verify name";

let cache = null;

export async function loadGlossary() {
  if (cache) return cache;
  const mod = await import("@/data/drug-glossary.json");
  const entries = (mod.default || mod).map((e) => ({
    drug_name: e.drug_name || "",
    drug_form: e.drug_form || "",
    strength: e.strength || "",
    route: e.route || "",
    key: normalize(e.drug_name),
  }));
  cache = entries;
  return entries;
}

export function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Ranked glossary search for the type-filter dropdown.
export function searchGlossary(entries, query, limit = 8) {
  const q = normalize(query);
  if (q.length < 2) return [];
  const scored = [];
  for (const e of entries) {
    const name = e.key;
    let score = -1;
    if (name === q) score = 0;
    else if (name.startsWith(q)) score = 1;
    else if (name.includes(q)) score = 2;
    else if (q.length >= 3) {
      // match on any significant word boundary (e.g. "panadol", "clarithro")
      const words = name.split(/[^a-z0-9%+.]+/);
      if (words.some((w) => w.startsWith(q))) score = 3;
      else if (words.some((w) => w.includes(q))) score = 4;
    }
    if (score >= 0) scored.push({ score, len: name.length, e });
  }
  scored.sort((a, b) => a.score - b.score || a.len - b.len);
  return scored.slice(0, limit).map((s) => s.e);
}

// Exact (case-insensitive) name match. Confident only when every matching
// glossary entry agrees on form and route, so nothing ambiguous is auto-filled.
export function matchDrugBest(entries, drugName) {
  const key = normalize(drugName);
  if (!key) return { confident: false, entry: null };
  const matches = entries.filter((e) => e.key === key);
  if (matches.length === 0) return { confident: false, entry: null };
  const forms = [...new Set(matches.map((m) => m.drug_form).filter(Boolean))];
  const routes = [...new Set(matches.map((m) => m.route).filter(Boolean))];
  const confident = forms.length <= 1 && routes.length <= 1;
  return { confident, entry: matches[0], drug_form: forms[0] || "", route: routes[0] || "" };
}