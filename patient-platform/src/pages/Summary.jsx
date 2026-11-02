import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, FileText, Printer, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import moment from "moment";
import { useTranslation } from "react-i18next";


const typeLabels = {
  blood_pressure: "Blood Pressure",
  heart_rate: "Heart Rate",
  blood_glucose: "Blood Glucose",
  hba1c: "HbA1c",
  total_cholesterol: "Total Cholesterol",
  ldl_cholesterol: "LDL Cholesterol",
  hdl_cholesterol: "HDL Cholesterol",
  triglycerides: "Triglycerides",
  weight: "Weight",
};

const conditionLabels = {
  hypertension: "Hypertension",
  diabetes: "Diabetes",
  hyperlipidaemia: "Hyperlipidaemia",
  general: "General",
};

const esc = (v) => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");

export default function Summary() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod] = useState("90");
  const [summaryHtml, setSummaryHtml] = useState("");
  const summaryRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const [medications, setMedications] = useState([]);
  const [womensLogs, setWomensLogs] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [mskAssessments, setMskAssessments] = useState([]);
  const [medDocs, setMedDocs] = useState([]);
  const [allergies, setAllergies] = useState([]);

  const loadData = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const [m, a, meds, wl, lr, msk, mdocs, profiles] = await Promise.all([
      base44.entities.HealthMeasurement.filter({ created_by: u.email }, "-measured_at", 500),
      base44.entities.Appointment.filter({ created_by: u.email }, "-appointment_date", 50),
      base44.entities.Medication.filter({ created_by: u.email }, "-created_date", 100),
      base44.entities.WomensHealthLog.filter({ created_by: u.email }, "-logged_at", 200),
      base44.entities.LabResult.filter({ created_by: u.email }, "-collected_at", 200),
      base44.entities.MusculoskeletalAssessment.filter({ created_by: u.email }, "-assessed_at", 10),
      base44.entities.MedicalDocument.filter({ created_by: u.email }, "-report_date", 200),
      base44.entities.UserHealthProfile.filter({ created_by: u.email }, "-created_date", 1),
    ]);
    setMeasurements(m);
    setAppointments(a);
    setMedications(meds);
    setWomensLogs(wl);
    setLabResults(lr);
    setMskAssessments(msk);
    setMedDocs(mdocs);
    setAllergies(profiles[0]?.allergies || []);
    setLoading(false);
  };

  const generateSummary = async () => {
    setGenerating(true);

    const cutoff = moment().subtract(parseInt(period), "days");
    const filtered = measurements.filter((m) => moment(m.measured_at).isAfter(cutoff));

    // ── Measurements ─────────────────────────────────────────────────────────
    const grouped = {};
    filtered.forEach((m) => {
      if (!grouped[m.measurement_type]) grouped[m.measurement_type] = [];
      grouped[m.measurement_type].push(m);
    });

    const summaryData = Object.entries(grouped).map(([type, readings]) => {
      const latest = readings[0];
      const isBP = type === "blood_pressure";
      const values = readings.map((r) => r.value_primary);
      const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
      const min = Math.min(...values).toFixed(1);
      const max = Math.max(...values).toFixed(1);
      let latestStr = isBP ? `${latest.value_primary}/${latest.value_secondary ?? "—"}` : `${latest.value_primary}`;
      let avgStr = avg;
      let rangeStr = `${min} – ${max}`;
      if (isBP) {
        const sec = readings.map((r) => r.value_secondary).filter((v) => v != null);
        if (sec.length) {
          const avgSec = (sec.reduce((a, b) => a + b, 0) / sec.length).toFixed(1);
          avgStr = `${avg}/${avgSec}`;
          rangeStr = `${min}–${max} / ${Math.min(...sec).toFixed(1)}–${Math.max(...sec).toFixed(1)}`;
        }
      }
      return { type: typeLabels[type] || type, condition: conditionLabels[latest.condition] || latest.condition, count: readings.length, latest: latestStr, avg: avgStr, range: rangeStr, unit: latest.unit, latestDate: moment(latest.measured_at).format("D MMM YYYY") };
    });

    // ── Medications ───────────────────────────────────────────────────────────
    const activeMeds = medications.filter((m) => m.is_active);
    const pastMeds = medications.filter((m) => !m.is_active);

    // ── Lab Results ───────────────────────────────────────────────────────────
    const recentLabs = labResults.filter((r) => moment(r.collected_at).isAfter(cutoff));
    const seenLab = new Set();
    const dedupedLabs = recentLabs.filter((r) => { if (seenLab.has(r.test_name)) return false; seenLab.add(r.test_name); return true; });
    const isAbnormal = (r) => {
      if (r.numeric_result == null) return false;
      if (r.reference_range_low != null && r.numeric_result < r.reference_range_low) return true;
      if (r.reference_range_high != null && r.numeric_result > r.reference_range_high) return true;
      return false;
    };
    const abnormalLabs = dedupedLabs.filter(isAbnormal);
    const normalLabs = dedupedLabs.filter((r) => !isAbnormal(r));

    // ── Cardiometabolic Insights ──────────────────────────────────────────────
    let cardioInsights = [];
    const cardioRes = await base44.functions.invoke("generateCardiometabolicInsights", {});
    if (cardioRes.data?.insights?.length) cardioInsights = cardioRes.data.insights;

    // ── Cancer Screening ──────────────────────────────────────────────────────
    let screeningRecs = [];
    let screeningAge = null;
    let screeningIncomplete = false;
    const screenRes = await base44.functions.invoke("generateScreeningRecommendations", {});
    if (screenRes.data?.recommendations?.length) {
      screeningRecs = screenRes.data.recommendations;
      screeningAge = screenRes.data.age;
    } else if (screenRes.data?.profile_incomplete) {
      screeningIncomplete = true;
    }

    // ── Women's Health ────────────────────────────────────────────────────────
    const recentWomensLogs = womensLogs.filter((l) => moment(l.logged_at).isAfter(cutoff));

    // ── Appointments ──────────────────────────────────────────────────────────
    const recentAppts = appointments.filter((a) => moment(a.appointment_date).isAfter(cutoff)).slice(0, 10);

    // ─────────────────────────────────────────────────────────────────────────
    // Build HTML directly — no LLM
    // ─────────────────────────────────────────────────────────────────────────
    const s = {
      page: `font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; line-height: 1.5;`,
      h1: `font-size: 20px; font-weight: bold; margin: 0 0 4px 0; color: #0f4c75;`,
      h2: `font-size: 14px; font-weight: bold; background: #f0f4f8; border-left: 4px solid #0f4c75; padding: 6px 10px; margin: 24px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;`,
      table: `width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px;`,
      th: `background: #e8edf2; border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-weight: bold;`,
      td: `border: 1px solid #ddd; padding: 5px 8px; vertical-align: top;`,
      tdAbnormal: `border: 1px solid #ddd; padding: 5px 8px; vertical-align: top; background: #fff3f3; font-weight: bold;`,
      small: `font-size: 11px; color: #555;`,
      disclaimer: `font-size: 11px; color: #666; border: 1px solid #ccc; padding: 10px 12px; background: #fafafa; margin-top: 24px; border-radius: 4px;`,
      badge: (sev) => {
        const map = { critical: "background:#fde8e8;color:#9b1c1c;border:1px solid #f5c6c6;", high: "background:#fff3e0;color:#7c4700;border:1px solid #ffd699;", medium: "background:#fffbe6;color:#7a5c00;border:1px solid #ffe066;", normal: "background:#e8f5e9;color:#1a5c2a;border:1px solid #a5d6a7;", info: "background:#e8f0fe;color:#1a3c6a;border:1px solid #9ec5f8;" };
        return `display:inline-block;font-size:10px;font-weight:bold;padding:1px 6px;border-radius:3px;${map[sev] || map.info}`;
      },
    };

    const raw = (html) => ({ __raw: true, html });
    const cell = (c) => (c && c.__raw) ? c.html : esc(c ?? "—");
    const row = (cells, isHeader = false) =>
      `<tr>${cells.map((c) => `<${isHeader ? "th" : "td"} style="${isHeader ? s.th : s.td}">${cell(c)}</th>`).join("")}</tr>`;
    const abnRow = (cells) =>
      `<tr>${cells.map((c) => `<td style="${s.tdAbnormal}">${cell(c)}</td>`).join("")}</tr>`;

    let html = `<div style="${s.page}">`;

    // Header
    html += `
      <div style="border-bottom: 2px solid #0f4c75; padding-bottom: 12px; margin-bottom: 16px;">
        <p style="${s.h1}">Health Summary Report</p>
        <p style="margin:0; color:#444;"><strong>Patient:</strong> ${esc(user?.full_name || "Patient")}</p>
        <p style="margin:2px 0; color:#444;"><strong>Period:</strong> ${cutoff.format("D MMM YYYY")} – ${moment().format("D MMM YYYY")} (last ${period} days)</p>
        <p style="margin:2px 0; color:#444;"><strong>Generated:</strong> ${moment().format("D MMM YYYY, h:mm A")}</p>
      </div>`;

    // ── Section: Physiological Measurements
    html += `<p style="${s.h2}">Physiological Measurements</p>`;
    if (summaryData.length === 0) {
      html += `<p style="${s.small}">No measurements recorded in this period.</p>`;
    } else {
      html += `<table style="${s.table}"><thead>${row(["Measurement", "Condition", "Readings", "Latest Value", "Date", "Average", "Range"], true)}</thead><tbody>`;
      summaryData.forEach((d) => {
        html += row([d.type, d.condition, d.count, `${d.latest} ${d.unit}`, d.latestDate, `${d.avg} ${d.unit}`, `${d.range} ${d.unit}`]);
      });
      html += `</tbody></table>`;
    }

    // ── Section: Lab Results
    html += `<p style="${s.h2}">Lab Results</p>`;
    if (dedupedLabs.length === 0) {
      html += `<p style="${s.small}">No lab results recorded in this period.</p>`;
    } else {
      if (abnormalLabs.length > 0) {
        html += `<p style="font-weight:bold; font-size:12px; margin-bottom:6px;">⚠ Out-of-Range Results (${abnormalLabs.length})</p>`;
        html += `<table style="${s.table}"><thead>${row(["Test", "Result", "Unit", "Reference Range", "Direction", "Lab / Date"], true)}</thead><tbody>`;
        abnormalLabs.forEach((r) => {
          const dir = r.numeric_result < (r.reference_range_low ?? Infinity) ? "Low ↓" : "High ↑";
          const ref = r.reference_range_text || (r.reference_range_low != null ? `${r.reference_range_low} – ${r.reference_range_high}` : "—");
          html += abnRow([r.test_name, r.numeric_result, r.unit || "—", ref, dir, `${r.lab_name || "—"} · ${moment(r.collected_at).format("D MMM YYYY")}`]);
        });
        html += `</tbody></table>`;
      }
      if (normalLabs.length > 0) {
        html += `<p style="${s.small}">Additionally, ${normalLabs.length} result${normalLabs.length > 1 ? "s were" : " was"} within normal reference range: ${normalLabs.map(r => esc(r.test_name)).join(", ")}.</p>`;
      }
    }

    // ── Section: Cardiometabolic Alerts
    const notableCardio = cardioInsights.filter(i => ["critical","high","medium"].includes(i.severity));
    html += `<p style="${s.h2}">Cardiometabolic Alerts</p>`;
    if (notableCardio.length === 0) {
      html += `<p style="${s.small}">No cardiometabolic data available.</p>`;
    } else {
      html += `<table style="${s.table}"><thead>${row(["Severity", "Finding", "Suggested Action*"], true)}</thead><tbody>`;
      notableCardio.forEach((i) => {
        html += row([raw(`<span style="${s.badge(i.severity)}">${esc(i.severity.toUpperCase())}</span>`), i.title, i.action]);
      });
      html += `</tbody></table>`;
      html += `<p style="${s.small}">*See disclaimer below. Source: ${[...new Set(notableCardio.map(i=>i.guideline).filter(Boolean))].join(", ")}</p>`;
    }

    // ── Section: Cancer Screening
    html += `<p style="${s.h2}">Cancer Screening Recommendations</p>`;
    if (screeningIncomplete) {
      html += `<p style="${s.small}">Health profile not completed — personalised screening recommendations unavailable.</p>`;
    } else if (screeningRecs.length === 0) {
      html += `<p style="${s.small}">No active screening protocols applicable at this time.</p>`;
    } else {
      html += `<p style="${s.small}">Based on health profile, age ${screeningAge}. Discuss with your healthcare provider before arranging any screening.</p>`;
      html += `<table style="${s.table}"><thead>${row(["Cancer Type", "Recommended Test", "Frequency", "Evidence Level", "Notes"], true)}</thead><tbody>`;
      screeningRecs.forEach((r) => {
        html += row([r.cancer_type.charAt(0).toUpperCase() + r.cancer_type.slice(1), r.test_type, r.frequency, r.evidence_level, r.notes || "—"]);
      });
      html += `</tbody></table>`;
    }

    // ── Section: Women's Health
    if (recentWomensLogs.length > 0) {
      const cycleEntries = recentWomensLogs.filter((l) => l.log_type === "menstrual_cycle");
      const ovulationTests = recentWomensLogs.filter((l) => l.log_type === "ovulation_test");
      const pregnancyTests = recentWomensLogs.filter((l) => l.log_type === "pregnancy_test");
      const bloodMarkers = recentWomensLogs.filter((l) => l.log_type === "pregnancy_blood_marker");
      const immunisations = recentWomensLogs.filter((l) => l.log_type === "pregnancy_immunisation");
      const bpLogs = recentWomensLogs.filter((l) => l.log_type === "pregnancy_bp");
      const glucoseLogs = recentWomensLogs.filter((l) => l.log_type === "pregnancy_glucose");

      html += `<p style="${s.h2}">Women's Health</p>`;
      html += `<table style="${s.table}"><thead>${row(["Item", "Details"], true)}</thead><tbody>`;
      if (cycleEntries.length) html += row(["Menstrual Cycle", `${cycleEntries.length} entries · Flows: ${[...new Set(cycleEntries.map(l=>l.period_flow).filter(Boolean))].join(", ") || "not specified"} · Cycle length: ${cycleEntries.find(l=>l.cycle_length_days)?.cycle_length_days ?? "not recorded"} days`]);
      if (ovulationTests.length) html += row(["Ovulation Tests", `${ovulationTests.length} tests · ${ovulationTests.filter(l=>l.result==="positive").length} positive`]);
      if (pregnancyTests.length) html += row(["Pregnancy Tests", `${pregnancyTests.length} tests · ${pregnancyTests.filter(l=>l.result==="positive").length} positive`]);
      if (bloodMarkers.length) html += row(["Pregnancy Blood Markers", bloodMarkers.map(l=>`${l.marker_type} ${l.marker_value}${l.marker_unit?" "+l.marker_unit:""}${l.gestational_week?" ("+l.gestational_week+"w)":""}`).join("; ")]);
      if (immunisations.length) html += row(["Immunisations", immunisations.map(l=>`${l.immunisation_name} — ${l.immunisation_status}${l.immunisation_date?", "+moment(l.immunisation_date).format("MMM YYYY"):""}`).join("; ")]);
      if (bpLogs.length) html += row(["Pregnancy BP", bpLogs.map(l=>`${l.bp_systolic}/${l.bp_diastolic} mmHg`).join(", ")]);
      if (glucoseLogs.length) html += row(["Pregnancy Glucose", glucoseLogs.map(l=>`${l.glucose_value} ${l.glucose_unit} (${l.glucose_context})`).join(", ")]);
      html += `</tbody></table>`;
    }

    // ── Section: Known Allergies
    html += `<p style="${s.h2}">Known Allergies</p>`;
    if (allergies.length === 0) {
      html += `<p style="${s.small}">No allergies recorded.</p>`;
    } else {
      html += `<p style="font-size:12px; margin-bottom:8px;">`;
      allergies.forEach((a) => {
        html += `<span style="display:inline-block; background:#fff3e0; color:#92400e; border:1px solid #fcd34d; border-radius:3px; padding:2px 8px; margin:2px 4px 2px 0; font-weight:600; font-size:11px;">${esc(a)}</span>`;
      });
      html += `</p>`;
      html += `<p style="${s.small}">⚠ Please inform all healthcare providers of the above allergies before prescribing or administering any medications, contrast agents, or other substances.</p>`;
    }

    // ── Section: Medications
    html += `<p style="${s.h2}">Medications</p>`;
    html += `<table style="${s.table}"><thead>${row(["Medication", "Dosage & Frequency", "Condition", "Prescribing Doctor", "Status"], true)}</thead><tbody>`;
    [...activeMeds, ...pastMeds].forEach((m) => {
      html += row([m.medication_name, `${m.dosage}${m.frequency ? ", " + m.frequency : ""}`, m.condition || "—", m.prescribing_doctor ? `Dr. ${m.prescribing_doctor}` : "—", m.is_active ? "Active" : `Stopped${m.end_date ? " " + moment(m.end_date).format("MMM YYYY") : ""}`]);
    });
    if (!activeMeds.length && !pastMeds.length) html += `<tr><td colspan="5" style="${s.td}">No medications recorded.</td></tr>`;
    html += `</tbody></table>`;

    // ── Section: Musculoskeletal & Bone Health
    const recentMsk = mskAssessments.filter((a) => moment(a.assessed_at).isAfter(cutoff));
    if (recentMsk.length > 0) {
      const latest = recentMsk[0];
      html += `<p style="${s.h2}">Bone, Muscle &amp; Frailty Assessment</p>`;
      html += `<table style="${s.table}"><thead>${row(["Item", "Value", "Notes"], true)}</thead><tbody>`;
      if (latest.bmd_tscore != null) {
        const tClass = latest.bmd_tscore >= -1 ? "Normal" : latest.bmd_tscore >= -2.5 ? "Osteopenia" : "Osteoporosis";
        html += row(["BMD T-score", `${latest.bmd_tscore}${latest.bmd_site ? " (" + latest.bmd_site.replace(/_/g," ") + ")" : ""}`, tClass]);
      }
      if (latest.bmd_zscore != null) html += row(["BMD Z-score", latest.bmd_zscore, ""]);
      if (latest.handgrip_kg != null) html += row(["Handgrip Strength", `${latest.handgrip_kg} kg`, ""]);
      if (latest.asmi != null) html += row(["ASMI (BIA)", `${latest.asmi} kg/m²`, ""]);
      if (latest.gait_speed_ms != null) html += row(["Gait Speed", `${latest.gait_speed_ms} m/s`, latest.gait_speed_ms < 0.8 ? "Slow — frailty risk" : "Normal"]);
      if (latest.chair_stand_time_s != null) html += row(["5x Chair Stand", `${latest.chair_stand_time_s} s`, latest.chair_stand_time_s > 12 ? "Prolonged — sarcopenia risk" : "Normal"]);
      if (latest.sarc_f_score != null) html += row(["SARC-F Score", latest.sarc_f_score, latest.sarc_f_score >= 4 ? "Positive screen — sarcopenia likely" : "Negative"]);
      if (latest.vitamin_d_ngml != null) html += row(["Vitamin D", `${latest.vitamin_d_ngml} ng/mL`, latest.vitamin_d_ngml < 20 ? "Deficient" : latest.vitamin_d_ngml < 30 ? "Insufficient" : "Sufficient"]);
      if (latest.fragility_fracture) html += row(["Fragility Fracture History", "Yes", "Increases fracture risk classification"]);
      if (latest.exercise_sessions_per_week != null) html += row(["Exercise (resistance/WB)", `${latest.exercise_sessions_per_week}x/week`, ""]);
      html += `</tbody></table>`;
      html += `<p style="${s.small}">Assessment date: ${moment(latest.assessed_at).format("D MMM YYYY")}. ${recentMsk.length > 1 ? recentMsk.length + " assessments in period." : ""}</p>`;
    }

    // ── Section: Medical Documents
    const recentDocs = medDocs.filter((d) => moment(d.report_date).isAfter(cutoff));
    if (recentDocs.length > 0) {
      const docTypeLabels = { radiology:"Radiology & Imaging", ecg:"ECG & Cardiac", bmd:"Bone Density / DXA", spirometry:"Spirometry", microbiology:"Microbiology", histopathology:"Histopathology", ophthalmology:"Ophthalmology", audiology:"Audiometry", other:"Other" };
      html += `<p style="${s.h2}">Medical Documents &amp; Reports</p>`;
      html += `<table style="${s.table}"><thead>${row(["Type", "Title", "Facility", "Date", "Summary"], true)}</thead><tbody>`;
      recentDocs.forEach((d) => {
        html += row([docTypeLabels[d.doc_type] || d.doc_type, d.title, d.facility || "—", moment(d.report_date).format("D MMM YYYY"), d.summary ? d.summary.slice(0,120) + (d.summary.length>120?"…":"") : "—"]);
      });
      html += `</tbody></table>`;
    }

    // ── Section: Appointments
    if (recentAppts.length > 0) {
      html += `<p style="${s.h2}">Recent Appointments</p>`;
      html += `<table style="${s.table}"><thead>${row(["Date", "Doctor", "Reason", "Status"], true)}</thead><tbody>`;
      recentAppts.forEach((a) => {
        html += row([moment(a.appointment_date).format("D MMM YYYY"), `Dr. ${a.doctor_name}`, a.reason || "General", a.status]);
      });
      html += `</tbody></table>`;
    }

    // ── Disclaimer
    html += `<div style="${s.disclaimer}">
      <strong>Disclaimer:</strong> This document is a factual summary of data recorded within Unified Medical Record and is intended to support — not replace — clinical consultation. All findings, alerts, and screening recommendations listed herein should be discussed with a qualified healthcare professional before any clinical decision is made. Cardiometabolic alerts are derived from published guidelines for informational purposes only and do not constitute a diagnosis. Unified Medical Record and its operators accept no clinical liability for actions taken based on this report.
    </div>`;

    html += `<p style="text-align:center; font-size:10px; color:#999; margin-top:16px;">Generated by Unified Medical Record · A MedNex Pte Ltd project · ${moment().format("D MMM YYYY")}</p>`;
    html += `</div>`;

    setSummaryHtml(html);
    setGenerating(false);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head><title>Health Summary - ${esc(user?.full_name)}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
          ${summaryHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('summary.title')}</h1>
        <p className="text-sm text-slate-400 mt-1">{t('summary.generate')}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900 mb-1">Generate Report</h3>
            <p className="text-sm text-slate-400">Select a time period and generate a comprehensive health summary</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-36 h-10 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={generateSummary}
              disabled={generating}
              className="h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 px-5"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {generating ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>

        {generating && (
          <div className="mt-4 p-3 rounded-xl bg-teal-50 border border-teal-200">
            <p className="text-xs text-teal-700">Compiling your health data — fetching measurements, lab results, cardiometabolic alerts, screening recommendations, MSK assessments and medical documents…</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4">
          <p className="text-2xl font-bold text-slate-900">{measurements.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Total Readings</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4">
          <p className="text-2xl font-bold text-slate-900">{labResults.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Lab Results</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4">
          <p className="text-2xl font-bold text-slate-900">{medications.filter(m=>m.is_active).length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Active Medications</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4">
          <p className="text-2xl font-bold text-slate-900">{mskAssessments.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">MSK Assessments</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4">
          <p className="text-2xl font-bold text-slate-900">{medDocs.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Medical Documents</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4">
          <p className="text-2xl font-bold text-slate-900">{appointments.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Appointments</p>
        </div>
      </div>

      {/* Generated Summary */}
      {summaryHtml && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Generated Summary</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} className="h-9 rounded-xl gap-2 text-sm">
                <Printer className="w-4 h-4" /> Print / Save PDF
              </Button>
            </div>
          </div>
          <div
            ref={summaryRef}
            className="bg-white rounded-2xl border border-slate-200/80 p-8 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: summaryHtml }}
          />
        </div>
      )}
    </div>
  );
}