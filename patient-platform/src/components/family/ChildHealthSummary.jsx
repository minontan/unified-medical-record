import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO, differenceInMonths, differenceInYears } from "date-fns";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from "moment";

// ── WHO growth reference data (simplified median ± 1SD for flagging)
// height-for-age (cm) approximate medians at key ages
const WHO_HEIGHT = {
  male:   { 0:50.0,3:61.4,6:67.6,9:72.3,12:75.7,18:82.3,24:87.8,36:96.1,48:103.3,60:110.0,72:116.0,84:121.7,96:127.3,108:132.6,120:137.5,132:143.0,144:149.8,156:158.0,168:165.0,180:171.5,192:174.0,216:175.0 },
  female: { 0:49.1,3:59.8,6:65.7,9:70.1,12:74.0,18:80.7,24:86.4,36:95.1,48:102.7,60:109.4,72:115.1,84:120.8,96:126.6,108:132.5,120:138.6,132:144.8,144:151.5,156:156.5,168:160.0,180:161.5,192:162.0,216:162.5 },
};
const WHO_WEIGHT = {
  male:   { 0:3.3,3:6.4,6:7.9,9:9.2,12:10.2,18:11.5,24:12.7,36:14.7,48:16.7,60:18.7,72:20.7,84:22.9,96:25.3,108:28.1,120:31.2,132:34.7,144:39.2,156:44.9,168:51.5,180:57.2,192:61.0,216:63.5 },
  female: { 0:3.2,3:5.8,6:7.3,9:8.4,12:9.5,18:10.8,24:12.1,36:14.2,48:16.1,60:18.2,72:20.2,84:22.4,96:25.0,108:28.0,120:31.5,132:35.5,144:40.5,156:46.1,168:50.5,180:53.5,192:54.5,216:55.0 },
};

function interpolateRef(table, sex, ageMonths) {
  const ref = table[sex];
  if (!ref) return null;
  const keys = Object.keys(ref).map(Number).sort((a, b) => a - b);
  if (ageMonths <= keys[0]) return ref[keys[0]];
  if (ageMonths >= keys[keys.length - 1]) return ref[keys[keys.length - 1]];
  for (let i = 0; i < keys.length - 1; i++) {
    if (ageMonths >= keys[i] && ageMonths <= keys[i + 1]) {
      const ratio = (ageMonths - keys[i]) / (keys[i + 1] - keys[i]);
      return ref[keys[i]] + ratio * (ref[keys[i + 1]] - ref[keys[i]]);
    }
  }
  return null;
}

function growthFlag(value, ref, margin = 0.1) {
  if (ref == null || value == null) return null;
  const pct = (value - ref) / ref;
  if (pct < -margin) return "below";
  if (pct > margin) return "above";
  return "normal";
}

// ── Singapore National Childhood Immunisation Schedule (simplified)
const VAX_SCHEDULE = [
  { name: "BCG",                    dueMonths: 0  },
  { name: "Hepatitis B (1st)",      dueMonths: 0  },
  { name: "Hepatitis B (2nd)",      dueMonths: 1  },
  { name: "DTaP/IPV/Hib (1st)",     dueMonths: 3  },
  { name: "DTaP/IPV/Hib (2nd)",     dueMonths: 4  },
  { name: "DTaP/IPV/Hib (3rd)",     dueMonths: 5  },
  { name: "Hepatitis B (3rd)",      dueMonths: 6  },
  { name: "MMR (1st)",              dueMonths: 12 },
  { name: "Varicella (1st)",        dueMonths: 12 },
  { name: "DTaP/IPV/Hib (4th)",     dueMonths: 18 },
  { name: "MMR (2nd)",              dueMonths: 18 },
  { name: "Varicella (2nd)",        dueMonths: 18 },
  { name: "DTaP/IPV (booster)",     dueMonths: 60 },
  { name: "Td (booster)",           dueMonths: 132 },
  { name: "HPV",                    dueMonths: 156 },
];

function buildVaxStatus(ageMonths, vaccinations) {
  const givenNames = vaccinations.map(v => (v.vaccine_name || "").toLowerCase());
  return VAX_SCHEDULE
    .filter(v => v.dueMonths <= ageMonths + 1) // due within this age range
    .map(v => {
      const given = givenNames.some(n => n.includes(v.name.split(" ")[0].toLowerCase()));
      return { ...v, given };
    });
}

