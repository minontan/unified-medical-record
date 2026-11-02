/**
 * Musculoskeletal Risk Engine
 * Pure algorithmic implementation — no LLM.
 * Based on:
 *   - WHO/IOF 2024-2025 BMD/Osteoporosis guidelines
 *   - AWGS 2025 Sarcopenia consensus
 *   - WHO ICOPE 2.0 Frailty framework
 *   - USPSTF 2025
 */

// ─── BMD / OSTEOPOROSIS ───────────────────────────────────────────────────────

export function assessBMD(data) {
  const insights = [];
  const { bmd_tscore, bmd_zscore, fragility_fracture, age, sex, prior_fracture_sites = [], secondary_causes = [] } = data;

  if (bmd_tscore == null) return insights;

  // WHO classification
  let category, severity, title, message, action, guideline;

  if (bmd_tscore <= -2.5 && fragility_fracture) {
    category = "Severe Osteoporosis";
    severity = "critical";
    message = `T-score ${bmd_tscore} with confirmed fragility fracture. This is the highest-risk bone category with imminent fracture risk.`;
    action = "Urgent specialist referral. Standard bisphosphonates may be bypassed — discuss osteoanabolic therapy (e.g. teriparatide, abaloparatide, or romosozumab) with your doctor. Sequential antiresorptive therapy to follow.";
    guideline = "IOF 2024 · ASBMR/BHOF Severe Osteoporosis Task Force";
  } else if (bmd_tscore <= -2.5) {
    category = "Osteoporosis";
    severity = "high";
    message = `T-score ${bmd_tscore} meets the WHO diagnostic threshold for osteoporosis. Pharmacological therapy is recommended regardless of fracture history.`;
    action = "Initiate pharmacological treatment (antiresorptive or anabolic depending on FRAX score and risk). Begin HiRIT-compliant exercise (2×/week at 80% 1RM). Protein ≥1.2 g/kg/day. Vitamin D target >30 ng/mL.";
    guideline = "WHO/IOF 2024 · 2025 USPSTF";
  } else if (bmd_tscore <= -1.0) {
    category = "Osteopenia (Low Bone Mass)";
    severity = "medium";
    message = `T-score ${bmd_tscore} indicates low bone mass (osteopenia). 10-year fracture probability via FRAX should guide treatment decisions.`;
    action = "Assess 10-year fracture risk with FRAX tool. If high probability, pharmacotherapy is indicated. Lifestyle optimisation: resistance training, calcium 1000–1200 mg/day, vitamin D >30 ng/mL.";
    guideline = "WHO/IOF 2024 Osteopenia Management";
  } else {
    category = "Normal BMD";
    severity = "normal";
    message = `T-score ${bmd_tscore} — bone mineral density within the normal range. Focus on primary prevention and maintenance.`;
    action = "Maintain weight-bearing and resistance exercise. Adequate calcium and vitamin D intake. Repeat DXA in 3–5 years or sooner if risk factors change.";
    guideline = "IOF 2024 Primary Prevention";
  }

  insights.push({
    domain: "bone",
    category,
    severity,
    title: `BMD T-score: ${category}`,
    message,
    action,
    value: `T-score ${bmd_tscore}`,
    guideline,
  });

  // Z-score flag (premenopausal / younger adults)
  if (bmd_zscore != null && bmd_zscore <= -2.0 && age < 50) {
    insights.push({
      domain: "bone",
      category: "Low Bone Mass for Age",
      severity: "high",
      title: "Low Bone Mass for Chronological Age (Z-score)",
      message: `Z-score ${bmd_zscore} is ≤ −2.0, indicating bone density significantly below peers of the same age and sex. In premenopausal women and younger men, secondary causes must be excluded.`,
      action: "Evaluate for secondary osteoporosis: chronic kidney disease, malabsorption (coeliac), hyperthyroidism, glucocorticoid use, hypogonadism. Refer to endocrinologist or metabolic bone specialist.",
      guideline: "IOF 2024 Premenopausal Osteoporosis Position Statement",
    });
  }

  // Fragility fracture at high-risk sites
  const highRiskSites = ["spine", "hip", "pelvis"];
  const hasHighRiskFracture = prior_fracture_sites.some((s) => highRiskSites.includes(s));
  if (hasHighRiskFracture) {
    insights.push({
      domain: "bone",
      category: "Imminent Fracture Risk",
      severity: "critical",
      title: "Recent High-Risk Fragility Fracture — Imminent Risk",
      message: `Fracture at a high-risk site (spine, hip, or pelvis) indicates imminent risk of re-fracture within 2 years. Bisphosphonate monotherapy is insufficient for this risk tier.`,
      action: "Osteoanabolic therapy (teriparatide/abaloparatide/romosozumab) should be initiated first to rapidly build bone, followed by antiresorptive consolidation. Discuss with your specialist urgently.",
      guideline: "IOF 2024 Goal-Directed Therapy · ASBMR Imminent Risk Framework",
    });
  }

  // Secondary causes alert
  if (secondary_causes.length && !secondary_causes.includes("none")) {
    insights.push({
      domain: "bone",
      category: "Secondary Osteoporosis",
      severity: "medium",
      title: "Secondary Causes Identified — Treat Underlying Condition",
      message: `Identified secondary cause(s): ${secondary_causes.filter((s) => s !== "none").join(", ")}. These conditions contribute directly to bone loss and must be managed alongside skeletal therapy.`,
      action: "For CKD: use bone turnover markers (BSAP, TRAP5b) to guide therapy per KDIGO 2023. For glucocorticoid use: prophylactic bisphosphonate or anabolic therapy. For hypogonadism in men: testosterone replacement may be indicated.",
      guideline: "KDIGO 2023 · IOF Secondary Osteoporosis Guidelines",
    });
  }

  return insights;
}

