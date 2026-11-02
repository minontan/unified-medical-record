// Seed glossary of common Chinese lab terms → English
// Covers both Simplified (SC) and Traditional (TC) variants
// Source: standard clinical lab terminology

export const SEED_GLOSSARY = [
  // ── Haematology ──
  { chinese_term: "血红蛋白", english_term: "Haemoglobin", category: "Haematology", variant: "simplified" },
  { chinese_term: "血紅蛋白", english_term: "Haemoglobin", category: "Haematology", variant: "traditional" },
  { chinese_term: "红细胞", english_term: "Red Blood Cell Count", category: "Haematology", variant: "simplified" },
  { chinese_term: "紅血球", english_term: "Red Blood Cell Count", category: "Haematology", variant: "traditional" },
  { chinese_term: "白细胞", english_term: "White Blood Cell Count", category: "Haematology", variant: "simplified" },
  { chinese_term: "白血球", english_term: "White Blood Cell Count", category: "Haematology", variant: "traditional" },
  { chinese_term: "血小板", english_term: "Platelet Count", category: "Haematology", variant: "both" },
  { chinese_term: "红细胞压积", english_term: "Haematocrit", category: "Haematology", variant: "simplified" },
  { chinese_term: "血細胞比容", english_term: "Haematocrit", category: "Haematology", variant: "traditional" },
  { chinese_term: "平均红细胞体积", english_term: "Mean Corpuscular Volume", category: "Haematology", variant: "simplified" },
  { chinese_term: "平均血球容積", english_term: "Mean Corpuscular Volume", category: "Haematology", variant: "traditional" },
  { chinese_term: "平均血红蛋白量", english_term: "Mean Corpuscular Haemoglobin", category: "Haematology", variant: "simplified" },
  { chinese_term: "平均血紅蛋白量", english_term: "Mean Corpuscular Haemoglobin", category: "Haematology", variant: "traditional" },
  { chinese_term: "中性粒细胞", english_term: "Neutrophils", category: "Haematology", variant: "simplified" },
  { chinese_term: "嗜中性球", english_term: "Neutrophils", category: "Haematology", variant: "traditional" },
  { chinese_term: "淋巴细胞", english_term: "Lymphocytes", category: "Haematology", variant: "simplified" },
  { chinese_term: "淋巴球", english_term: "Lymphocytes", category: "Haematology", variant: "traditional" },
  { chinese_term: "单核细胞", english_term: "Monocytes", category: "Haematology", variant: "simplified" },
  { chinese_term: "單核球", english_term: "Monocytes", category: "Haematology", variant: "traditional" },
  { chinese_term: "嗜酸性粒细胞", english_term: "Eosinophils", category: "Haematology", variant: "simplified" },
  { chinese_term: "嗜酸性球", english_term: "Eosinophils", category: "Haematology", variant: "traditional" },
  { chinese_term: "嗜碱性粒细胞", english_term: "Basophils", category: "Haematology", variant: "simplified" },
  { chinese_term: "嗜鹼性球", english_term: "Basophils", category: "Haematology", variant: "traditional" },
  { chinese_term: "血常规", english_term: "Full Blood Count", category: "Haematology", variant: "simplified" },
  { chinese_term: "血常規", english_term: "Full Blood Count", category: "Haematology", variant: "traditional" },

  // ── Lipid Profile ──
  { chinese_term: "总胆固醇", english_term: "Total Cholesterol", category: "Lipid Profile", variant: "simplified" },
  { chinese_term: "總膽固醇", english_term: "Total Cholesterol", category: "Lipid Profile", variant: "traditional" },
  { chinese_term: "低密度脂蛋白", english_term: "LDL Cholesterol", category: "Lipid Profile", variant: "both" },
  { chinese_term: "高密度脂蛋白", english_term: "HDL Cholesterol", category: "Lipid Profile", variant: "both" },
  { chinese_term: "甘油三酯", english_term: "Triglycerides", category: "Lipid Profile", variant: "simplified" },
  { chinese_term: "三酸甘油酯", english_term: "Triglycerides", category: "Lipid Profile", variant: "traditional" },
  { chinese_term: "血脂", english_term: "Lipid Profile", category: "Lipid Profile", variant: "both" },

  // ── Glucose / Diabetes ──
  { chinese_term: "空腹血糖", english_term: "Fasting Glucose", category: "Biochemistry", variant: "both" },
  { chinese_term: "血糖", english_term: "Blood Glucose", category: "Biochemistry", variant: "both" },
  { chinese_term: "糖化血红蛋白", english_term: "HbA1c", category: "Biochemistry", variant: "simplified" },
  { chinese_term: "糖化血紅蛋白", english_term: "HbA1c", category: "Biochemistry", variant: "traditional" },
  { chinese_term: "胰岛素", english_term: "Insulin", category: "Biochemistry", variant: "simplified" },
  { chinese_term: "胰島素", english_term: "Insulin", category: "Biochemistry", variant: "traditional" },

  // ── Liver Function ──
  { chinese_term: "肝功能", english_term: "Liver Function Tests", category: "Liver Function", variant: "both" },
  { chinese_term: "谷丙转氨酶", english_term: "ALT (SGPT)", category: "Liver Function", variant: "simplified" },
  { chinese_term: "丙氨酸氨基轉移酶", english_term: "ALT (SGPT)", category: "Liver Function", variant: "traditional" },
  { chinese_term: "谷草转氨酶", english_term: "AST (SGOT)", category: "Liver Function", variant: "simplified" },
  { chinese_term: "天冬氨酸氨基轉移酶", english_term: "AST (SGOT)", category: "Liver Function", variant: "traditional" },
  { chinese_term: "总胆红素", english_term: "Total Bilirubin", category: "Liver Function", variant: "simplified" },
  { chinese_term: "總膽紅素", english_term: "Total Bilirubin", category: "Liver Function", variant: "traditional" },
  { chinese_term: "直接胆红素", english_term: "Direct Bilirubin", category: "Liver Function", variant: "simplified" },
  { chinese_term: "直接膽紅素", english_term: "Direct Bilirubin", category: "Liver Function", variant: "traditional" },
  { chinese_term: "白蛋白", english_term: "Albumin", category: "Liver Function", variant: "both" },
  { chinese_term: "总蛋白", english_term: "Total Protein", category: "Liver Function", variant: "simplified" },
  { chinese_term: "總蛋白", english_term: "Total Protein", category: "Liver Function", variant: "traditional" },
  { chinese_term: "碱性磷酸酶", english_term: "Alkaline Phosphatase", category: "Liver Function", variant: "simplified" },
  { chinese_term: "鹼性磷酸酶", english_term: "Alkaline Phosphatase", category: "Liver Function", variant: "traditional" },
  { chinese_term: "谷氨酰转肽酶", english_term: "GGT (Gamma-GT)", category: "Liver Function", variant: "simplified" },
  { chinese_term: "麩氨酸轉移酶", english_term: "GGT (Gamma-GT)", category: "Liver Function", variant: "traditional" },

  // ── Renal Function ──
  { chinese_term: "肾功能", english_term: "Renal Function Tests", category: "Renal Function", variant: "simplified" },
  { chinese_term: "腎功能", english_term: "Renal Function Tests", category: "Renal Function", variant: "traditional" },
  { chinese_term: "肌酐", english_term: "Creatinine", category: "Renal Function", variant: "simplified" },
  { chinese_term: "肌酸酐", english_term: "Creatinine", category: "Renal Function", variant: "traditional" },
  { chinese_term: "尿素", english_term: "Urea", category: "Renal Function", variant: "both" },
  { chinese_term: "尿酸", english_term: "Uric Acid", category: "Renal Function", variant: "both" },
  { chinese_term: "肾小球滤过率", english_term: "eGFR", category: "Renal Function", variant: "simplified" },
  { chinese_term: "腎絲球過濾率", english_term: "eGFR", category: "Renal Function", variant: "traditional" },
  { chinese_term: "电解质", english_term: "Electrolytes", category: "Renal Function", variant: "simplified" },
  { chinese_term: "電解質", english_term: "Electrolytes", category: "Renal Function", variant: "traditional" },
  { chinese_term: "钠", english_term: "Sodium", category: "Renal Function", variant: "simplified" },
  { chinese_term: "鈉", english_term: "Sodium", category: "Renal Function", variant: "traditional" },
  { chinese_term: "钾", english_term: "Potassium", category: "Renal Function", variant: "simplified" },
  { chinese_term: "鉀", english_term: "Potassium", category: "Renal Function", variant: "traditional" },
  { chinese_term: "氯", english_term: "Chloride", category: "Renal Function", variant: "both" },
  { chinese_term: "碳酸氢盐", english_term: "Bicarbonate", category: "Renal Function", variant: "simplified" },
  { chinese_term: "碳酸氫鹽", english_term: "Bicarbonate", category: "Renal Function", variant: "traditional" },

  // ── Thyroid ──
  { chinese_term: "甲状腺功能", english_term: "Thyroid Function Tests", category: "Thyroid", variant: "simplified" },
  { chinese_term: "甲狀腺功能", english_term: "Thyroid Function Tests", category: "Thyroid", variant: "traditional" },
  { chinese_term: "促甲状腺激素", english_term: "TSH", category: "Thyroid", variant: "simplified" },
  { chinese_term: "促甲狀腺激素", english_term: "TSH", category: "Thyroid", variant: "traditional" },
  { chinese_term: "游离甲状腺素", english_term: "Free T4", category: "Thyroid", variant: "simplified" },
  { chinese_term: "游離甲狀腺素", english_term: "Free T4", category: "Thyroid", variant: "traditional" },
  { chinese_term: "游离三碘甲状腺原氨酸", english_term: "Free T3", category: "Thyroid", variant: "simplified" },
  { chinese_term: "游離三碘甲狀腺原氨酸", english_term: "Free T3", category: "Thyroid", variant: "traditional" },

  // ── Minerals / Vitamins ──
  { chinese_term: "维生素D", english_term: "Vitamin D (25-OH)", category: "Biochemistry", variant: "simplified" },
  { chinese_term: "維生素D", english_term: "Vitamin D (25-OH)", category: "Biochemistry", variant: "traditional" },
  { chinese_term: "维生素B12", english_term: "Vitamin B12", category: "Biochemistry", variant: "simplified" },
  { chinese_term: "維生素B12", english_term: "Vitamin B12", category: "Biochemistry", variant: "traditional" },
  { chinese_term: "铁蛋白", english_term: "Ferritin", category: "Biochemistry", variant: "simplified" },
  { chinese_term: "鐵蛋白", english_term: "Ferritin", category: "Biochemistry", variant: "traditional" },
  { chinese_term: "血清铁", english_term: "Serum Iron", category: "Biochemistry", variant: "simplified" },
  { chinese_term: "血清鐵", english_term: "Serum Iron", category: "Biochemistry", variant: "traditional" },
  { chinese_term: "钙", english_term: "Calcium", category: "Biochemistry", variant: "simplified" },
  { chinese_term: "鈣", english_term: "Calcium", category: "Biochemistry", variant: "traditional" },
  { chinese_term: "磷", english_term: "Phosphate", category: "Biochemistry", variant: "both" },
  { chinese_term: "镁", english_term: "Magnesium", category: "Biochemistry", variant: "simplified" },
  { chinese_term: "鎂", english_term: "Magnesium", category: "Biochemistry", variant: "traditional" },

  // ── Cardiac ──
  { chinese_term: "心肌肌钙蛋白", english_term: "Troponin", category: "Cardiac", variant: "simplified" },
  { chinese_term: "心肌肌鈣蛋白", english_term: "Troponin", category: "Cardiac", variant: "traditional" },
  { chinese_term: "肌酸激酶", english_term: "Creatine Kinase (CK)", category: "Cardiac", variant: "both" },
  { chinese_term: "乳酸脱氢酶", english_term: "Lactate Dehydrogenase (LDH)", category: "Cardiac", variant: "simplified" },
  { chinese_term: "乳酸脫氫酶", english_term: "Lactate Dehydrogenase (LDH)", category: "Cardiac", variant: "traditional" },

  // ── Inflammation / Infection ──
  { chinese_term: "C反应蛋白", english_term: "C-Reactive Protein (CRP)", category: "Immunology", variant: "simplified" },
  { chinese_term: "C反應蛋白", english_term: "C-Reactive Protein (CRP)", category: "Immunology", variant: "traditional" },
  { chinese_term: "红细胞沉降率", english_term: "ESR (Erythrocyte Sedimentation Rate)", category: "Immunology", variant: "simplified" },
  { chinese_term: "紅血球沉降率", english_term: "ESR (Erythrocyte Sedimentation Rate)", category: "Immunology", variant: "traditional" },
  { chinese_term: "降钙素原", english_term: "Procalcitonin (PCT)", category: "Immunology", variant: "simplified" },
  { chinese_term: "降鈣素原", english_term: "Procalcitonin (PCT)", category: "Immunology", variant: "traditional" },

  // ── Urine ──
  { chinese_term: "尿液分析", english_term: "Urinalysis", category: "Urinalysis", variant: "both" },
  { chinese_term: "尿蛋白", english_term: "Urine Protein", category: "Urinalysis", variant: "both" },
  { chinese_term: "尿糖", english_term: "Urine Glucose", category: "Urinalysis", variant: "both" },
  { chinese_term: "尿潜血", english_term: "Urine Blood", category: "Urinalysis", variant: "simplified" },
  { chinese_term: "尿潛血", english_term: "Urine Blood", category: "Urinalysis", variant: "traditional" },
];

