import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import ConditionCard from "@/components/dashboard/ConditionCard";
import QuickStats from "@/components/dashboard/QuickStats";
import { Plus, ArrowRight, Loader2, Pill, PersonStanding, TestTube2, AlertCircle, FolderHeart, Bone } from "lucide-react";
import CardiometabolicAlertWidget from "@/components/dashboard/CardiometabolicAlertWidget";
import AllergiesWidget from "@/components/dashboard/AllergiesWidget";
import { Button } from "@/components/ui/button";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { getLabStatus } from "@/lib/labStatus";

export default function Dashboard() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [medications, setMedications] = useState([]);
  const [womensLogs, setWomensLogs] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [medDocs, setMedDocs] = useState([]);
  const [mskAssessments, setMskAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.isAuthenticated().then((isAuth) => {
      if (!isAuth) {
        window.location.href = createPageUrl("Landing");
      } else {
        loadData();
      }
    });
  }, []);

  const loadData = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const [m, a, g, meds, wl, lr, mdocs, msk] = await Promise.all([
      base44.entities.HealthMeasurement.filter({ created_by: u.email }, "-measured_at", 50),
      base44.entities.Appointment.filter({ created_by: u.email }, "-appointment_date", 10),
      base44.entities.SupportGroup.list("-created_date", 50),
      base44.entities.Medication.filter({ created_by: u.email, is_active: true }, "-created_date", 20),
      base44.entities.WomensHealthLog.filter({ created_by: u.email }, "-logged_at", 10),
      base44.entities.LabResult.filter({ created_by: u.email }, "-collected_at", 20),
      base44.entities.MedicalDocument.filter({ created_by: u.email }, "-report_date", 10),
      base44.entities.MusculoskeletalAssessment.filter({ created_by: u.email }, "-assessed_at", 5),
    ]);
    setMeasurements(m);
    setAppointments(a);
    const myGroups = g.filter((gr) => gr.member_emails?.includes(u.email) || gr.created_by === u.email);
    setGroups(myGroups);
    setMedications(meds);
    setWomensLogs(wl);
    setLabResults(lr);
    setMedDocs(mdocs);
    setMskAssessments(msk);
    setLoading(false);
  };

  const getLatestByCondition = (condition, types) => {
    const filtered = measurements.filter((m) => types.includes(m.measurement_type));
    if (!filtered.length) return { value: null };
    const latest = filtered[0];
    const val = latest.measurement_type === "blood_pressure"
      ? `${latest.value_primary}/${latest.value_secondary}`
      : latest.value_primary;
    return { value: val, unit: latest.unit };
  };

  // Deduplicate: keep only the most recent result per test_name
  const recentLabResults = (() => {
    const seen = new Set();
    return labResults.filter((r) => {
      if (seen.has(r.test_name)) return false;
      seen.add(r.test_name);
      return true;
    }).slice(0, 6);
  })();

  const outOfRangeCount = recentLabResults.filter((r) => ["low", "high"].includes(getLabStatus(r))).length;

  const upcomingAppts = appointments.filter(
    (a) => a.status !== "cancelled" && moment(a.appointment_date).isAfter(moment())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  const bp = getLatestByCondition("hypertension", ["blood_pressure"]);
  const glucose = getLatestByCondition("diabetes", ["blood_glucose"]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <img
            src="/logo.png"
            alt="Unified Medical Record"
            className="h-10 w-auto mb-3"
          />
          <p className="text-sm text-teal-600 font-medium mb-1">{t('dashboard.welcome')}</p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {user?.full_name || "there"} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">{t('dashboard.quickStats')}</p>
        </div>
        <Link to={createPageUrl("Measurements")}>
          <Button className="h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 px-5">
            <Plus className="w-4 h-4" /> {t('measurements.addMeasurement')}
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <QuickStats
        measurementCount={measurements.length}
        appointmentCount={upcomingAppts.length}
        groupCount={groups.length}
        medicationCount={medications.length}
      />

      {/* Condition Cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">{t('dashboard.recentMeasurements')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to={createPageUrl("Measurements") + "?condition=hypertension"}>
            <ConditionCard
              condition="hypertension"
              latestValue={bp.value}
              unit={bp.unit}
            />
          </Link>
          <Link to={createPageUrl("Measurements") + "?condition=diabetes"}>
            <ConditionCard
              condition="diabetes"
              latestValue={glucose.value}
              unit={glucose.unit}
            />
          </Link>
        </div>
      </div>

      {/* Cardiometabolic Insights Widget */}
      <CardiometabolicAlertWidget />

      {/* Recent Lab Results */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
              <TestTube2 className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-700">{t('labResults.title')}</h2>
              {outOfRangeCount > 0 && (
                <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {outOfRangeCount} result{outOfRangeCount > 1 ? "s" : ""} outside range
                </p>
              )}
            </div>
          </div>
          <Link to={createPageUrl("LabResults")} className="text-xs text-teal-600 font-medium flex items-center gap-1 hover:text-teal-700">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentLabResults.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-slate-400 mb-2">No lab results yet</p>
            <Link to={createPageUrl("LabResults")}>
              <Button variant="outline" className="rounded-xl text-xs h-8">Upload a Report</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {recentLabResults.map((r) => {
              const status = getLabStatus(r);
              const statusStyle = status === "low" ? "text-blue-600 bg-blue-50" : status === "high" ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50";
              const statusLabel = status === "low" ? "Below range" : status === "high" ? "Above range" : status === "text" ? "" : "Normal";
              return (
                <div key={r.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] text-slate-400 truncate mb-0.5">{r.test_name}</p>
                  <p className="text-base font-bold text-slate-800 leading-tight">
                    {r.numeric_result != null ? r.numeric_result : r.text_result}
                    {r.unit && <span className="text-xs font-normal text-slate-400 ml-1">{r.unit}</span>}
                  </p>
                  {statusLabel && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusStyle}`}>{statusLabel}</span>
                  )}
                  <p className="text-[10px] text-slate-300 mt-1">{r.collected_at ? moment(r.collected_at).format("D MMM YYYY") : ""}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Medications & Women's Health Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Medications */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Pill className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700">{t('medications.currentMedications')}</h2>
            </div>
            <Link to={createPageUrl("Medications")} className="text-xs text-teal-600 font-medium flex items-center gap-1 hover:text-teal-700">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {medications.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-3">No active medications</p>
          ) : (
            <div className="space-y-2">
              {medications.slice(0, 4).map((med) => (
                <div key={med.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{med.medication_name}</p>
                    <p className="text-xs text-slate-400">{med.dosage}{med.frequency ? ` · ${med.frequency}` : ""}</p>
                  </div>
                  {med.condition && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 uppercase tracking-wide whitespace-nowrap">
                      {med.condition}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Women's Health */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
                <PersonStanding className="w-4 h-4 text-pink-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700">{t('womensHealth.title')}</h2>
            </div>
            <Link to={createPageUrl("WomensHealth")} className="text-xs text-teal-600 font-medium flex items-center gap-1 hover:text-teal-700">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {womensLogs.length === 0 ? (
            <div className="text-center py-3">
              <p className="text-sm text-slate-400 mb-2">No entries logged yet</p>
              <Link to={createPageUrl("WomensHealth")}>
                <Button variant="outline" className="rounded-xl text-xs h-8">Start Tracking</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {womensLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 capitalize">
                      {log.log_type.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-slate-400">{moment(log.logged_at).format("MMM D, YYYY")}</p>
                  </div>
                  {log.result && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${log.result === "positive" ? "bg-pink-50 text-pink-600" : "bg-slate-100 text-slate-500"}`}>
                      {log.result}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MSK & Medical Documents quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bone, Muscle & Frailty */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Bone className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700">{t('musculoskeletal.title')}</h2>
            </div>
            <Link to="/MusculoskeletalHealth" className="text-xs text-teal-600 font-medium flex items-center gap-1 hover:text-teal-700">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {mskAssessments.length === 0 ? (
            <div className="text-center py-3">
              <p className="text-sm text-slate-400 mb-2">No assessments yet</p>
              <Link to="/MusculoskeletalHealth">
                <Button variant="outline" className="rounded-xl text-xs h-8">Start Assessment</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {mskAssessments.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {a.bmd_tscore != null ? `T-score: ${a.bmd_tscore}` : "MSK Assessment"}
                    </p>
                    <p className="text-xs text-slate-400">{moment(a.assessed_at).format("D MMM YYYY")}</p>
                  </div>
                  {a.bmd_tscore != null && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${a.bmd_tscore >= -1 ? "bg-emerald-50 text-emerald-600" : a.bmd_tscore >= -2.5 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
                      {a.bmd_tscore >= -1 ? "Normal" : a.bmd_tscore >= -2.5 ? "Osteopenia" : "Osteoporosis"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medical Documents */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <FolderHeart className="w-4 h-4 text-teal-600" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700">{t('nav.medicalDocuments')}</h2>
            </div>
            <Link to="/MedicalDocuments" className="text-xs text-teal-600 font-medium flex items-center gap-1 hover:text-teal-700">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {medDocs.length === 0 ? (
            <div className="text-center py-3">
              <p className="text-sm text-slate-400 mb-2">No documents uploaded yet</p>
              <Link to="/MedicalDocuments">
                <Button variant="outline" className="rounded-xl text-xs h-8">Upload a Report</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {medDocs.slice(0, 4).map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{doc.title}</p>
                    <p className="text-xs text-slate-400 capitalize">{doc.doc_type.replace(/_/g," ")} · {moment(doc.report_date).format("D MMM YYYY")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Allergies */}
      <AllergiesWidget />

      {/* Upcoming Appointments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{t('appointments.upcoming')}</h2>
          <Link to={createPageUrl("Appointments")} className="text-sm text-teal-600 font-medium flex items-center gap-1 hover:text-teal-700">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {upcomingAppts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
            <p className="text-sm text-slate-400">No upcoming appointments</p>
            <Link to={createPageUrl("Doctors")}>
              <Button variant="outline" className="mt-3 rounded-xl text-sm">Find a Doctor</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAppts.slice(0, 3).map((appt) => (
              <div key={appt.id} className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex flex-col items-center justify-center">
                  <span className="text-xs text-teal-600 font-semibold">{moment(appt.appointment_date).format("MMM")}</span>
                  <span className="text-lg font-bold text-teal-700 leading-none">{moment(appt.appointment_date).format("D")}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Dr. {appt.doctor_name}</p>
                  <p className="text-xs text-slate-400">{moment(appt.appointment_date).format("h:mm A")} · {appt.reason || "General consultation"}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                  appt.status === "confirmed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                }`}>
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}