// ─── SARCOPENIA (AWGS 2025) ───────────────────────────────────────────────────

export function assessSarcopenia(data) {
  const insights = [];
  const { age, sex, handgrip_kg, asmi, asm_bmi, chair_stand_time_s, gait_speed_ms, sarc_f_score, weight_kg, height_cm } = data;

  if (!sex || (!handgrip_kg && !asmi && !asm_bmi)) return insights;

  const isMiddleAged = age >= 50 && age < 65;
  const isOlderAdult = age >= 65;
  if (!isMiddleAged && !isOlderAdult) return insights;

  const ageBand = isMiddleAged ? "Middle-Aged (50–64)" : "Older Adult (≥65)";

  // AWGS 2025 cut-offs
  const cutoffs = {
    handgrip: sex === "male"
      ? (isMiddleAged ? 34.0 : 28.0)
      : (isMiddleAged ? 20.0 : 18.0),
    asmi: sex === "male"
      ? (isMiddleAged ? 7.6 : 7.0)
      : (isMiddleAged ? 5.7 : 5.7),
    asmBmi: sex === "male"
      ? (isMiddleAged ? 0.90 : 0.83)
      : (isMiddleAged ? 0.63 : 0.57),
    chairStand: isMiddleAged ? 10.0 : 12.0,
    gaitSpeed: isMiddleAged ? 1.2 : 1.0,
  };

  const lowStrength = handgrip_kg != null && handgrip_kg < cutoffs.handgrip;
  const lowMassAsmi = asmi != null && asmi < cutoffs.asmi;
  const lowMassAsmBmi = asm_bmi != null && asm_bmi < cutoffs.asmBmi;
  const lowMass = lowMassAsmi || lowMassAsmBmi;

  // AWGS 2025: confirmed sarcopenia = low strength + low mass
  const confirmedSarcopenia = lowStrength && lowMass;
  // Possible sarcopenia = low strength only (SARC-F ≥4 or handgrip low)
  const sarc_f_positive = sarc_f_score != null && sarc_f_score >= 4;
  const possibleSarcopenia = (lowStrength || sarc_f_positive) && !confirmedSarcopenia;

  if (confirmedSarcopenia) {
    insights.push({
      domain: "sarcopenia",
      category: "Confirmed Sarcopenia",
      severity: "high",
      title: "Confirmed Sarcopenia (AWGS 2025)",
      message: `Both low muscle strength (grip: ${handgrip_kg} kg, cut-off <${cutoffs.handgrip} kg) and low muscle mass (ASMI: ${asmi ?? "not provided"} kg/m², cut-off <${cutoffs.asmi}) confirmed for a ${ageBand} ${sex}.`,
      action: `Initiate structured resistance training (HiRIT: 2×/week at 80% 1RM — squats, deadlifts, overhead press). Protein target: 1.2–1.5 g/kg/day. Consider leucine (2.5g/serving) and HMB supplementation. Vitamin D >30 ng/mL. Follow-up muscle mass and strength assessment every 3–6 months.`,
      value: `Grip ${handgrip_kg} kg | ASMI ${asmi ?? "—"} kg/m²`,
      guideline: "AWGS 2025 Consensus · GLIS 2024",
    });
  } else if (possibleSarcopenia) {
    insights.push({
      domain: "sarcopenia",
      category: "Possible Sarcopenia",
      severity: "medium",
      title: "Possible Sarcopenia — Muscle Health at Risk",
      message: `Low muscle strength detected (grip: ${handgrip_kg ?? "—"} kg, cut-off <${cutoffs.handgrip} kg) without confirmed low muscle mass. ${sarc_f_positive ? `SARC-F score ${sarc_f_score}/10 (≥4 is positive screen). ` : ""}AWGS 2025 classifies this as Possible Sarcopenia requiring further evaluation.`,
      action: "Arrange formal BIA or DXA measurement of appendicular skeletal muscle mass. Begin progressive resistance exercise and protein optimisation while awaiting confirmation. Reassess in 3 months.",
      value: handgrip_kg ? `Grip ${handgrip_kg} kg` : `SARC-F ${sarc_f_score}/10`,
      guideline: "AWGS 2025 · GLIS 2024 F-A-C-S Algorithm",
    });
  } else if (handgrip_kg != null && !lowStrength) {
    insights.push({
      domain: "sarcopenia",
      category: "Normal Muscle Strength",
      severity: "normal",
      title: "Muscle Strength Within Normal Range",
      message: `Handgrip strength ${handgrip_kg} kg is above the AWGS 2025 cut-off of ${cutoffs.handgrip} kg for ${ageBand} ${sex}s. No sarcopenia detected based on available data.`,
      action: "Continue resistance training and adequate protein intake (≥1.2 g/kg/day) to maintain muscle health. Re-screen annually or if functional decline is noticed.",
      guideline: "AWGS 2025",
    });
  }

  // Gait speed — outcome / performance measure
  if (gait_speed_ms != null) {
    if (gait_speed_ms < cutoffs.gaitSpeed) {
      insights.push({
        domain: "sarcopenia",
        category: "Reduced Physical Performance",
        severity: confirmedSarcopenia ? "high" : "medium",
        title: `Slow Gait Speed — Functional Decline Marker`,
        message: `Gait speed ${gait_speed_ms} m/s is below the AWGS 2025 threshold of ${cutoffs.gaitSpeed} m/s for ${ageBand}. This is a strong predictor of falls, hospitalisation, and mortality.`,
        action: "Gait speed below threshold warrants formal falls risk assessment (ICOPE Step 2). Begin balance training (Tai Chi, dynamic stability exercises 3×/week) alongside resistance training.",
        value: `${gait_speed_ms} m/s`,
        guideline: "AWGS 2025 Outcome Measure · WHO ICOPE 2.0",
      });
    }
  }

  // Chair stand test
  if (chair_stand_time_s != null) {
    if (chair_stand_time_s >= cutoffs.chairStand) {
      insights.push({
        domain: "sarcopenia",
        category: "Impaired Functional Performance",
        severity: "medium",
        title: "5× Chair Stand — Below Threshold",
        message: `5-time chair stand completed in ${chair_stand_time_s}s (threshold: <${cutoffs.chairStand}s for ${ageBand}). Indicates impaired lower limb power and fall risk.`,
        action: "Include sit-to-stand progressions and leg press exercises in your training programme. Refer to physiotherapist if unable to perform the test safely.",
        value: `${chair_stand_time_s}s`,
        guideline: "AWGS 2025 Functional Outcome",
      });
    }
  }

  return insights;
}

