import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Clinical Scoring Algorithms ────────────────────────────────────────────

function computeASCVD({ age, sex, totalCholesterol, hdl, systolicBP, onBPMeds, diabetes, smoker }) {
  if (!age || !totalCholesterol || !hdl || !systolicBP) return null;
  const lnAge = Math.log(age), lnTC = Math.log(totalCholesterol), lnHDL = Math.log(hdl), lnSBP = Math.log(systolicBP);
  let sum, baseline;
  if (sex === 'female') {
    sum = -29.799*lnAge + 4.884*lnAge*lnAge + 13.540*lnTC - 3.114*lnAge*lnTC + -13.578*lnHDL + 3.149*lnAge*lnHDL +
          (onBPMeds ? 2.019 : 1.957)*lnSBP + 7.574*(smoker?1:0) - 1.665*lnAge*(smoker?1:0) + 0.661*(diabetes?1:0);
    baseline = 0.9665;
  } else {
    sum = 12.344*lnAge + 11.853*lnTC - 2.664*lnAge*lnTC + -7.990*lnHDL + 1.769*lnAge*lnHDL +
          (onBPMeds ? 1.797 : 1.764)*lnSBP + 7.837*(smoker?1:0) - 1.795*lnAge*(smoker?1:0) + 0.658*(diabetes?1:0);
    baseline = 0.9144;
  }
  return Math.min(Math.max((1 - Math.pow(baseline, Math.exp(sum - (sex==='female' ? -29.18 : 61.18)))) * 100, 0), 100);
}

function computeEGFR({ creatinine, age, sex }) {
  if (!creatinine || !age) return null;
  const kappa = sex === 'female' ? 0.7 : 0.9, alpha = sex === 'female' ? -0.241 : -0.302;
  const ratio = creatinine / kappa;
  return 142 * Math.pow(Math.min(ratio,1), alpha) * Math.pow(Math.max(ratio,1), -1.200) * Math.pow(0.9938, age) * (sex==='female' ? 1.012 : 1.0);
}

function ckdStage(egfr) {
  if (egfr === null) return null;
  if (egfr >= 90) return { stage: "G1", label: "Normal or High", risk: "low" };
  if (egfr >= 60) return { stage: "G2", label: "Mildly Decreased", risk: "low" };
  if (egfr >= 45) return { stage: "G3a", label: "Mildly-Moderately Decreased", risk: "moderate" };
  if (egfr >= 30) return { stage: "G3b", label: "Moderately-Severely Decreased", risk: "high" };
  if (egfr >= 15) return { stage: "G4", label: "Severely Decreased", risk: "very_high" };
  return { stage: "G5", label: "Kidney Failure", risk: "very_high" };
}

function computeFRAX({ age, sex, bmi, bmdTScore, priorFracture, parentFracture, smoking, alcohol, glucocorticoids, rheumatoid }) {
  if (!age || !sex) return null;
  let score = 0;
  if (age >= 50) score += (age - 50) * 0.3;
  if (sex === 'female') score += 8;
  if (bmi && bmi < 20) score += 4;
  if (bmdTScore !== undefined && bmdTScore !== null) score += Math.max(0, -bmdTScore) * 5;
  if (priorFracture) score += 15;
  if (parentFracture) score += 5;
  if (smoking) score += 4;
  if (alcohol) score += 3;
  if (glucocorticoids) score += 7;
  if (rheumatoid) score += 4;
  return Math.min(score, 100);
}

function computeSarcopeniaIndex({ sex, handgrip_kg, asmi, gait_speed_ms, sarc_f_score }) {
  const lowGrip = sex==='male' ? handgrip_kg<28 : handgrip_kg<18;
  const lowMass = sex==='male' ? asmi<7.0 : asmi<5.7;
  const lowGait = gait_speed_ms !== undefined ? gait_speed_ms < 1.0 : false;
  const highSarcF = sarc_f_score !== undefined ? sarc_f_score >= 4 : false;
  let score = 0, severity = "normal";
  if (lowGrip || lowGait) score += 30;
  if (lowMass) score += 40;
  if (highSarcF) score += 20;
  if (score >= 70) severity = "sarcopenic_severe";
  else if (score >= 40) severity = "sarcopenic";
  else if (score >= 20) severity = "pre_sarcopenic";
  return { score: Math.min(score, 100), severity, lowGrip, lowMass, lowGait, highSarcF };
}