// ── BMI calculation for children ≥ 2 years
function calcBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  return (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
}

// ── Styles (matching parent Summary page)
const s = {
  page:  `font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; line-height: 1.5;`,
  h1:    `font-size: 20px; font-weight: bold; margin: 0 0 4px 0; color: #0f4c75;`,
  h2:    `font-size: 14px; font-weight: bold; background: #f0f4f8; border-left: 4px solid #0f4c75; padding: 6px 10px; margin: 24px 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;`,
  table: `width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px;`,
  th:    `background: #e8edf2; border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-weight: bold;`,
  td:    `border: 1px solid #ddd; padding: 5px 8px; vertical-align: top;`,
  tdWarn:`border: 1px solid #ddd; padding: 5px 8px; vertical-align: top; background: #fff3f3; font-weight: bold;`,
  tdGood:`border: 1px solid #ddd; padding: 5px 8px; vertical-align: top; background: #f0fdf4;`,
  small: `font-size: 11px; color: #555;`,
  disclaimer: `font-size: 11px; color: #666; border: 1px solid #ccc; padding: 10px 12px; background: #fafafa; margin-top: 24px; border-radius: 4px;`,
};

const esc = (v) => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
const row = (cells, isHeader = false) =>
  `<tr>${cells.map(c => `<${isHeader ? "th" : "td"} style="${isHeader ? s.th : s.td}">${esc(c)}</td>`).join("")}</tr>`;
const warnRow = cells =>
  `<tr>${cells.map(c => `<td style="${s.tdWarn}">${esc(c)}</td>`).join("")}</tr>`;
const goodRow = cells =>
  `<tr>${cells.map(c => `<td style="${s.tdGood}">${esc(c)}</td>`).join("")}</tr>`;