// ─── FRAILTY (WHO ICOPE 2.0 + Phenotype model) ───────────────────────────────

export function assessFrailty(data) {
  const insights = [];
  const { age, gait_speed_ms, handgrip_kg, weight_kg, chair_stand_time_s, sarc_f_score, sex } = data;

  if (!age || age < 50) return insights;

  // Fried Frailty Phenotype proxy (5 criteria):
  // 1. Weakness: low handgrip
  // 2. Slowness: low gait speed
  // 3. Exhaustion: not directly captured — use SARC-F item 4 (climbing stairs) as proxy
  // 4. Low physical activity: exercise_sessions_per_week < 2
  // 5. Weight loss: not captured here — flag as missing

  const frailtyMarkers = [];

  const ageBand = age < 65 ? "50–64" : "≥65";
  const gripCutoff = sex === "male" ? (age < 65 ? 34.0 : 28.0) : (age < 65 ? 20.0 : 18.0);
  const gaitCutoff = age < 65 ? 1.2 : 1.0;
  const chairCutoff = age < 65 ? 10.0 : 12.0;

  if (handgrip_kg != null && handgrip_kg < gripCutoff) frailtyMarkers.push("weakness");
  if (gait_speed_ms != null && gait_speed_ms < gaitCutoff) frailtyMarkers.push("slowness");
  if (chair_stand_time_s != null && chair_stand_time_s >= chairCutoff) frailtyMarkers.push("low physical performance");
  if (sarc_f_score != null && sarc_f_score >= 4) frailtyMarkers.push("SARC-F positive");
  if (data.exercise_sessions_per_week != null && data.exercise_sessions_per_week < 2) frailtyMarkers.push("low physical activity");

  let frailtyCategory, severity, message, action;

  if (frailtyMarkers.length === 0 && (handgrip_kg != null || gait_speed_ms != null)) {
    frailtyCategory = "Robust";
    severity = "normal";
    message = "No frailty markers detected based on available functional data. Intrinsic capacity appears well-maintained.";
    action = "Continue preventive strategies: resistance exercise 2–3×/week, protein ≥1.2 g/kg/day, regular cognitive and social engagement. Re-screen every 6 months per WHO ICOPE.";
  } else if (frailtyMarkers.length === 1) {
    frailtyCategory = "Pre-Frail";
    severity = "medium";
    message = `Pre-frailty detected: 1 of 5 Fried criteria positive (${frailtyMarkers.join(", ")}). Intrinsic capacity is declining but intervention at this stage can prevent progression to frailty.`;
    action = "WHO ICOPE Step 2 recommended: in-depth clinical assessment of all 6 IC domains (locomotion, vitality, cognition, vision, hearing, psychological). Multimodal intervention: HiRIT exercise, protein optimisation, vitamin D. Re-assess in 6 months.";
  } else if (frailtyMarkers.length >= 2) {
    frailtyCategory = "Frail";
    severity = "high";
    message = `Frailty confirmed: ${frailtyMarkers.length} markers positive (${frailtyMarkers.join(", ")}). Significant risk of falls, hospitalisation, disability, and mortality. Functional independence is at risk.`;
    action = "Urgent WHO ICOPE Step 2 assessment with clinician. Personalised Care Plan (Step 3) covering exercise, nutrition, cognition, and medication review. Avoid polypharmacy. Consider physiotherapy and occupational therapy referral. Goal-setting for functional independence (e.g. 'lift 10 kg groceries').";
  }

  if (frailtyCategory) {
    insights.push({
      domain: "frailty",
      category: frailtyCategory,
      severity,
      title: `Frailty Status: ${frailtyCategory}`,
      message,
      action,
      value: frailtyMarkers.length > 0 ? `${frailtyMarkers.length}/5 criteria` : "0/5 criteria",
      guideline: "WHO ICOPE 2.0 (2024) · Fried Frailty Phenotype",
    });
  }

  return insights;
}

