/**
 * Multilingual lab result translation utilities.
 * Supports: Malay (ms), Indonesian (id), Thai (th), Vietnamese (vi),
 *           Khmer (km), Burmese (my), Japanese (ja), Korean (ko)
 *
 * Strategy mirrors the Chinese glossary approach:
 *  1. Detect language from script / known term patterns
 *  2. Apply in-memory glossary (seed + DB-learned) — zero AI credits
 *  3. LLM fallback for unknown terms only → save to DB for future
 */

// ── Script / language detection regexes ──────────────────────────────────────

const SCRIPT_PATTERNS = {
  th: /[\u0E00-\u0E7F]/,        // Thai
  my: /[\u1000-\u109F\uA9E0-\uA9FF\uAA60-\uAA7F]/, // Myanmar
  km: /[\u1780-\u17FF\u19E0-\u19FF]/, // Khmer
  ja: /[\u3040-\u30FF\u31F0-\u31FF\u3200-\u32FF\u4E00-\u9FFF]/, // Hiragana/Katakana/Kanji
  ko: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/, // Hangul
};

// For romanised languages (ms, id, vi) we rely on the LLM prompt hint and the
// absence of other scripts.  We detect them by elimination after checking scripts.

/**
 * Detect dominant language code from a collection of strings.
 * Returns a BCP-47 code or null (= assume English, no translation needed).
 */
export function detectLanguage(strings) {
  const sample = strings.filter(Boolean).join(" ").slice(0, 500);

  for (const [lang, regex] of Object.entries(SCRIPT_PATTERNS)) {
    if (regex.test(sample)) return lang;
  }

  // Vietnamese has distinctive diacritics
  if (/[àáâãèéêìíòóôõùúýăđơưạảấầẩẫậắặ]/i.test(sample)) return "vi";

  return null; // Likely already English or Latin – skip translation
}

// ── Seed glossaries ───────────────────────────────────────────────────────────
// A representative set of the most common lab terms per language.
// Unknown terms are handled by the LLM fallback.

