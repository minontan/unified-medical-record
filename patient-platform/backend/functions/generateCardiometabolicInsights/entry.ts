import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [measurements, labResults] = await Promise.all([
    base44.entities.HealthMeasurement.filter({ created_by: user.email }, '-measured_at', 100),
    base44.entities.LabResult.filter({ created_by: user.email }, '-collected_at', 50),
  ]);

  const insights = [];

  // ─── Helper: latest measurement by type ───────────────────────────────────
  const latest = (type) => measurements.find((m) => m.measurement_type === type) || null;
  const average = (type, n = 7) => {
    const vals = measurements.filter((m) => m.measurement_type === type).slice(0, n).map((m) => m.value_primary);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const latestLab = (namePattern) => {
    const re = new RegExp(namePattern, 'i');
    return labResults.find((r) => re.test(r.test_name)) || null;
  };

  // ─── BLOOD PRESSURE ANALYSIS ──────────────────────────────────────────────
  const bpReadings = measurements.filter((m) => m.measurement_type === 'blood_pressure').slice(0, 14);
  const latestBP = bpReadings[0] || null;

  if (latestBP) {
    const sbp = latestBP.value_primary;
    const dbp = latestBP.value_secondary;
    const avgSBP = bpReadings.length >= 3
      ? bpReadings.reduce((a, b) => a + b.value_primary, 0) / bpReadings.length
      : sbp;
    const avgDBP = bpReadings.length >= 3
      ? bpReadings.reduce((a, b) => a + (b.value_secondary || 0), 0) / bpReadings.length
      : dbp;

    // Classification (2024 ESC / 2025 AHA)
    let bpCategory, bpSeverity, bpMessage, bpAction;
    if (sbp > 180 || dbp > 110) {
      bpCategory = 'Severe Hypertension';
      bpSeverity = 'critical';
      bpMessage = `BP ${sbp}/${dbp} mmHg — severe range. Urgent clinical evaluation required.`;
      bpAction = 'Seek urgent medical evaluation. Do not wait for home monitoring confirmation.';
    } else if (sbp >= 140 || dbp >= 90) {
      bpCategory = 'Stage 2 Hypertension';
      bpSeverity = 'high';
      bpMessage = `BP ${sbp}/${dbp} mmHg — Stage 2 hypertension. Dual pharmacotherapy indicated per 2025 AHA guidelines.`;
      bpAction = 'Discuss dual antihypertensive therapy with your doctor. Target <130/80 mmHg.';
    } else if (sbp >= 130 || dbp >= 80) {
      bpCategory = 'Stage 1 Hypertension';
      bpSeverity = 'medium';
      bpMessage = `BP ${sbp}/${dbp} mmHg — Stage 1 hypertension. Treatment indicated if 10-year CVD risk ≥7.5%.`;
      bpAction = 'Discuss cardiovascular risk assessment (PREVENT score) with your doctor. Lifestyle modification essential.';
    } else if (sbp >= 120 || dbp >= 70) {
      bpCategory = 'Elevated Blood Pressure';
      bpSeverity = 'low';
      bpMessage = `BP ${sbp}/${dbp} mmHg — elevated range per 2024 ESC guidelines.`;
      bpAction = 'Lifestyle optimisation: DASH diet, sodium restriction (<2g/day), 150 min moderate exercise/week. Re-check in 3 months.';
    } else {
      bpCategory = 'Normal';
      bpSeverity = 'normal';
      bpMessage = `BP ${sbp}/${dbp} mmHg — within normal range. Keep maintaining healthy lifestyle.`;
      bpAction = 'Continue current lifestyle. Annual monitoring recommended.';
    }

    insights.push({
      domain: 'hypertension',
      category: bpCategory,
      severity: bpSeverity,
      title: `Blood Pressure: ${bpCategory}`,
      message: bpMessage,
      action: bpAction,
      value: `${sbp}/${dbp} mmHg`,
      avg_label: bpReadings.length >= 3 ? `${avgSBP.toFixed(0)}/${avgDBP.toFixed(0)} mmHg avg (${bpReadings.length} readings)` : null,
      guideline: '2025 AHA/ACC · 2024 ESC',
    });

    // Average vs target alert
    if (bpReadings.length >= 5 && avgSBP > 130) {
      insights.push({
        domain: 'hypertension',
        category: 'Titration Alert',
        severity: 'medium',
        title: 'BP Average Exceeds Target',
        message: `Your ${bpReadings.length}-reading average is ${avgSBP.toFixed(0)}/${avgDBP.toFixed(0)} mmHg, above the <130/80 mmHg target.`,
        action: 'If you are on monotherapy, a single-pill combination (SPC) such as Perindopril/Amlodipine may be appropriate. Review with your prescriber.',
        guideline: '2025 AHA/ACC Level 1A',
      });
    }

    // White coat / measurement quality tip
    insights.push({
      domain: 'hypertension',
      category: 'Measurement Tip',
      severity: 'info',
      title: 'Optimise Your BP Readings',
      message: 'Home BP monitoring accuracy requires sitting quietly for 3–5 minutes, back supported, feet flat, no talking.',
      action: 'Consider logging morning and evening readings on 3 consecutive days for a reliable home average. ABPM remains the gold standard for diagnosis.',
      guideline: '2024 ESC HBPM Guidance',
    });
  }

  // ─── BLOOD GLUCOSE / DIABETES ─────────────────────────────────────────────
  const glucoseReadings = measurements.filter((m) => m.measurement_type === 'blood_glucose').slice(0, 14);
  // Also check lab results for fasting glucose if no measurement exists
  // Match blood glucose labs only — require numeric_result > 0 to exclude sentinel values (-1, -99 etc.)
  // Explicitly exclude urinalysis glucose (category URINALYSIS) and other non-blood panels
  const glucoseLab = labResults.find((r) => {
    if (!r.numeric_result || r.numeric_result <= 0) return false;
    if ((r.category || '').toUpperCase().includes('URIN')) return false;
    const name = (r.test_name || '').toUpperCase();
    return /\bGLUCOSE\b/.test(name) || /FASTING.*GLUCOSE|GLUCOSE.*FASTING|BLOOD.*GLUCOSE/.test(name);
  });
  const latestGlucose = glucoseReadings[0] || (glucoseLab ? {
    value_primary: glucoseLab.numeric_result,
    unit: glucoseLab.unit || 'mmol/L',
  } : null);
  const latestHbA1c = latest('hba1c');
  const hba1cLab = latestLab('hba1c|glycated|a1c');
  const rawHba1cValue = latestHbA1c?.value_primary || hba1cLab?.numeric_result || null;
  const hba1cUnit = latestHbA1c?.unit || hba1cLab?.unit || '%';
  // Detect IFCC mmol/mol unit and convert to NGSP % for threshold comparisons
  // Conversion: NGSP% = (IFCC_mmol_mol / 10.929) + 2.15
  const isIfcc = hba1cUnit.toLowerCase().includes('mmol') || (rawHba1cValue != null && rawHba1cValue > 20 && !hba1cUnit.includes('%'));
  const hba1cValue = rawHba1cValue != null && isIfcc
    ? parseFloat(((rawHba1cValue / 10.929) + 2.15).toFixed(1))
    : rawHba1cValue;

  if (latestGlucose) {
    const gval = latestGlucose.value_primary;
    const unit = latestGlucose.unit || 'mmol/L';
    // Detect mg/dL explicitly; treat anything with 'mmol' as mmol/L
    const isMgDlGlucose = unit.toLowerCase().includes('mg');
    const isMMol = !isMgDlGlucose;
    // Normalise to mmol/L for thresholds
    const gNorm = isMMol ? gval : gval / 18.016;

    let gCategory, gSeverity, gMessage, gAction;
    if (gNorm < 3.9) {
      gCategory = 'Hypoglycaemia';
      gSeverity = 'critical';
      gMessage = `Glucose ${gval} ${unit} — below safe range (<70 mg/dL / 3.9 mmol/L).`;
      gAction = 'Treat immediately with 15g fast-acting carbohydrates. Re-check in 15 minutes. Notify your doctor if recurrent.';
    } else if (gNorm >= 10.0) {
      gCategory = 'Hyperglycaemia';
      gSeverity = 'high';
      gMessage = `Glucose ${gval} ${unit} — significantly above target (>180 mg/dL / 10.0 mmol/L).`;
      gAction = 'Review meal composition, medication adherence and sick-day rules (especially if on SGLT2i). Seek medical review.';
    } else if (gNorm >= 7.8) {
      gCategory = 'Above Target';
      gSeverity = 'medium';
      gMessage = `Glucose ${gval} ${unit} — above the 2026 ADA Time-in-Range upper threshold (7.8 mmol/L / 140 mg/dL).`;
      gAction = 'Review carbohydrate intake at the preceding meal. Aim for >70% of readings within 3.9–10.0 mmol/L (Time in Range).';
    } else {
      gCategory = 'In Range';
      gSeverity = 'normal';
      gMessage = `Glucose ${gval} ${unit} — within target range. Good glycaemic control.`;
      gAction = 'Maintain current regimen. Continue logging readings to track Time in Range (TIR).';
    }
    insights.push({
      domain: 'diabetes',
      category: gCategory,
      severity: gSeverity,
      title: `Blood Glucose: ${gCategory}`,
      message: gMessage,
      action: gAction,
      value: `${gval} ${unit}`,
      guideline: '2026 ADA Standards of Care',
    });
  }

  if (hba1cValue != null) {
    const displayValue = isIfcc
      ? `${rawHba1cValue} mmol/mol (${hba1cValue}% NGSP)`
      : `${hba1cValue}%`;
    let hCategory, hSeverity, hMessage, hAction;
    if (hba1cValue <= 7.0) {
      hCategory = 'At Target';
      hSeverity = 'normal';
      hMessage = `HbA1c ${displayValue} — at or below the 2026 ADA primary target of ≤7.0% (≤53 mmol/mol).`;
      hAction = 'Excellent control. Maintain current regimen and review every 3–6 months.';
    } else if (hba1cValue <= 8.0) {
      hCategory = 'Slightly Above Target';
      hSeverity = 'medium';
      hMessage = `HbA1c ${displayValue} — above the general target of ≤7.0% (≤53 mmol/mol). For complex/intermediate health status, ≤8.0% (≤64 mmol/mol) may be acceptable.`;
      hAction = 'Review diet, physical activity and medication. Discuss with your doctor whether an SGLT2i or GLP-1 RA is appropriate for cardiorenal protection.';
    } else {
      hCategory = 'Above Target';
      hSeverity = 'high';
      hMessage = `HbA1c ${displayValue} — significantly above target. Increased risk of microvascular and macrovascular complications.`;
      hAction = 'Urgent medication review. 2026 ADA guidelines recommend considering SGLT2i + GLP-1 RA combination for proven cardiorenal and metabolic benefit independent of HbA1c level.';
    }
    insights.push({
      domain: 'diabetes',
      category: hCategory,
      severity: hSeverity,
      title: `HbA1c: ${hCategory}`,
      message: hMessage,
      action: hAction,
      value: displayValue,
      guideline: '2026 ADA Standards of Care',
    });
  }

  // Glucose average TIR estimate
  if (glucoseReadings.length >= 5) {
    const unit = glucoseReadings[0].unit || 'mmol/L';
    const isMMol = unit.toLowerCase().includes('mmol');
    const inRange = glucoseReadings.filter((r) => {
      const norm = isMMol ? r.value_primary : r.value_primary / 18.0;
      return norm >= 3.9 && norm <= 10.0;
    }).length;
    const tirPct = Math.round((inRange / glucoseReadings.length) * 100);
    insights.push({
      domain: 'diabetes',
      category: 'Time in Range',
      severity: tirPct >= 70 ? 'normal' : tirPct >= 50 ? 'medium' : 'high',
      title: `Estimated Time in Range: ${tirPct}%`,
      message: `${inRange} of your last ${glucoseReadings.length} glucose readings are within the 3.9–10.0 mmol/L (70–180 mg/dL) ADA target range.`,
      action: tirPct >= 70
        ? 'Excellent Time in Range. Maintain current management strategy.'
        : 'Target >70% of readings in range. Review dietary patterns, meal timing, and discuss CGM use with your doctor.',
      guideline: '2026 ADA CGM & TIR Standards',
    });
  }

  // ─── LIPID / CHOLESTEROL ANALYSIS ─────────────────────────────────────────
  const ldlMeasurement = latest('ldl_cholesterol');
  const hdlMeasurement = latest('hdl_cholesterol');
  const trigMeasurement = latest('triglycerides');
  const totalCholMeasurement = latest('total_cholesterol');

  const ldlLab = latestLab('ldl|low.density');
  const hdlLab = latestLab('hdl|high.density');
  const trigLab = latestLab('triglyceride');
  const totalCholLab = latestLab('total.cholesterol|cholesterol.total|chol$|^cholesterol');

  const ldlVal = ldlMeasurement?.value_primary ?? ldlLab?.numeric_result ?? null;
  const hdlVal = hdlMeasurement?.value_primary ?? hdlLab?.numeric_result ?? null;
  const trigVal = trigMeasurement?.value_primary ?? trigLab?.numeric_result ?? null;
  const totalCholVal = totalCholMeasurement?.value_primary ?? totalCholLab?.numeric_result ?? null;
  // Resolve units: prefer measurement unit, fallback to lab unit, then default
  const ldlUnit = ldlMeasurement?.unit || ldlLab?.unit || 'mmol/L';
  const totalCholUnit = totalCholMeasurement?.unit || totalCholLab?.unit || 'mmol/L';

  if (ldlVal != null) {
    const isMgDl = ldlUnit.toLowerCase().includes('mg');
    // Normalise to mmol/L
    const ldlNorm = isMgDl ? ldlVal / 38.67 : ldlVal;

    let ldlCategory, ldlSeverity, ldlMessage, ldlAction;
    if (ldlNorm >= 4.9) {
      ldlCategory = 'Very High LDL';
      ldlSeverity = 'critical';
      ldlMessage = `LDL-C ${ldlVal} ${ldlUnit} — markedly elevated. Familial Hypercholesterolaemia must be excluded.`;
      ldlAction = 'High-intensity statin therapy indicated. Target LDL-C <1.4 mmol/L (55 mg/dL) for very high ASCVD risk. Ezetimibe or PCSK9 inhibitor may be required.';
    } else if (ldlNorm >= 3.4) {
      ldlCategory = 'High LDL';
      ldlSeverity = 'high';
      ldlMessage = `LDL-C ${ldlVal} ${ldlUnit} — above high-risk threshold (3.4 mmol/L / 130 mg/dL).`;
      ldlAction = 'High-intensity statin recommended targeting ≥50% LDL-C reduction. For primary prevention high-risk patients, target <1.8 mmol/L (70 mg/dL).';
    } else if (ldlNorm >= 2.6) {
      ldlCategory = 'Borderline High LDL';
      ldlSeverity = 'medium';
      ldlMessage = `LDL-C ${ldlVal} ${ldlUnit} — borderline range. Consider 10-year PREVENT risk score.`;
      ldlAction = 'Lifestyle intervention first. If risk enhancers present or CAC score >0, statin therapy may be indicated. Target <2.6 mmol/L (100 mg/dL).';
    } else if (ldlNorm >= 1.8) {
      ldlCategory = 'Near Optimal';
      ldlSeverity = 'low';
      ldlMessage = `LDL-C ${ldlVal} ${ldlUnit} — near optimal. Good for most primary prevention patients.`;
      ldlAction = 'Maintain lifestyle modifications. If established ASCVD or very high risk, target is <1.4 mmol/L (55 mg/dL).';
    } else {
      ldlCategory = 'At Target';
      ldlSeverity = 'normal';
      ldlMessage = `LDL-C ${ldlVal} ${ldlUnit} — at or below optimal threshold. Excellent lipid control.`;
      ldlAction = 'Continue current therapy and lifestyle. "Lower for longer" remains the guiding principle.';
    }
    insights.push({
      domain: 'hyperlipidaemia',
      category: ldlCategory,
      severity: ldlSeverity,
      title: `LDL Cholesterol: ${ldlCategory}`,
      message: ldlMessage,
      action: ldlAction,
      value: `${ldlVal} ${ldlUnit}`,
      guideline: '2026 ACC/AHA · 2025 ESC Lipid Guidelines',
    });
  }

  if (hdlVal != null) {
    const isMgDl = (hdlMeasurement?.unit || hdlLab?.unit || 'mmol/L').toLowerCase().includes('mg');
    const hdlNorm = isMgDl ? hdlVal / 38.67 : hdlVal;
    if (hdlNorm < 1.0) {
      insights.push({
        domain: 'hyperlipidaemia',
        category: 'Low HDL',
        severity: 'medium',
        title: 'Low HDL Cholesterol',
        message: `HDL-C ${hdlVal} — below the protective threshold (<1.0 mmol/L / 40 mg/dL). Low HDL is an independent ASCVD risk enhancer.`,
        action: 'Increase aerobic exercise, reduce refined carbohydrates and trans fats. Discuss with your doctor whether statin therapy is indicated.',
        guideline: '2026 ACC/AHA Lipid Guidelines',
      });
    }
  }

  if (trigVal != null) {
    const isMgDl = (trigMeasurement?.unit || trigLab?.unit || 'mmol/L').toLowerCase().includes('mg');
    const trigNorm = isMgDl ? trigVal / 88.57 : trigVal;
    if (trigNorm >= 5.6) {
      insights.push({
        domain: 'hyperlipidaemia',
        category: 'Severe Hypertriglyceridaemia',
        severity: 'critical',
        title: 'Severe Hypertriglyceridaemia',
        message: `Triglycerides ${trigVal} — severely elevated (≥5.6 mmol/L / 500 mg/dL). Risk of acute pancreatitis.`,
        action: 'Urgent medical review. Very low fat diet, avoid alcohol, hold oral oestrogens. Fenofibrate or prescription omega-3 may be required.',
        guideline: '2025 ESC Lipid Guidelines',
      });
    } else if (trigNorm >= 1.7) {
      insights.push({
        domain: 'hyperlipidaemia',
        category: 'Elevated Triglycerides',
        severity: trigNorm >= 3.4 ? 'high' : 'medium',
        title: 'Elevated Triglycerides',
        message: `Triglycerides ${trigVal} — above optimal (<1.7 mmol/L / 150 mg/dL). Elevated triglycerides increase residual ASCVD risk.`,
        action: 'Reduce sugar, refined carbohydrates and alcohol. Increase physical activity. For levels >3.4 mmol/L, medication may be needed.',
        guideline: '2025 ESC / 2026 ACC/AHA',
      });
    }
  }

  // Lp(a) screen reminder — universal once-in-lifetime recommendation
  const lpaLab = latestLab('lipoprotein\\s*\\(?a\\)?|lp\\s*\\(?a\\)?|lpa\\b');
  if (!lpaLab) {
    insights.push({
      domain: 'hyperlipidaemia',
      category: 'Screening Recommendation',
      severity: 'info',
      title: 'Lipoprotein(a) [Lp(a)] Screening',
      message: 'Lp(a) has not been recorded in your lab results. The 2026 ACC/AHA guidelines recommend universal Lp(a) measurement at least once in every adult\'s lifetime.',
      action: 'Request an Lp(a) blood test at your next appointment. Lp(a) ≥125 nmol/L is a potent independent ASCVD risk factor that is genetically determined.',
      guideline: '2026 ACC/AHA Universal Lp(a) Recommendation',
    });
  } else if (lpaLab.numeric_result != null && lpaLab.numeric_result >= 125) {
    insights.push({
      domain: 'hyperlipidaemia',
      category: 'Elevated Lp(a)',
      severity: 'high',
      title: 'Elevated Lipoprotein(a)',
      message: `Lp(a) ${lpaLab.numeric_result} ${lpaLab.unit || 'nmol/L'} — above the high-risk threshold of 125 nmol/L. This is largely genetically determined.`,
      action: 'Discuss with your cardiologist. Intensive LDL-C lowering and aspirin may be considered. Novel Lp(a)-lowering therapies (e.g. pelacarsen) are in late-phase trials.',
      guideline: '2026 ACC/AHA Lp(a) Guidance',
    });
  }

  // ─── CKM / MULTIMORBIDITY INSIGHTS ────────────────────────────────────────
  const hasBP = latestBP != null;
  const hasGlucoseOrA1c = latestGlucose != null || hba1cValue != null;
  const hasLipid = ldlVal != null || totalCholVal != null;

  if (hasBP && hasGlucoseOrA1c) {
    insights.push({
      domain: 'ckm',
      category: 'CKM Synergy',
      severity: 'info',
      title: 'Cardiometabolic Risk — CKM Framework',
      message: 'You are tracking both blood pressure and glucose/HbA1c. The 2026 ADA/AHA Cardiovascular-Kidney-Metabolic (CKM) framework recommends holistic risk optimisation across all three domains.',
      action: 'If you have Type 2 Diabetes + hypertension, ask your doctor about SGLT2i and GLP-1 RA therapy — both provide independent cardiorenal protection beyond glucose lowering. eGFR and UACR monitoring is recommended annually.',
      guideline: '2026 ADA CKM Syndrome Framework',
    });
  }

  if (hasGlucoseOrA1c && hasLipid) {
    insights.push({
      domain: 'ckm',
      category: 'Statin Indication',
      severity: 'info',
      title: 'Statin Eligibility in Diabetes',
      message: 'Adults with diabetes aged 40–75 are generally eligible for moderate-to-high intensity statin therapy regardless of baseline LDL-C, per 2026 ADA recommendations.',
      action: 'Confirm with your doctor whether you are on appropriate statin therapy. The 2026 ADA recommends statins for all diabetes patients aged 40–75 with any ASCVD risk factor.',
      guideline: '2026 ADA Standards of Care',
    });
  }

  // ─── eGFR / RENAL FUNCTION ────────────────────────────────────────────────
  const egfrLab = latestLab('egfr|glomerular.filtration');
  const creatLab = latestLab('creatinine');
  if (egfrLab && egfrLab.numeric_result != null) {
    const egfr = egfrLab.numeric_result;
    let egfrSeverity, egfrMessage, egfrAction;
    if (egfr < 15) {
      egfrSeverity = 'critical';
      egfrMessage = `eGFR ${egfr} mL/min/1.73m² — kidney failure (Stage G5 CKD). Renal replacement therapy discussion needed.`;
      egfrAction = 'Urgent nephrology referral. SGLT2i may be contraindicated. Adjust all renally-cleared medications.';
    } else if (egfr < 30) {
      egfrSeverity = 'high';
      egfrMessage = `eGFR ${egfr} mL/min/1.73m² — severely reduced kidney function (Stage G3b–G4 CKD).`;
      egfrAction = 'Nephrology review recommended. Metformin may need dose reduction/cessation <30. SGLT2i has proven benefit down to eGFR 20 in CKD.';
    } else if (egfr < 60) {
      egfrSeverity = 'medium';
      egfrMessage = `eGFR ${egfr} mL/min/1.73m² — moderately reduced kidney function (Stage G3 CKD). Increased cardiometabolic risk.`;
      egfrAction = 'Optimise BP (<130/80 mmHg), consider SGLT2i (proven CKD progression slowing in CREDENCE/DAPA-CKD trials), and monitor UACR annually.';
    } else {
      egfrSeverity = 'normal';
      egfrMessage = `eGFR ${egfr} mL/min/1.73m² — normal or near-normal kidney function.`;
      egfrAction = 'Continue monitoring annually. Maintain BP and glucose targets to protect kidney function.';
    }
    insights.push({
      domain: 'renal',
      category: 'Kidney Function',
      severity: egfrSeverity,
      title: `eGFR: ${egfr} mL/min/1.73m²`,
      message: egfrMessage,
      action: egfrAction,
      value: `${egfr} mL/min/1.73m²`,
      guideline: '2026 KDIGO · ADA CKM Framework',
    });
  } else if (hasBP || hasGlucoseOrA1c) {
    insights.push({
      domain: 'renal',
      category: 'Screening Recommendation',
      severity: 'info',
      title: 'Renal Function Screening',
      message: 'No eGFR or creatinine result found. The PREVENT risk model and 2026 ADA/AHA CKM framework incorporate eGFR for accurate cardiovascular risk estimation.',
      action: 'Request eGFR and UACR (urine albumin-creatinine ratio) at your next blood test — especially important if you have hypertension or diabetes.',
      guideline: '2025 AHA PREVENT Equations · 2026 ADA CKM',
    });
  }

  // Sort: critical → high → medium → low → info → normal
  const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4, normal: 5 };
  insights.sort((a, b) => (order[a.severity] ?? 5) - (order[b.severity] ?? 5));

  return Response.json({ insights, has_data: hasBP || hasGlucoseOrA1c || hasLipid });
  } catch (error) {
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});