// ─── NUTRITION & LIFESTYLE ────────────────────────────────────────────────────

export function assessNutritionLifestyle(data) {
  const insights = [];
  const { vitamin_d_ngml, protein_intake_gkgday, exercise_sessions_per_week, weight_kg, height_cm } = data;

  // Vitamin D
  if (vitamin_d_ngml != null) {
    if (vitamin_d_ngml < 20) {
      insights.push({
        domain: "nutrition",
        category: "Vitamin D Deficiency",
        severity: "high",
        title: "Vitamin D Deficiency",
        message: `25(OH)D level ${vitamin_d_ngml} ng/mL — below the deficiency threshold of <20 ng/mL. Vitamin D is essential for calcium absorption, bone mineralisation, and muscle function.`,
        action: "Initiate vitamin D supplementation: 2000–4000 IU/day with dietary fat. Re-check 25(OH)D after 3 months. Target >30 ng/mL. Discuss with your doctor if renal disease is present (may need active vitamin D).`,",
        guideline: "IOF 2024 · Endocrine Society Vitamin D Guidelines",
      });
    } else if (vitamin_d_ngml < 30) {
      insights.push({
        domain: "nutrition",
        category: "Vitamin D Insufficiency",
        severity: "medium",
        title: "Vitamin D Insufficiency",
        message: `25(OH)D ${vitamin_d_ngml} ng/mL — insufficient (20–29 ng/mL). Optimal musculoskeletal function requires >30 ng/mL.`,
        action: "Supplement with 800–2000 IU/day vitamin D3. Increase sun exposure (15–20 min at midday). Re-check in 3 months.",
        guideline: "IOF 2024 Vitamin D for Musculoskeletal Health",
      });
    } else {
      insights.push({
        domain: "nutrition",
        category: "Vitamin D Adequate",
        severity: "normal",
        title: "Vitamin D Level Adequate",
        message: `25(OH)D ${vitamin_d_ngml} ng/mL — within optimal range (>30 ng/mL). Supports bone mineralisation and muscle function.`,
        action: "Maintain current supplementation and sun exposure. Annual monitoring recommended.",
        guideline: "IOF 2024",
      });
    }
  }

  // Protein intake
  if (protein_intake_gkgday != null) {
    if (protein_intake_gkgday < 1.0) {
      insights.push({
        domain: "nutrition",
        category: "Inadequate Protein",
        severity: "high",
        title: "Protein Intake Below Minimum Threshold",
        message: `Protein intake ${protein_intake_gkgday} g/kg/day is below the minimum of 1.0 g/kg/day for older adults and the recommended 1.2–1.5 g/kg/day for musculoskeletal health maintenance.`,
        action: "Increase dietary protein to 1.2–1.5 g/kg/day. Distribute across 3–4 meals (25–30g/meal) to maximise muscle protein synthesis. Include leucine-rich sources (whey, eggs, legumes). Consider leucine or HMB supplementation in confirmed sarcopenia.",
        guideline: "AWGS 2025 · ESPEN Protein Recommendations",
      });
    } else if (protein_intake_gkgday < 1.2) {
      insights.push({
        domain: "nutrition",
        category: "Suboptimal Protein",
        severity: "medium",
        title: "Protein Intake Below Optimal Target",
        message: `Protein intake ${protein_intake_gkgday} g/kg/day — meets minimum but is below the 1.2–1.5 g/kg/day target for bone and muscle health preservation.`,
        action: "Aim for at least 1.2–1.5 g/kg/day. Each meal should contain 25–30g protein to drive muscle protein synthesis via mTOR signaling.",
        guideline: "AWGS 2025 · PROT-AGE Study Group",
      });
    } else {
      insights.push({
        domain: "nutrition",
        category: "Adequate Protein",
        severity: "normal",
        title: "Protein Intake at Target",
        message: `Protein intake ${protein_intake_gkgday} g/kg/day meets the 1.2–1.5 g/kg/day recommendation for musculoskeletal health in older adults.`,
        action: "Maintain protein distribution across meals. Prioritise plant-based proteins where possible to support gut microbiota and reduce inflammation.",
        guideline: "AWGS 2025 · ESPEN 2024",
      });
    }
  }

  // Exercise
  if (exercise_sessions_per_week != null) {
    if (exercise_sessions_per_week === 0) {
      insights.push({
        domain: "nutrition",
        category: "Sedentary",
        severity: "high",
        title: "No Resistance Exercise Detected",
        message: "No current resistance or weight-bearing exercise reported. This significantly accelerates muscle and bone loss. Walking alone is insufficient to prevent sarcopenia or osteoporosis.",
        action: "Begin a supervised HiRIT programme: 2 sessions/week at 80% 1RM (squats, deadlifts, overhead press). Add 50 jumps/week for bone impact stimulation if no high fracture risk. Consult physiotherapist if new to exercise.",
        guideline: "LIFTMOR Trial 2024 · AWGS 2025 Exercise Standards",
      });
    } else if (exercise_sessions_per_week < 2) {
      insights.push({
        domain: "nutrition",
        category: "Insufficient Exercise",
        severity: "medium",
        title: "Resistance Training Below Recommended Frequency",
        message: `${exercise_sessions_per_week} session(s)/week is below the minimum of 2 sessions/week of high-intensity resistance training required to stimulate osteoblast activity and mTOR muscle protein synthesis.`,
        action: "Increase to 2 resistance training sessions per week at 80% 1RM. Add balance training (Tai Chi) 3×/week for fall risk reduction.",
        guideline: "LIFTMOR Trial 2024 · HiRIT Standard",
      });
    } else {
      insights.push({
        domain: "nutrition",
        category: "Exercise Adequate",
        severity: "normal",
        title: "Exercise Frequency Meeting Minimum Standard",
        message: `${exercise_sessions_per_week} resistance training session(s)/week meets the AWGS 2025 minimum of 2 sessions/week. Ensure intensity is at 80% 1RM for optimal bone and muscle stimulation.`,
        action: "Confirm training intensity (80% 1RM). Include impact training (jumping/landing) if fracture risk permits. Progress to 3 sessions/week if tolerating well.",
        guideline: "LIFTMOR Trial 2024 · AWGS 2025",
      });
    }
  }

  return insights;
}