function buildChildSummaryHtml(child, records) {
  const dob = parseISO(child.date_of_birth);
  const ageMonths = differenceInMonths(new Date(), dob);
  const ageYears  = differenceInYears(new Date(), dob);
  const ageLabel  = ageYears >= 2
    ? `${ageYears} years old`
    : `${ageMonths} months old`;
  const sex = child.sex || "male";

  // Categorise records
  const growthRecs  = records.filter(r => r.record_type === "growth").sort((a,b) => b.recorded_at.localeCompare(a.recorded_at));
  const vaccRecs    = records.filter(r => r.record_type === "vaccination");
  const visitRecs   = records.filter(r => r.record_type === "visit").sort((a,b) => b.recorded_at.localeCompare(a.recorded_at));
  const milestones  = records.filter(r => r.record_type === "development_milestone").sort((a,b) => b.recorded_at.localeCompare(a.recorded_at));
  const medications = records.filter(r => r.record_type === "medication");
  const allergies   = records.filter(r => r.record_type === "allergy_event");
  const measurements= records.filter(r => r.record_type === "measurement");
  const dentalRecs  = records.filter(r => r.record_type === "dental");
  const visionRecs  = records.filter(r => r.record_type === "vision");

  const latestGrowth = growthRecs[0];

  // ── Growth analysis
  let heightFlag = null, weightFlag = null, bmi = null;
  if (latestGrowth) {
    const refH = interpolateRef(WHO_HEIGHT, sex, ageMonths);
    const refW = interpolateRef(WHO_WEIGHT, sex, ageMonths);
    heightFlag = growthFlag(latestGrowth.height_cm, refH, 0.08);
    weightFlag = growthFlag(latestGrowth.weight_kg, refW, 0.15);
    if (ageMonths >= 24) bmi = calcBMI(latestGrowth.height_cm, latestGrowth.weight_kg);
  }

  // Velocity: last two growth records
  let heightVelocity = null;
  if (growthRecs.length >= 2) {
    const prev = growthRecs[1];
    const curr = growthRecs[0];
    const monthsDiff = differenceInMonths(parseISO(curr.recorded_at), parseISO(prev.recorded_at));
    if (monthsDiff > 0 && curr.height_cm && prev.height_cm) {
      heightVelocity = ((curr.height_cm - prev.height_cm) / monthsDiff).toFixed(1);
    }
  }

  // ── Vaccination status
  const vaxStatus = buildVaxStatus(ageMonths, vaccRecs);
  const missedVax = vaxStatus.filter(v => !v.given);
  const givenVax  = vaxStatus.filter(v => v.given);

  // ── Start HTML
  let html = `<div style="${s.page}">`;

  // Header
  html += `
    <div style="border-bottom: 2px solid #0f4c75; padding-bottom: 12px; margin-bottom: 16px;">
      <p style="${s.h1}">Child Health Summary</p>
      <p style="margin:0; color:#444;"><strong>Child:</strong> ${esc(child.full_name)}</p>
      <p style="margin:2px 0; color:#444;"><strong>Date of Birth:</strong> ${format(dob, "d MMM yyyy")} &nbsp;|&nbsp; <strong>Age:</strong> ${ageLabel} &nbsp;|&nbsp; <strong>Sex:</strong> ${sex.charAt(0).toUpperCase() + sex.slice(1)}</p>
      <p style="margin:2px 0; color:#444;"><strong>Blood Type:</strong> ${esc(child.blood_type || "Not recorded")} &nbsp;|&nbsp; <strong>Generated:</strong> ${moment().format("D MMM YYYY, h:mm A")}</p>
    </div>`;

  // ── Known Conditions & Allergies
  const hasConditions = child.known_conditions?.length > 0;
  const hasAllergies  = child.allergies?.length > 0 || allergies.length > 0;
  if (hasConditions || hasAllergies) {
    html += `<p style="${s.h2}">⚠ Medical Alerts</p>`;
    html += `<table style="${s.table}"><thead>${row(["Category", "Details"], true)}</thead><tbody>`;
    if (hasConditions) html += warnRow(["Known Conditions", child.known_conditions.join(", ")]);
    const allergyList = [...(child.allergies || []), ...allergies.map(r => r.notes || r.visit_reason).filter(Boolean)];
    if (allergyList.length) html += warnRow(["Allergies", allergyList.join(", ")]);
    html += `</tbody></table>`;
  }

  // ── Growth
  html += `<p style="${s.h2}">Growth &amp; Anthropometry</p>`;
  if (!latestGrowth) {
    html += `<p style="${s.small}">No growth records found.</p>`;
  } else {
    const refH = interpolateRef(WHO_HEIGHT, sex, ageMonths);
    const refW = interpolateRef(WHO_WEIGHT, sex, ageMonths);
    html += `<table style="${s.table}"><thead>${row(["Metric", "Latest Value", "WHO Median (age)", "Status", "Recorded"], true)}</thead><tbody>`;

    if (latestGrowth.height_cm != null) {
      const flag = heightFlag;
      const r = flag === "below" ? warnRow : flag === "above" ? (c => `<tr>${c.map(x=>`<td style="${s.tdWarn}">${x}</td>`).join("")}</tr>`) : goodRow;
      html += r([
        "Height",
        `${latestGrowth.height_cm} cm`,
        refH ? `${refH.toFixed(1)} cm` : "—",
        flag === "below" ? "↓ Below median" : flag === "above" ? "↑ Above median" : "✓ Within range",
        format(parseISO(latestGrowth.recorded_at), "d MMM yyyy"),
      ]);
    }
    if (latestGrowth.weight_kg != null) {
      const flag = weightFlag;
      const r = flag === "below" ? warnRow : flag === "above" ? (c => `<tr>${c.map(x=>`<td style="${s.tdWarn}">${x}</td>`).join("")}</tr>`) : goodRow;
      html += r([
        "Weight",
        `${latestGrowth.weight_kg} kg`,
        refW ? `${refW.toFixed(1)} kg` : "—",
        flag === "below" ? "↓ Below median" : flag === "above" ? "↑ Above median" : "✓ Within range",
        format(parseISO(latestGrowth.recorded_at), "d MMM yyyy"),
      ]);
    }
    if (latestGrowth.head_circumference_cm != null && ageMonths <= 36) {
      html += row(["Head Circumference", `${latestGrowth.head_circumference_cm} cm`, "—", "Recorded", format(parseISO(latestGrowth.recorded_at), "d MMM yyyy")]);
    }
    if (bmi != null) {
      const bmiNum = parseFloat(bmi);
      const bmiFlag = bmiNum < 14 ? "↓ Underweight" : bmiNum < 17 ? "✓ Normal" : bmiNum < 19 ? "↑ Overweight" : "↑↑ Obese";
      const bmiRow = bmiNum >= 17 && bmiNum < 19 ? row : bmiNum < 14 || bmiNum >= 19 ? warnRow : goodRow;
      html += bmiRow(["BMI", `${bmi} kg/m²`, "—", bmiFlag, format(parseISO(latestGrowth.recorded_at), "d MMM yyyy")]);
    }
    if (heightVelocity) {
      html += row(["Height Velocity", `${heightVelocity} cm/month`, "—", parseFloat(heightVelocity) >= 0.3 ? "✓ Growing" : "↓ Slow", "Calculated"]);
    }
    html += `</tbody></table>`;
    if (growthRecs.length > 1) {
      html += `<p style="${s.small}">${growthRecs.length} growth records total. Showing latest measurement.</p>`;
    }
  }

  // ── Vaccination
  html += `<p style="${s.h2}">Vaccination Status (Singapore NCIS)</p>`;
  if (vaxStatus.length === 0) {
    html += `<p style="${s.small}">No vaccinations due at this age yet.</p>`;
  } else {
    html += `<table style="${s.table}"><thead>${row(["Vaccine", "Due At", "Status"], true)}</thead><tbody>`;
    vaxStatus.forEach(v => {
      const dueLabel = v.dueMonths < 12 ? `${v.dueMonths}m` : v.dueMonths < 24 ? `${v.dueMonths}m` : `${Math.floor(v.dueMonths/12)}y`;
      if (v.given) {
        html += goodRow([v.name, dueLabel, "✓ Given"]);
      } else {
        html += warnRow([v.name, dueLabel, "⚠ Not recorded"]);
      }
    });
    html += `</tbody></table>`;
    html += `<p style="${s.small}">"Not recorded" means not logged in this app — consult your child's health booklet. ${givenVax.length}/${vaxStatus.length} vaccines recorded.</p>`;
  }

  // ── Development Milestones
  if (milestones.length > 0) {
    html += `<p style="${s.h2}">Developmental Milestones</p>`;
    html += `<table style="${s.table}"><thead>${row(["Milestone", "Date Recorded"], true)}</thead><tbody>`;
    milestones.slice(0, 10).forEach(m => {
      html += goodRow([m.milestone_description || "Milestone", format(parseISO(m.recorded_at), "d MMM yyyy")]);
    });
    html += `</tbody></table>`;
  }

  // ── Recent Doctor Visits
  if (visitRecs.length > 0) {
    html += `<p style="${s.h2}">Recent Doctor Visits</p>`;
    html += `<table style="${s.table}"><thead>${row(["Date", "Reason", "Doctor / Clinic", "Notes"], true)}</thead><tbody>`;
    visitRecs.slice(0, 8).forEach(v => {
      html += row([
        format(parseISO(v.recorded_at), "d MMM yyyy"),
        v.visit_reason || "General visit",
        [v.doctor_name, v.clinic_name].filter(Boolean).join(", ") || "—",
        v.notes ? v.notes.slice(0, 80) + (v.notes.length > 80 ? "…" : "") : "—",
      ]);
    });
    html += `</tbody></table>`;
  }

  // ── Active Medications
  if (medications.length > 0) {
    html += `<p style="${s.h2}">Medications</p>`;
    html += `<table style="${s.table}"><thead>${row(["Medication", "Notes", "Date"], true)}</thead><tbody>`;
    medications.forEach(m => {
      html += row([m.notes || "—", m.visit_reason || "—", format(parseISO(m.recorded_at), "d MMM yyyy")]);
    });
    html += `</tbody></table>`;
  }

  // ── Measurements (vitals)
  if (measurements.length > 0) {
    const msByType = {};
    measurements.forEach(m => {
      if (!msByType[m.measurement_type]) msByType[m.measurement_type] = [];
      msByType[m.measurement_type].push(m);
    });
    html += `<p style="${s.h2}">Clinical Measurements</p>`;
    html += `<table style="${s.table}"><thead>${row(["Measurement", "Latest Value", "Date"], true)}</thead><tbody>`;
    Object.entries(msByType).forEach(([type, entries]) => {
      const latest = entries.sort((a,b) => b.recorded_at.localeCompare(a.recorded_at))[0];
      const val = latest.measurement_value_secondary
        ? `${latest.measurement_value} / ${latest.measurement_value_secondary}`
        : `${latest.measurement_value}`;
      html += row([type.replace(/_/g," "), `${val}${latest.measurement_unit ? " " + latest.measurement_unit : ""}`, format(parseISO(latest.recorded_at), "d MMM yyyy")]);
    });
    html += `</tbody></table>`;
  }

  // ── Dental & Vision
  const dvRows = [...dentalRecs.slice(0,3), ...visionRecs.slice(0,3)];
  if (dvRows.length > 0) {
    html += `<p style="${s.h2}">Dental &amp; Vision</p>`;
    html += `<table style="${s.table}"><thead>${row(["Type", "Notes", "Date"], true)}</thead><tbody>`;
    dvRows.forEach(r2 => {
      html += row([r2.record_type.charAt(0).toUpperCase() + r2.record_type.slice(1), r2.notes || "—", format(parseISO(r2.recorded_at), "d MMM yyyy")]);
    });
    html += `</tbody></table>`;
  }

  // ── Transfer Status
  if (child.status !== "active") {
    html += `<p style="${s.h2}">Care Transfer Status</p>`;
    html += `<table style="${s.table}"><tbody>`;
    html += row(["Status", child.status === "transfer_initiated" ? "⏳ Transfer Initiated — awaiting acceptance" : "✓ Transferred to own account"]);
    if (child.transfer_to_email) html += row(["Transfer Email", child.transfer_to_email]);
    if (child.transfer_initiated_at) html += row(["Initiated At", moment(child.transfer_initiated_at).format("D MMM YYYY")]);
    html += `</tbody></table>`;
  }

  // ── Disclaimer
  html += `<div style="${s.disclaimer}">
    <strong>Disclaimer:</strong> This is a factual summary of data recorded in Unified Medical Record. Growth comparisons use simplified WHO median references and are for screening awareness only — they do not constitute a clinical diagnosis. Vaccination status reflects records entered in this app only; please cross-reference with your child's official health booklet. Always consult a paediatrician for clinical decisions.
  </div>`;

  html += `<p style="text-align:center; font-size:10px; color:#999; margin-top:16px;">Generated by Unified Medical Record · A MedNex Pte Ltd project · ${moment().format("D MMM YYYY")}</p>`;
  html += `</div>`;

  return html;
}