export const MULTILINGUAL_SEED = [
  // ── MALAY (ms) ──
  { source_term: "Hemoglobin", english_term: "Haemoglobin", language_code: "ms", category: "Haematology" },
  { source_term: "Hematokrit", english_term: "Haematocrit", language_code: "ms", category: "Haematology" },
  { source_term: "Kiraan Sel Darah Merah", english_term: "Red Blood Cell Count", language_code: "ms", category: "Haematology" },
  { source_term: "Kiraan Sel Darah Putih", english_term: "White Blood Cell Count", language_code: "ms", category: "Haematology" },
  { source_term: "Platelet", english_term: "Platelet Count", language_code: "ms", category: "Haematology" },
  { source_term: "Kolesterol Jumlah", english_term: "Total Cholesterol", language_code: "ms", category: "Lipid Profile" },
  { source_term: "Kolesterol LDL", english_term: "LDL Cholesterol", language_code: "ms", category: "Lipid Profile" },
  { source_term: "Kolesterol HDL", english_term: "HDL Cholesterol", language_code: "ms", category: "Lipid Profile" },
  { source_term: "Trigliserida", english_term: "Triglycerides", language_code: "ms", category: "Lipid Profile" },
  { source_term: "Glukosa Puasa", english_term: "Fasting Glucose", language_code: "ms", category: "Biochemistry" },
  { source_term: "Gula Darah", english_term: "Blood Glucose", language_code: "ms", category: "Biochemistry" },
  { source_term: "HbA1c", english_term: "HbA1c", language_code: "ms", category: "Biochemistry" },
  { source_term: "Fungsi Hati", english_term: "Liver Function Tests", language_code: "ms", category: "Liver Function" },
  { source_term: "Bilirubin Jumlah", english_term: "Total Bilirubin", language_code: "ms", category: "Liver Function" },
  { source_term: "Albumin", english_term: "Albumin", language_code: "ms", category: "Liver Function" },
  { source_term: "Fungsi Buah Pinggang", english_term: "Renal Function Tests", language_code: "ms", category: "Renal Function" },
  { source_term: "Kreatinin", english_term: "Creatinine", language_code: "ms", category: "Renal Function" },
  { source_term: "Urea", english_term: "Urea", language_code: "ms", category: "Renal Function" },
  { source_term: "Asid Urik", english_term: "Uric Acid", language_code: "ms", category: "Renal Function" },
  { source_term: "Fungsi Tiroid", english_term: "Thyroid Function Tests", language_code: "ms", category: "Thyroid" },
  { source_term: "TSH", english_term: "TSH", language_code: "ms", category: "Thyroid" },
  { source_term: "Protein C-Reaktif", english_term: "C-Reactive Protein (CRP)", language_code: "ms", category: "Immunology" },

  // ── INDONESIAN (id) ──
  { source_term: "Hemoglobin", english_term: "Haemoglobin", language_code: "id", category: "Haematology" },
  { source_term: "Hematokrit", english_term: "Haematocrit", language_code: "id", category: "Haematology" },
  { source_term: "Eritrosit", english_term: "Red Blood Cell Count", language_code: "id", category: "Haematology" },
  { source_term: "Leukosit", english_term: "White Blood Cell Count", language_code: "id", category: "Haematology" },
  { source_term: "Trombosit", english_term: "Platelet Count", language_code: "id", category: "Haematology" },
  { source_term: "Kolesterol Total", english_term: "Total Cholesterol", language_code: "id", category: "Lipid Profile" },
  { source_term: "Kolesterol LDL", english_term: "LDL Cholesterol", language_code: "id", category: "Lipid Profile" },
  { source_term: "Kolesterol HDL", english_term: "HDL Cholesterol", language_code: "id", category: "Lipid Profile" },
  { source_term: "Trigliserida", english_term: "Triglycerides", language_code: "id", category: "Lipid Profile" },
  { source_term: "Glukosa Puasa", english_term: "Fasting Glucose", language_code: "id", category: "Biochemistry" },
  { source_term: "Gula Darah", english_term: "Blood Glucose", language_code: "id", category: "Biochemistry" },
  { source_term: "HbA1c", english_term: "HbA1c", language_code: "id", category: "Biochemistry" },
  { source_term: "Fungsi Hati", english_term: "Liver Function Tests", language_code: "id", category: "Liver Function" },
  { source_term: "Bilirubin Total", english_term: "Total Bilirubin", language_code: "id", category: "Liver Function" },
  { source_term: "Albumin", english_term: "Albumin", language_code: "id", category: "Liver Function" },
  { source_term: "Fungsi Ginjal", english_term: "Renal Function Tests", language_code: "id", category: "Renal Function" },
  { source_term: "Kreatinin", english_term: "Creatinine", language_code: "id", category: "Renal Function" },
  { source_term: "Ureum", english_term: "Urea", language_code: "id", category: "Renal Function" },
  { source_term: "Asam Urat", english_term: "Uric Acid", language_code: "id", category: "Renal Function" },
  { source_term: "Fungsi Tiroid", english_term: "Thyroid Function Tests", language_code: "id", category: "Thyroid" },
  { source_term: "Protein C-Reaktif", english_term: "C-Reactive Protein (CRP)", language_code: "id", category: "Immunology" },

  // ── THAI (th) ──
  { source_term: "ฮีโมโกลบิน", english_term: "Haemoglobin", language_code: "th", category: "Haematology" },
  { source_term: "ฮีมาโตคริต", english_term: "Haematocrit", language_code: "th", category: "Haematology" },
  { source_term: "เม็ดเลือดแดง", english_term: "Red Blood Cell Count", language_code: "th", category: "Haematology" },
  { source_term: "เม็ดเลือดขาว", english_term: "White Blood Cell Count", language_code: "th", category: "Haematology" },
  { source_term: "เกล็ดเลือด", english_term: "Platelet Count", language_code: "th", category: "Haematology" },
  { source_term: "คอเลสเตอรอลรวม", english_term: "Total Cholesterol", language_code: "th", category: "Lipid Profile" },
  { source_term: "แอลดีแอล", english_term: "LDL Cholesterol", language_code: "th", category: "Lipid Profile" },
  { source_term: "เอชดีแอล", english_term: "HDL Cholesterol", language_code: "th", category: "Lipid Profile" },
  { source_term: "ไตรกลีเซอไรด์", english_term: "Triglycerides", language_code: "th", category: "Lipid Profile" },
  { source_term: "น้ำตาลอดอาหาร", english_term: "Fasting Glucose", language_code: "th", category: "Biochemistry" },
  { source_term: "น้ำตาลในเลือด", english_term: "Blood Glucose", language_code: "th", category: "Biochemistry" },
  { source_term: "ฮีโมโกลบิน เอวันซี", english_term: "HbA1c", language_code: "th", category: "Biochemistry" },
  { source_term: "การทำงานของตับ", english_term: "Liver Function Tests", language_code: "th", category: "Liver Function" },
  { source_term: "บิลิรูบินรวม", english_term: "Total Bilirubin", language_code: "th", category: "Liver Function" },
  { source_term: "อัลบูมิน", english_term: "Albumin", language_code: "th", category: "Liver Function" },
  { source_term: "การทำงานของไต", english_term: "Renal Function Tests", language_code: "th", category: "Renal Function" },
  { source_term: "ครีเอตินิน", english_term: "Creatinine", language_code: "th", category: "Renal Function" },
  { source_term: "ยูเรีย", english_term: "Urea", language_code: "th", category: "Renal Function" },
  { source_term: "กรดยูริก", english_term: "Uric Acid", language_code: "th", category: "Renal Function" },
  { source_term: "ไทรอยด์", english_term: "Thyroid Function Tests", language_code: "th", category: "Thyroid" },
  { source_term: "ซีอาร์พี", english_term: "C-Reactive Protein (CRP)", language_code: "th", category: "Immunology" },

  // ── VIETNAMESE (vi) ──
  { source_term: "Huyết sắc tố", english_term: "Haemoglobin", language_code: "vi", category: "Haematology" },
  { source_term: "Hematocrit", english_term: "Haematocrit", language_code: "vi", category: "Haematology" },
  { source_term: "Hồng cầu", english_term: "Red Blood Cell Count", language_code: "vi", category: "Haematology" },
  { source_term: "Bạch cầu", english_term: "White Blood Cell Count", language_code: "vi", category: "Haematology" },
  { source_term: "Tiểu cầu", english_term: "Platelet Count", language_code: "vi", category: "Haematology" },
  { source_term: "Cholesterol toàn phần", english_term: "Total Cholesterol", language_code: "vi", category: "Lipid Profile" },
  { source_term: "LDL Cholesterol", english_term: "LDL Cholesterol", language_code: "vi", category: "Lipid Profile" },
  { source_term: "HDL Cholesterol", english_term: "HDL Cholesterol", language_code: "vi", category: "Lipid Profile" },
  { source_term: "Triglycerid", english_term: "Triglycerides", language_code: "vi", category: "Lipid Profile" },
  { source_term: "Đường huyết lúc đói", english_term: "Fasting Glucose", language_code: "vi", category: "Biochemistry" },
  { source_term: "Đường huyết", english_term: "Blood Glucose", language_code: "vi", category: "Biochemistry" },
  { source_term: "HbA1c", english_term: "HbA1c", language_code: "vi", category: "Biochemistry" },
  { source_term: "Chức năng gan", english_term: "Liver Function Tests", language_code: "vi", category: "Liver Function" },
  { source_term: "Bilirubin toàn phần", english_term: "Total Bilirubin", language_code: "vi", category: "Liver Function" },
  { source_term: "Albumin", english_term: "Albumin", language_code: "vi", category: "Liver Function" },
  { source_term: "Chức năng thận", english_term: "Renal Function Tests", language_code: "vi", category: "Renal Function" },
  { source_term: "Creatinine", english_term: "Creatinine", language_code: "vi", category: "Renal Function" },
  { source_term: "Ure", english_term: "Urea", language_code: "vi", category: "Renal Function" },
  { source_term: "Acid uric", english_term: "Uric Acid", language_code: "vi", category: "Renal Function" },
  { source_term: "Chức năng tuyến giáp", english_term: "Thyroid Function Tests", language_code: "vi", category: "Thyroid" },
  { source_term: "Protein C phản ứng", english_term: "C-Reactive Protein (CRP)", language_code: "vi", category: "Immunology" },

  // ── KHMER (km) ──
  { source_term: "ហេម៉ូក្លូប៊ីន", english_term: "Haemoglobin", language_code: "km", category: "Haematology" },
  { source_term: "កោសិកាឈាមក្រហម", english_term: "Red Blood Cell Count", language_code: "km", category: "Haematology" },
  { source_term: "កោសិកាឈាមស", english_term: "White Blood Cell Count", language_code: "km", category: "Haematology" },
  { source_term: "ប្លាកែត", english_term: "Platelet Count", language_code: "km", category: "Haematology" },
  { source_term: "កូឡេស្តេរ៉ុលសរុប", english_term: "Total Cholesterol", language_code: "km", category: "Lipid Profile" },
  { source_term: "ជាតិស្ករ", english_term: "Blood Glucose", language_code: "km", category: "Biochemistry" },
  { source_term: "មុខងារថ្លើម", english_term: "Liver Function Tests", language_code: "km", category: "Liver Function" },
  { source_term: "ក្រេអាទីនីន", english_term: "Creatinine", language_code: "km", category: "Renal Function" },

  // ── BURMESE (my) ──
  { source_term: "သွေးနီဥဆဲလ်", english_term: "Red Blood Cell Count", language_code: "my", category: "Haematology" },
  { source_term: "သွေးဖြူဥဆဲလ်", english_term: "White Blood Cell Count", language_code: "my", category: "Haematology" },
  { source_term: "သွေးပြား", english_term: "Platelet Count", language_code: "my", category: "Haematology" },
  { source_term: "ဟေမိုဂလိုဘင်", english_term: "Haemoglobin", language_code: "my", category: "Haematology" },
  { source_term: "သကြားဓာတ်", english_term: "Blood Glucose", language_code: "my", category: "Biochemistry" },
  { source_term: "ကိုလက်စထရော", english_term: "Total Cholesterol", language_code: "my", category: "Lipid Profile" },
  { source_term: "အသည်းလုပ်ဆောင်ချက်", english_term: "Liver Function Tests", language_code: "my", category: "Liver Function" },
  { source_term: "ကျောက်ကပ်လုပ်ဆောင်ချက်", english_term: "Renal Function Tests", language_code: "my", category: "Renal Function" },
  { source_term: "ကရီအတင်းနင်း", english_term: "Creatinine", language_code: "my", category: "Renal Function" },

  // ── JAPANESE (ja) ──
  { source_term: "ヘモグロビン", english_term: "Haemoglobin", language_code: "ja", category: "Haematology" },
  { source_term: "赤血球数", english_term: "Red Blood Cell Count", language_code: "ja", category: "Haematology" },
  { source_term: "白血球数", english_term: "White Blood Cell Count", language_code: "ja", category: "Haematology" },
  { source_term: "血小板数", english_term: "Platelet Count", language_code: "ja", category: "Haematology" },
  { source_term: "ヘマトクリット", english_term: "Haematocrit", language_code: "ja", category: "Haematology" },
  { source_term: "好中球", english_term: "Neutrophils", language_code: "ja", category: "Haematology" },
  { source_term: "リンパ球", english_term: "Lymphocytes", language_code: "ja", category: "Haematology" },
  { source_term: "総コレステロール", english_term: "Total Cholesterol", language_code: "ja", category: "Lipid Profile" },
  { source_term: "LDLコレステロール", english_term: "LDL Cholesterol", language_code: "ja", category: "Lipid Profile" },
  { source_term: "HDLコレステロール", english_term: "HDL Cholesterol", language_code: "ja", category: "Lipid Profile" },
  { source_term: "中性脂肪", english_term: "Triglycerides", language_code: "ja", category: "Lipid Profile" },
  { source_term: "空腹時血糖", english_term: "Fasting Glucose", language_code: "ja", category: "Biochemistry" },
  { source_term: "血糖", english_term: "Blood Glucose", language_code: "ja", category: "Biochemistry" },
  { source_term: "ヘモグロビンA1c", english_term: "HbA1c", language_code: "ja", category: "Biochemistry" },
  { source_term: "肝機能検査", english_term: "Liver Function Tests", language_code: "ja", category: "Liver Function" },
  { source_term: "総ビリルビン", english_term: "Total Bilirubin", language_code: "ja", category: "Liver Function" },
  { source_term: "アルブミン", english_term: "Albumin", language_code: "ja", category: "Liver Function" },
  { source_term: "ALT", english_term: "ALT (SGPT)", language_code: "ja", category: "Liver Function" },
  { source_term: "AST", english_term: "AST (SGOT)", language_code: "ja", category: "Liver Function" },
  { source_term: "腎機能検査", english_term: "Renal Function Tests", language_code: "ja", category: "Renal Function" },
  { source_term: "クレアチニン", english_term: "Creatinine", language_code: "ja", category: "Renal Function" },
  { source_term: "尿素窒素", english_term: "Urea", language_code: "ja", category: "Renal Function" },
  { source_term: "尿酸", english_term: "Uric Acid", language_code: "ja", category: "Renal Function" },
  { source_term: "甲状腺機能", english_term: "Thyroid Function Tests", language_code: "ja", category: "Thyroid" },
  { source_term: "TSH", english_term: "TSH", language_code: "ja", category: "Thyroid" },
  { source_term: "CRP", english_term: "C-Reactive Protein (CRP)", language_code: "ja", category: "Immunology" },
  { source_term: "フェリチン", english_term: "Ferritin", language_code: "ja", category: "Biochemistry" },
  { source_term: "ビタミンD", english_term: "Vitamin D (25-OH)", language_code: "ja", category: "Biochemistry" },

  // ── KOREAN (ko) ──
  { source_term: "헤모글로빈", english_term: "Haemoglobin", language_code: "ko", category: "Haematology" },
  { source_term: "적혈구 수", english_term: "Red Blood Cell Count", language_code: "ko", category: "Haematology" },
  { source_term: "백혈구 수", english_term: "White Blood Cell Count", language_code: "ko", category: "Haematology" },
  { source_term: "혈소판 수", english_term: "Platelet Count", language_code: "ko", category: "Haematology" },
  { source_term: "헤마토크리트", english_term: "Haematocrit", language_code: "ko", category: "Haematology" },
  { source_term: "총 콜레스테롤", english_term: "Total Cholesterol", language_code: "ko", category: "Lipid Profile" },
  { source_term: "LDL 콜레스테롤", english_term: "LDL Cholesterol", language_code: "ko", category: "Lipid Profile" },
  { source_term: "HDL 콜레스테롤", english_term: "HDL Cholesterol", language_code: "ko", category: "Lipid Profile" },
  { source_term: "중성지방", english_term: "Triglycerides", language_code: "ko", category: "Lipid Profile" },
  { source_term: "공복 혈당", english_term: "Fasting Glucose", language_code: "ko", category: "Biochemistry" },
  { source_term: "혈당", english_term: "Blood Glucose", language_code: "ko", category: "Biochemistry" },
  { source_term: "당화혈색소", english_term: "HbA1c", language_code: "ko", category: "Biochemistry" },
  { source_term: "간기능 검사", english_term: "Liver Function Tests", language_code: "ko", category: "Liver Function" },
  { source_term: "총 빌리루빈", english_term: "Total Bilirubin", language_code: "ko", category: "Liver Function" },
  { source_term: "알부민", english_term: "Albumin", language_code: "ko", category: "Liver Function" },
  { source_term: "신장기능 검사", english_term: "Renal Function Tests", language_code: "ko", category: "Renal Function" },
  { source_term: "크레아티닌", english_term: "Creatinine", language_code: "ko", category: "Renal Function" },
  { source_term: "요소질소", english_term: "Urea", language_code: "ko", category: "Renal Function" },
  { source_term: "요산", english_term: "Uric Acid", language_code: "ko", category: "Renal Function" },
  { source_term: "갑상선 기능", english_term: "Thyroid Function Tests", language_code: "ko", category: "Thyroid" },
  { source_term: "TSH", english_term: "TSH", language_code: "ko", category: "Thyroid" },
  { source_term: "CRP", english_term: "C-Reactive Protein (CRP)", language_code: "ko", category: "Immunology" },
  { source_term: "페리틴", english_term: "Ferritin", language_code: "ko", category: "Biochemistry" },
  { source_term: "비타민 D", english_term: "Vitamin D (25-OH)", language_code: "ko", category: "Biochemistry" },
];