// ─── OSTEOSARCOPENIA (INTEGRATED RISK) ───────────────────────────────────────

export function assessOsteosarcopenia(data, bmdInsights, sarcopeniaInsights) {
  const insights = [];
  const hasBoneLoss = bmdInsights.some((i) => ["Osteopenia (Low Bone Mass)", "Osteoporosis", "Severe Osteoporosis"].includes(i.category));
  const hasSarcopenia = sarcopeniaInsights.some((i) => i.category === "Confirmed Sarcopenia");

  if (hasBoneLoss && hasSarcopenia) {
    insights.push({
      domain: "osteosarcopenia",
      category: "Osteosarcopenia",
      severity: "critical",
      title: "Osteosarcopenia — Combined Bone and Muscle Deficit",
      message: "Both low bone mineral density and confirmed sarcopenia are present simultaneously. This syndrome (osteosarcopenia) carries a multiplicative risk of falls, fractures, and institutionalisation beyond either condition alone.",
      action: "Requires simultaneous management of both conditions. HiRIT exercise is the only intervention with proven dual benefit on bone AND muscle. Sequential pharmacotherapy for bone (anabolic first, then antiresorptive). Protein 1.5 g/kg/day + leucine. Refer to geriatric medicine or metabolic bone specialist. FRAX calculation mandatory.",
      guideline: "IOF 2024 Osteosarcopenia Framework · AWGS 2025",
    });
  }

  return insights;
}

// ─── MASTER ENGINE ────────────────────────────────────────────────────────────

export function runMusculoskeletalEngine(data) {
  const bmdInsights = assessBMD(data);
  const sarcopeniaInsights = assessSarcopenia(data);
  const frailtyInsights = assessFrailty(data);
  const nutritionInsights = assessNutritionLifestyle(data);
  const osteosarcopeniaInsights = assessOsteosarcopenia(data, bmdInsights, sarcopeniaInsights);

  const allInsights = [
    ...osteosarcopeniaInsights,
    ...bmdInsights,
    ...sarcopeniaInsights,
    ...frailtyInsights,
    ...nutritionInsights,
  ];

  const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4, normal: 5 };
  allInsights.sort((a, b) => (order[a.severity] ?? 5) - (order[b.severity] ?? 5));

  const hasData = !!(data.bmd_tscore != null || data.handgrip_kg != null || data.asmi != null || data.gait_speed_ms != null || data.vitamin_d_ngml != null);

  return { insights: allInsights, has_data: hasData };
}