export default function ChildHealthSummary({ child }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryHtml, setSummaryHtml] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setSummaryHtml(null);
      const data = await base44.entities.ChildHealthRecord.filter({ child_id: child.id }, "-recorded_at", 200);
      setRecords(data);
      setLoading(false);
    })();
  }, [child.id]);

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      setSummaryHtml(buildChildSummaryHtml(child, records));
      setGenerating(false);
    }, 200);
  };

  const handlePrint = () => {
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>Child Health Summary – ${esc(child.full_name)}</title></head><body style="padding:40px; max-width:800px; margin:0 auto;">${summaryHtml}</body></html>`);
    w.document.close();
    w.print();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-teal-600" /></div>;

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: "Growth Records",  count: records.filter(r => r.record_type === "growth").length },
          { label: "Vaccinations",    count: records.filter(r => r.record_type === "vaccination").length },
          { label: "Visits",          count: records.filter(r => r.record_type === "visit").length },
          { label: "Milestones",      count: records.filter(r => r.record_type === "development_milestone").length },
          { label: "Measurements",    count: records.filter(r => r.record_type === "measurement").length },
          { label: "Medications",     count: records.filter(r => r.record_type === "medication").length },
        ].map(s2 => (
          <div key={s2.label} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <p className="text-2xl font-bold text-slate-800">{s2.count}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">{s2.label}</p>
          </div>
        ))}
      </div>

      {/* Generate button */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800">Algorithmic Health Summary</h3>
          <p className="text-sm text-slate-400 mt-0.5">Growth vs WHO medians, vaccination schedule check, milestones &amp; recent visits</p>
        </div>
        <div className="flex gap-2">
          {summaryHtml && (
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 rounded-lg">
              <Printer className="w-4 h-4" /> Print
            </Button>
          )}
          <Button
            size="sm"
            onClick={generate}
            disabled={generating}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 rounded-lg"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {summaryHtml ? "Regenerate" : "Generate Summary"}
          </Button>
        </div>
      </div>

      {/* Rendered report */}
      {summaryHtml && (
        <div
          className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: summaryHtml }}
        />
      )}
    </div>
  );
}