function linearRegression(dataPoints, projectMonths = 12) {
  if (!dataPoints || dataPoints.length < 2) return null;
  const sorted = [...dataPoints].sort((a, b) => new Date(a.date) - new Date(b.date));
  const t0 = new Date(sorted[0].date).getTime();
  const xs = sorted.map(p => (new Date(p.date).getTime() - t0) / (1000*60*60*24*30.44));
  const ys = sorted.map(p => p.value);
  const n = xs.length;
  const sumX = xs.reduce((a,b)=>a+b,0), sumY = ys.reduce((a,b)=>a+b,0);
  const sumXY = xs.reduce((s,x,i)=>s+x*ys[i],0), sumX2 = xs.reduce((s,x)=>s+x*x,0);
  const slope = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX);
  const intercept = (sumY - slope*sumX) / n;
  const yMean = sumY/n;
  const ssTot = ys.reduce((s,y)=>s+Math.pow(y-yMean,2),0);
  const ssRes = ys.reduce((s,y,i)=>s+Math.pow(y-(slope*xs[i]+intercept),2),0);
  const r2 = ssTot===0 ? 0 : 1 - ssRes/ssTot;
  const lastX = xs[xs.length-1];
  const projections = [];
  for (let m=1; m<=projectMonths; m++) {
    const xp = lastX+m, predicted = slope*xp+intercept;
    const stderr = Math.sqrt(ssRes/Math.max(n-2,1));
    projections.push({
      date: new Date(new Date(sorted[sorted.length-1].date).getTime() + m*30.44*24*60*60*1000).toISOString().split('T')[0],
      predicted: Math.round(predicted*100)/100,
      lower_ci: Math.round((predicted-1.96*stderr)*100)/100,
      upper_ci: Math.round((predicted+1.96*stderr)*100)/100
    });
  }
  return { slope: Math.round(slope*1000)/1000, intercept: Math.round(intercept*100)/100, r2: Math.round(r2*1000)/1000, projections };
}

// ─── Temporal Event Correlation ──────────────────────────────────────────────

/**
 * Build a timeline of clinically significant medication events:
 *   - starts: when a medication began (start_date or created_date)
 *   - cessations: when a medication was stopped (end_date, or is_active flipped)
 * Returns sorted array of { date, type: "start"|"stop", medication_name, condition }
 */