/**
 * Build an in-memory lookup map from the seed glossary.
 * Returns { chineseTerm => englishTerm }
 */
export function buildGlossaryMap(dbEntries = []) {
  const map = {};
  // Seed first (lower priority)
  for (const entry of SEED_GLOSSARY) {
    map[entry.chinese_term.trim()] = { english: entry.english_term, category: entry.category };
  }
  // DB entries override (user/LLM-learned, higher priority)
  for (const entry of dbEntries) {
    if (entry.chinese_term && entry.english_term) {
      map[entry.chinese_term.trim()] = { english: entry.english_term, category: entry.category };
    }
  }
  return map;
}

/**
 * Given extracted results and a glossary map, translate any Chinese terms.
 * Returns { translatedResults, unknownTerms }
 */
export function applyGlossaryTranslation(results, glossaryMap) {
  const unknownTerms = [];
  const translatedResults = results.map((r) => {
    const nameKey = r.test_name?.trim();
    const catKey = r.category?.trim();

    let translatedName = r.test_name;
    let translatedCategory = r.category;

    if (nameKey && /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(nameKey)) {
      if (glossaryMap[nameKey]) {
        translatedName = glossaryMap[nameKey].english;
      } else {
        unknownTerms.push({ field: "test_name", chinese: nameKey });
      }
    }
    if (catKey && /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(catKey)) {
      if (glossaryMap[catKey]) {
        translatedCategory = glossaryMap[catKey].english;
      } else {
        unknownTerms.push({ field: "category", chinese: catKey });
      }
    }

    return { ...r, test_name: translatedName, category: translatedCategory };
  });

  return { translatedResults, unknownTerms };
}

/** Detect if a string contains Chinese characters */
export function hasChinese(text) {
  return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(text || "");
}

/** Detect if extracted output contains any Chinese text */
export function outputHasChinese(output) {
  if (!output) return false;
  if (hasChinese(output.lab_name)) return true;
  return (output.results || []).some(
    (r) => hasChinese(r.test_name) || hasChinese(r.category)
  );
}