/** Language code → human-readable label */
export const LANG_LABELS = {
  ms: "Malay",
  id: "Indonesian",
  th: "Thai",
  vi: "Vietnamese",
  km: "Khmer",
  my: "Myanmar",
  ja: "Japanese",
  ko: "Korean",
};

/**
 * Build an in-memory lookup: { langCode => { term => { english, category } } }
 */
export function buildMultilingualGlossaryMap(dbEntries = []) {
  const map = {};

  // Seed first
  for (const entry of MULTILINGUAL_SEED) {
    if (!map[entry.language_code]) map[entry.language_code] = {};
    map[entry.language_code][entry.source_term.trim()] = {
      english: entry.english_term,
      category: entry.category,
    };
  }

  // DB-learned overrides
  for (const entry of dbEntries) {
    if (!entry.source_term || !entry.english_term || !entry.language_code) continue;
    if (!map[entry.language_code]) map[entry.language_code] = {};
    map[entry.language_code][entry.source_term.trim()] = {
      english: entry.english_term,
      category: entry.category || "",
    };
  }

  return map;
}

/**
 * Apply glossary to extracted results for a given language.
 * Returns { translatedResults, unknownTerms }
 */
export function applyMultilingualGlossary(results, glossaryMap, langCode) {
  const langGlossary = glossaryMap[langCode] || {};
  const unknownTerms = [];

  const translatedResults = results.map((r) => {
    const nameKey = r.test_name?.trim();
    const catKey = r.category?.trim();

    let translatedName = r.test_name;
    let translatedCategory = r.category;

    if (nameKey && langGlossary[nameKey]) {
      translatedName = langGlossary[nameKey].english;
    } else if (nameKey && !isLikelyEnglish(nameKey)) {
      unknownTerms.push({ field: "test_name", term: nameKey });
    }

    if (catKey && langGlossary[catKey]) {
      translatedCategory = langGlossary[catKey].english;
    } else if (catKey && !isLikelyEnglish(catKey)) {
      unknownTerms.push({ field: "category", term: catKey });
    }

    return { ...r, test_name: translatedName, category: translatedCategory };
  });

  return { translatedResults, unknownTerms };
}

/**
 * Heuristic: if a string is mostly ASCII letters/digits it's probably already English.
 */
function isLikelyEnglish(text) {
  if (!text) return true;
  const nonAscii = (text.match(/[^\x00-\x7F]/g) || []).length;
  return nonAscii / text.length < 0.2;
}

/**
 * Detect if the extracted output contains non-English (non-ASCII-dominant) text.
 */
export function outputNeedsTranslation(output) {
  const strings = [
    output?.lab_name,
    ...(output?.results || []).flatMap((r) => [r.test_name, r.category]),
  ].filter(Boolean);
  return detectLanguage(strings) !== null;
}