function buildMedicationTimeline(medications) {
  const events = [];
  for (const med of medications) {
    const startDate = med.start_date || med.created_date?.split('T')[0];
    if (startDate) {
      events.push({ date: startDate, type: 'start', medication_name: med.medication_name, condition: med.condition });
    }
    if (med.end_date) {
      events.push({ date: med.end_date, type: 'stop', medication_name: med.medication_name, condition: med.condition });
    } else if (!med.is_active && !med.end_date && med.updated_date) {
      // No explicit end_date but inactive — use updated_date as approximate cessation date
      events.push({ date: med.updated_date.split('T')[0], type: 'stop', medication_name: med.medication_name, condition: med.condition });
    }
  }
  return events.sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * For a given biomarker series (sorted [{date, value}]) and medication timeline,
 * detect if a medication event precedes a meaningful directional change in the series.
 * Returns array of correlation observations.
 */
function detectMedicationEffects(series, medTimeline, toleranceMonths = 3) {
  if (!series.length || !medTimeline.length) return [];
  const effects = [];

  for (const event of medTimeline) {
    const eventMs = new Date(event.date).getTime();
    const toleranceMs = toleranceMonths * 30.44 * 24 * 60 * 60 * 1000;

    // Points BEFORE the event (up to 6 months before)
    const before = series.filter(p => {
      const ms = new Date(p.date).getTime();
      return ms < eventMs && ms >= eventMs - 6 * 30.44 * 24 * 60 * 60 * 1000;
    });
    // Points AFTER the event (within tolerance window)
    const after = series.filter(p => {
      const ms = new Date(p.date).getTime();
      return ms >= eventMs && ms <= eventMs + toleranceMs;
    });

    if (before.length >= 1 && after.length >= 1) {
      const avgBefore = before.reduce((s, p) => s + p.value, 0) / before.length;
      const avgAfter  = after.reduce((s, p) => s + p.value, 0) / after.length;
      const delta = avgAfter - avgBefore;
      const pctChange = avgBefore !== 0 ? (delta / avgBefore) * 100 : 0;

      // Only surface if there's at least a 5% relative change
      if (Math.abs(pctChange) >= 5) {
        effects.push({
          medication: event.medication_name,
          event_type: event.type,
          event_date: event.date,
          condition: event.condition,
          avg_before: Math.round(avgBefore * 100) / 100,
          avg_after:  Math.round(avgAfter  * 100) / 100,
          delta:      Math.round(delta * 100) / 100,
          pct_change: Math.round(pctChange * 10) / 10,
          direction:  delta < 0 ? 'decreased' : 'increased',
        });
      }
    }
  }
  return effects;
}

/**
 * Segment a series at medication event boundaries and compute regression per segment.
 * Useful to compare slopes before vs after a medication change.
 * Returns { before: regression|null, after: regression|null, breakpoint }
 */
function segmentedRegression(series, eventDate) {
  const eventMs = new Date(eventDate).getTime();
  const before = series.filter(p => new Date(p.date).getTime() < eventMs);
  const after  = series.filter(p => new Date(p.date).getTime() >= eventMs);
  return {
    before:     linearRegression(before, 0),
    after:      linearRegression(after, 6),
    breakpoint: eventDate,
    n_before:   before.length,
    n_after:    after.length,
  };
}

/**
 * Build human-readable driver strings from medication effects.
 */
function medicationEffectDrivers(effects) {
  return effects.map(e => {
    const verb = e.event_type === 'start' ? 'started' : 'stopped';
    const dir  = e.direction === 'decreased' ? '↓' : '↑';
    return `${e.medication} ${verb} ${e.event_date}: ${dir} ${Math.abs(e.pct_change)}% change (${e.avg_before} → ${e.avg_after})`;
  });
}

// ─── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const email = user.email;

    const [measurements, labResults, mskAssessments, healthProfile, medications] = await Promise.all([
      base44.entities.HealthMeasurement.filter({ created_by: email }, '-measured_at', 500),
      base44.entities.LabResult.filter({ created_by: email }, '-collected_at', 300),
      base44.entities.MusculoskeletalAssessment.filter({ created_by: email }, '-assessed_at', 20),
      base44.entities.UserHealthProfile.filter({ created_by: email }, '-created_date', 1),
      base44.entities.Medication.filter({ created_by: email }, '-start_date', 100),
    ]);

    const profile = healthProfile[0] || {};
    const latestMSK = mskAssessments[0] || {};
    const computedAt = new Date().toISOString();
    const results = [];

    // Build medication timeline for temporal correlation
    const medTimeline = buildMedicationTimeline(medications);

    const getMeasurementSeries = (type) =>
      measurements
        .filter(m => m.measurement_type === type && m.value_primary != null)
        .map(m => ({ date: m.measured_at?.split('T')[0] || m.measured_at, value: m.value_primary }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const getLabSeries = (keywords) =>
      labResults
        .filter(r => r.numeric_result != null && keywords.some(k => r.test_name?.toUpperCase().includes(k.toUpperCase())))
        .map(r => ({ date: r.collected_at?.split('T')[0] || r.collected_at, value: r.numeric_result }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const archiveOldModels = async (modelType) => {
      const old = await base44.entities.PredictiveModel.filter({ created_by: email, model_type: modelType, is_latest: true });
      for (const m of old) await base44.entities.PredictiveModel.update(m.id, { is_latest: false });
    };

    const saveModel = async (modelData) => {
      await archiveOldModels(modelData.model_type);
      return base44.entities.PredictiveModel.create({ ...modelData, created_by: email, computed_at: computedAt, is_latest: true, model_version: 'v1.1' });
    };

    // ── 1. HbA1c Trajectory ──────────────────────────────────────────────────
    const hba1cSeries = [
      ...getLabSeries(['HBA1C', 'HbA1c', 'GLYCATED', 'A1C']),
      ...getMeasurementSeries('hba1c')
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (hba1cSeries.length >= 2) {
      const reg = linearRegression(hba1cSeries, 12);
      const latest = hba1cSeries[hba1cSeries.length - 1].value;
      const category = latest >= 6.5 ? 'high' : latest >= 5.7 ? 'borderline' : 'low';
      const trend = reg.slope > 0.05 ? 'worsening' : reg.slope < -0.05 ? 'improving' : 'stable';

      // Temporal correlation: diabetes/glucose meds
      const diabetesMedEvents = medTimeline.filter(e => e.condition === 'diabetes' ||
        ['metformin','insulin','glipizide','sitagliptin','empagliflozin','dapagliflozin','semaglutide','liraglutide'].some(d => e.medication_name?.toLowerCase().includes(d)));
      const medEffects = detectMedicationEffects(hba1cSeries, diabetesMedEvents);
      const segAnalysis = diabetesMedEvents.length && hba1cSeries.length >= 3
        ? segmentedRegression(hba1cSeries, diabetesMedEvents[diabetesMedEvents.length-1].date)
        : null;

      const drivers = [];
      if (reg.slope > 0.05) drivers.push('Rising trend over analysis window');
      if (latest >= 6.5) drivers.push('Current value above diabetic threshold (6.5%)');
      if (latest >= 5.7) drivers.push('In pre-diabetic range (5.7–6.4%)');
      drivers.push(...medicationEffectDrivers(medEffects));
      if (segAnalysis?.before && segAnalysis?.after && segAnalysis.n_before >= 1 && segAnalysis.n_after >= 1) {
        const slopeDiff = segAnalysis.after.slope - segAnalysis.before.slope;
        if (Math.abs(slopeDiff) > 0.03) {
          drivers.push(`Trajectory changed after medication event on ${segAnalysis.breakpoint}: slope ${segAnalysis.before.slope > 0 ? '+':''}${segAnalysis.before.slope} → ${segAnalysis.after.slope > 0 ? '+':''}${segAnalysis.after.slope} %/month`);
        }
      }

      const saved = await saveModel({
        model_type: 'hba1c_trajectory',
        risk_score: Math.min((latest / 10) * 100, 100),
        risk_category: category,
        trend_direction: trend,
        trend_slope: reg.slope,
        predicted_values: JSON.stringify(reg.projections),
        actual_values: JSON.stringify(hba1cSeries),
        key_drivers: JSON.stringify(drivers),
        clinical_score_detail: JSON.stringify({
          latest_value: latest,
          medication_events: diabetesMedEvents.length,
          medication_effects: medEffects,
          segmented_analysis: segAnalysis ? { before_slope: segAnalysis.before?.slope, after_slope: segAnalysis.after?.slope, breakpoint: segAnalysis.breakpoint } : null,
        }),
        data_points_used: hba1cSeries.length,
        analysis_window_months: 12,
        next_review_date: new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0],
      });
      results.push({ type: 'hba1c_trajectory', id: saved.id, category, trend, med_effects: medEffects.length });
    }

    // ── 2. BP Trajectory ────────────────────────────────────────────────────
    const sbpSeries = getMeasurementSeries('blood_pressure');
    if (sbpSeries.length >= 2) {
      const reg = linearRegression(sbpSeries, 12);
      const latest = sbpSeries[sbpSeries.length - 1].value;
      const category = latest >= 180 ? 'very_high' : latest >= 140 ? 'high' : latest >= 130 ? 'moderate' : latest >= 120 ? 'borderline' : 'low';
      const trend = reg.slope > 0.5 ? 'worsening' : reg.slope < -0.5 ? 'improving' : 'stable';

      // Temporal correlation: antihypertensives
      const bpMedEvents = medTimeline.filter(e => e.condition === 'hypertension' ||
        ['amlodipine','atenolol','lisinopril','ramipril','losartan','valsartan','perindopril','bisoprolol','hydrochlorothiazide','nifedipine'].some(d => e.medication_name?.toLowerCase().includes(d)));
      const medEffects = detectMedicationEffects(sbpSeries, bpMedEvents);
      const segAnalysis = bpMedEvents.length && sbpSeries.length >= 3
        ? segmentedRegression(sbpSeries, bpMedEvents[bpMedEvents.length-1].date)
        : null;

      const drivers = [];
      if (reg.slope > 0.5) drivers.push('Systolic BP rising >0.5 mmHg/month');
      if (latest >= 140) drivers.push('Stage 2 hypertension range');
      drivers.push(...medicationEffectDrivers(medEffects));
      if (segAnalysis?.before && segAnalysis?.after && segAnalysis.n_before >= 1 && segAnalysis.n_after >= 1) {
        const slopeDiff = segAnalysis.after.slope - segAnalysis.before.slope;
        if (Math.abs(slopeDiff) > 0.3) {
          drivers.push(`BP trajectory changed after medication event on ${segAnalysis.breakpoint}: slope ${segAnalysis.before.slope > 0 ? '+':''}${segAnalysis.before.slope} → ${segAnalysis.after.slope > 0 ? '+':''}${segAnalysis.after.slope} mmHg/month`);
        }
      }

      const saved = await saveModel({
        model_type: 'bp_trajectory',
        risk_score: Math.min(((latest - 80) / 120) * 100, 100),
        risk_category: category,
        trend_direction: trend,
        trend_slope: reg.slope,
        predicted_values: JSON.stringify(reg.projections),
        actual_values: JSON.stringify(sbpSeries),
        key_drivers: JSON.stringify(drivers),
        clinical_score_detail: JSON.stringify({
          latest_sbp: latest,
          medication_events: bpMedEvents.length,
          medication_effects: medEffects,
          segmented_analysis: segAnalysis ? { before_slope: segAnalysis.before?.slope, after_slope: segAnalysis.after?.slope, breakpoint: segAnalysis.breakpoint } : null,
        }),
        data_points_used: sbpSeries.length,
        analysis_window_months: 12,
        next_review_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      });
      results.push({ type: 'bp_trajectory', id: saved.id, category, trend, med_effects: medEffects.length });
    }

    // ── 3. Lipid Trajectory (LDL) ───────────────────────────────────────────
    const ldlSeries = [
      ...getLabSeries(['LDL', 'LOW DENSITY']),
      ...getMeasurementSeries('ldl_cholesterol')
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (ldlSeries.length >= 2) {
      const reg = linearRegression(ldlSeries, 12);
      const latest = ldlSeries[ldlSeries.length - 1].value;
      const category = latest >= 4.9 ? 'very_high' : latest >= 4.1 ? 'high' : latest >= 3.4 ? 'moderate' : latest >= 2.6 ? 'borderline' : 'low';
      const trend = reg.slope > 0.05 ? 'worsening' : reg.slope < -0.05 ? 'improving' : 'stable';

      // Temporal correlation: statins / lipid-lowering meds
      const lipidMedEvents = medTimeline.filter(e => e.condition === 'hyperlipidaemia' ||
        ['statin','simvastatin','atorvastatin','rosuvastatin','pravastatin','ezetimibe','fenofibrate','bezafibrate'].some(d => e.medication_name?.toLowerCase().includes(d)));
      const medEffects = detectMedicationEffects(ldlSeries, lipidMedEvents);
      const segAnalysis = lipidMedEvents.length && ldlSeries.length >= 3
        ? segmentedRegression(ldlSeries, lipidMedEvents[lipidMedEvents.length-1].date)
        : null;

      const drivers = [latest >= 4.1 ? 'LDL above high-risk threshold' : 'LDL within range'];
      drivers.push(...medicationEffectDrivers(medEffects));
      if (segAnalysis?.before && segAnalysis?.after && segAnalysis.n_before >= 1 && segAnalysis.n_after >= 1) {
        const slopeDiff = segAnalysis.after.slope - segAnalysis.before.slope;
        if (Math.abs(slopeDiff) > 0.03) {
          drivers.push(`LDL trajectory changed after medication event on ${segAnalysis.breakpoint}`);
        }
      }

      const saved = await saveModel({
        model_type: 'lipid_trajectory',
        risk_score: Math.min((latest / 7) * 100, 100),
        risk_category: category,
        trend_direction: trend,
        trend_slope: reg.slope,
        predicted_values: JSON.stringify(reg.projections),
        actual_values: JSON.stringify(ldlSeries),
        key_drivers: JSON.stringify(drivers),
        clinical_score_detail: JSON.stringify({
          latest_ldl: latest,
          medication_effects: medEffects,
          segmented_analysis: segAnalysis ? { before_slope: segAnalysis.before?.slope, after_slope: segAnalysis.after?.slope, breakpoint: segAnalysis.breakpoint } : null,
        }),
        data_points_used: ldlSeries.length,
        analysis_window_months: 12,
        next_review_date: new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0],
      });
      results.push({ type: 'lipid_trajectory', id: saved.id, category, trend, med_effects: medEffects.length });
    }

    // ── 4. CKD Risk (eGFR from creatinine) ──────────────────────────────────
    const creatinineSeries = getLabSeries(['CREATININE', 'CREAT']);
    const latestCreatinine = creatinineSeries[creatinineSeries.length - 1]?.value;
    const profileAge = profile.date_of_birth
      ? Math.floor((Date.now() - new Date(profile.date_of_birth)) / (1000*60*60*24*365.25))
      : null;

    if (latestCreatinine && profileAge) {
      const egfr = computeEGFR({ creatinine: latestCreatinine, age: profileAge, sex: profile.biological_sex });
      const ckd = ckdStage(egfr);
      const reg = creatinineSeries.length >= 2 ? linearRegression(creatinineSeries, 12) : null;
      const trend = reg ? (reg.slope > 0.01 ? 'worsening' : reg.slope < -0.01 ? 'improving' : 'stable') : 'insufficient_data';

      // Nephrotoxic meds / RAAS agents
      const kidneyMedEvents = medTimeline.filter(e =>
        ['nsaid','ibuprofen','diclofenac','naproxen','lisinopril','ramipril','enalapril','losartan','valsartan','gentamicin','vancomycin','metformin'].some(d => e.medication_name?.toLowerCase().includes(d)));
      const creatEffects = detectMedicationEffects(creatinineSeries, kidneyMedEvents);
      const drivers = [`eGFR: ${Math.round(egfr)} mL/min/1.73m²`, `CKD Stage: ${ckd.stage} — ${ckd.label}`];
      drivers.push(...medicationEffectDrivers(creatEffects));

      const saved = await saveModel({
        model_type: 'ckd_risk',
        risk_score: Math.max(0, 100 - egfr),
        risk_category: ckd.risk,
        trend_direction: trend,
        trend_slope: reg?.slope || null,
        predicted_values: reg ? JSON.stringify(reg.projections) : null,
        actual_values: JSON.stringify(creatinineSeries),
        key_drivers: JSON.stringify(drivers),
        clinical_score_detail: JSON.stringify({ egfr: Math.round(egfr), ckd_stage: ckd.stage, creatinine: latestCreatinine, medication_effects: creatEffects }),
        data_points_used: creatinineSeries.length,
        analysis_window_months: 24,
        next_review_date: new Date(Date.now() + 180*24*60*60*1000).toISOString().split('T')[0],
      });
      results.push({ type: 'ckd_risk', id: saved.id, egfr: Math.round(egfr), stage: ckd.stage });
    }

    // ── 5. ASCVD 10-Year Risk ────────────────────────────────────────────────
    const hba1cSeriesForASCVD = [...getLabSeries(['HBA1C', 'HbA1c', 'GLYCATED', 'A1C']), ...getMeasurementSeries('hba1c')].sort((a,b)=>new Date(a.date)-new Date(b.date));
    const sbpSeriesForASCVD = getMeasurementSeries('blood_pressure');
    const latestTC  = getLabSeries(['TOTAL CHOLESTEROL', 'CHOLESTEROL'])[0]?.value || getMeasurementSeries('total_cholesterol').slice(-1)[0]?.value;
    const latestHDL = getLabSeries(['HDL'])[0]?.value || getMeasurementSeries('hdl_cholesterol').slice(-1)[0]?.value;
    const latestSBP = sbpSeriesForASCVD.slice(-1)[0]?.value;
    const latestHbA1c = hba1cSeriesForASCVD.slice(-1)[0]?.value;

    if (profileAge && profile.biological_sex && latestTC && latestHDL && latestSBP) {
      const onBPMeds = medications.some(m => m.is_active && m.condition === 'hypertension');
      const ascvd = computeASCVD({
        age: profileAge, sex: profile.biological_sex, totalCholesterol: latestTC, hdl: latestHDL,
        systolicBP: latestSBP, onBPMeds, diabetes: latestHbA1c >= 6.5,
        smoker: ['current', 'quit_lt_15y'].includes(profile.smoking_status)
      });

      if (ascvd !== null) {
        const category = ascvd >= 20 ? 'high' : ascvd >= 10 ? 'moderate' : ascvd >= 5 ? 'borderline' : 'low';
        const drivers = [];
        if (profileAge > 60) drivers.push('Age >60 is a primary risk driver');
        if (latestSBP >= 140) drivers.push('Elevated systolic BP');
        if (latestTC / latestHDL > 5) drivers.push('High TC:HDL ratio');
        if (latestHbA1c >= 6.5) drivers.push('Diabetes (HbA1c ≥6.5%)');
        if (onBPMeds) drivers.push('On antihypertensive medication (factored into PCE score)');

        // Active lipid-lowering meds
        const onStatin = medications.some(m => m.is_active &&
          ['statin','simvastatin','atorvastatin','rosuvastatin','pravastatin'].some(d => m.medication_name?.toLowerCase().includes(d)));
        if (onStatin) drivers.push('On statin therapy — LDL may be suppressed below underlying risk level');

        const saved = await saveModel({
          model_type: 'ascvd_risk',
          risk_score: ascvd,
          risk_category: category,
          trend_direction: 'stable',
          key_drivers: JSON.stringify(drivers),
          clinical_score_detail: JSON.stringify({ ascvd_pct: Math.round(ascvd*10)/10, age: profileAge, tc: latestTC, hdl: latestHDL, sbp: latestSBP, on_bp_meds: onBPMeds, on_statin: onStatin }),
          data_points_used: 1,
          analysis_window_months: 0,
          next_review_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
        });
        results.push({ type: 'ascvd_risk', id: saved.id, score: Math.round(ascvd*10)/10, category });
      }
    }

    // ── 6. FRAX Fracture Risk ────────────────────────────────────────────────
    if (profileAge && profile.biological_sex && latestMSK.assessed_at) {
      const frax = computeFRAX({
        age: profileAge, sex: profile.biological_sex, bmi: profile.bmi, bmdTScore: latestMSK.bmd_tscore,
        priorFracture: latestMSK.fragility_fracture,
        smoking: ['current', 'quit_lt_15y'].includes(profile.smoking_status),
        glucocorticoids: latestMSK.secondary_causes?.includes('glucocorticoids'),
      });
      const category = frax >= 20 ? 'high' : frax >= 10 ? 'moderate' : 'low';

      // Bone-active medications
      const boneActiveMeds = medications.filter(m =>
        ['bisphosphonate','alendronate','risedronate','zoledronic','denosumab','teriparatide','raloxifene','calcium','vitamin d','cholecalciferol','prednisolone','dexamethasone','prednisone'].some(d => m.medication_name?.toLowerCase().includes(d)));
      const boneMedDrivers = boneActiveMeds.map(m => `${m.is_active ? 'On' : 'Previously on'} ${m.medication_name}${m.start_date ? ` since ${m.start_date}` : ''}${m.end_date ? ` (ceased ${m.end_date})` : ''}`);

      const saved = await saveModel({
        model_type: 'frax_risk',
        risk_score: frax,
        risk_category: category,
        trend_direction: 'stable',
        key_drivers: JSON.stringify([
          latestMSK.bmd_tscore <= -2.5 ? 'Osteoporosis (T-score ≤-2.5)' : latestMSK.bmd_tscore <= -1.0 ? 'Osteopenia (T-score -1.0 to -2.5)' : 'Normal BMD',
          latestMSK.fragility_fracture ? 'Prior fragility fracture — major risk factor' : 'No prior fragility fracture',
          ...boneMedDrivers,
        ].filter(Boolean)),
        clinical_score_detail: JSON.stringify({ frax_pct: frax, bmd_tscore: latestMSK.bmd_tscore, bone_active_meds: boneActiveMeds.map(m=>m.medication_name) }),
        data_points_used: 1,
        analysis_window_months: 0,
        next_review_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
      });
      results.push({ type: 'frax_risk', id: saved.id, score: frax, category });
    }

    // ── 7. Sarcopenia Index ──────────────────────────────────────────────────
    if (latestMSK.assessed_at && latestMSK.sex) {
      const sarco = computeSarcopeniaIndex({
        sex: latestMSK.sex, handgrip_kg: latestMSK.handgrip_kg, asmi: latestMSK.asmi,
        gait_speed_ms: latestMSK.gait_speed_ms, sarc_f_score: latestMSK.sarc_f_score,
      });
      const category = sarco.severity==='sarcopenic_severe' ? 'very_high' : sarco.severity==='sarcopenic' ? 'high' : sarco.severity==='pre_sarcopenic' ? 'moderate' : 'low';
      const drivers = [];
      if (sarco.lowGrip) drivers.push('Low handgrip strength (below AWGS 2019 cutoff)');
      if (sarco.lowMass) drivers.push('Low appendicular skeletal muscle index');
      if (sarco.lowGait) drivers.push('Slow gait speed (<1.0 m/s)');
      if (sarco.highSarcF) drivers.push('Elevated SARC-F score (≥4)');

      // Corticosteroids and anabolic agents are clinically relevant to muscle mass
      const muscleMeds = medications.filter(m =>
        ['prednisolone','dexamethasone','prednisone','methylprednisolone','protein','creatine'].some(d => m.medication_name?.toLowerCase().includes(d)));
      if (muscleMeds.length) {
        drivers.push(...muscleMeds.map(m => `${m.is_active ? 'Current' : 'Prior'} use of ${m.medication_name} — may affect muscle mass`));
      }

      const saved = await saveModel({
        model_type: 'sarcopenia_index',
        risk_score: sarco.score,
        risk_category: category,
        trend_direction: mskAssessments.length >= 2 ? (mskAssessments[0].handgrip_kg > mskAssessments[1].handgrip_kg ? 'worsening' : 'improving') : 'insufficient_data',
        key_drivers: JSON.stringify(drivers.length ? drivers : ['Within normal range on all sarcopenia criteria']),
        clinical_score_detail: JSON.stringify({ ...sarco, relevant_meds: muscleMeds.map(m=>m.medication_name) }),
        data_points_used: mskAssessments.length,
        analysis_window_months: 12,
        next_review_date: new Date(Date.now() + 180*24*60*60*1000).toISOString().split('T')[0],
      });
      results.push({ type: 'sarcopenia_index', id: saved.id, severity: sarco.severity, category });
    }

    return Response.json({
      success: true,
      computed_at: computedAt,
      models_computed: results.length,
      medication_timeline_events: medTimeline.length,
      results
    });

  } catch (error) {
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});