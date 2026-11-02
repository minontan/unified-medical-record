import { useState } from "react";
import {
  Activity, TestTube2, FolderHeart, Pill, CalendarCheck,
  PersonStanding, Bone, ArrowLeft, HeartHandshake, LockKeyhole
} from "lucide-react";
import CaregiverPatientSection from "./CaregiverPatientSection";

const PERMISSION_TO_SECTION = [
  {
    key: "measurements_read",
    dataType: "measurements",
    label: "Measurements",
    icon: Activity,
    color: "bg-blue-50 text-blue-600 border-blue-100",
    description: "Blood pressure, glucose, cholesterol",
  },
  {
    key: "lab_results_read",
    dataType: "lab_results",
    label: "Lab Results",
    icon: TestTube2,
    color: "bg-teal-50 text-teal-600 border-teal-100",
    description: "Blood tests and pathology reports",
  },
  {
    key: "medical_documents_read",
    dataType: "medical_documents",
    label: "Medical Documents",
    icon: FolderHeart,
    color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    description: "Radiology, ECG, referrals",
  },
  {
    key: "medications_read",
    dataType: "medications",
    label: "Medications",
    icon: Pill,
    color: "bg-amber-50 text-amber-600 border-amber-100",
    description: "Current & past medications, allergies",
  },
  {
    key: "appointments_read",
    dataType: "appointments",
    label: "Appointments",
    icon: CalendarCheck,
    color: "bg-green-50 text-green-600 border-green-100",
    description: "Consultations and follow-ups",
  },
  {
    key: "womens_health_read",
    dataType: "womens_health",
    label: "Women's Health",
    icon: PersonStanding,
    color: "bg-pink-50 text-pink-600 border-pink-100",
    description: "Menstrual, pregnancy & immunisations",
  },
  {
    key: "msk_read",
    dataType: "msk",
    label: "Bone & Muscle",
    icon: Bone,
    color: "bg-orange-50 text-orange-600 border-orange-100",
    description: "BMD, sarcopenia & frailty assessments",
  },
];

const WRITE_LABELS = {
  measurements_write: "Can log measurements",
  lab_results_write: "Can upload lab results",
  medical_documents_write: "Can upload documents",
  medications_write: "Can manage medications",
  appointments_write: "Can book appointments",
  womens_health_write: "Can log women's health",
  msk_write: "Can add MSK assessments",
};

export default function CaregiverDashboard({ patient, onBack }) {
  const [activeSection, setActiveSection] = useState(null); // { dataType, canWrite }

  const permissions = patient.caregiver_permissions || [];
  const patientEmail = patient.patient_email || patient.user_email;
  const initial = patientEmail.charAt(0).toUpperCase();

  const allowedSections = PERMISSION_TO_SECTION.filter(s => permissions.includes(s.key));
  const lockedSections = PERMISSION_TO_SECTION.filter(s => !permissions.includes(s.key));
  const writePerms = permissions.filter(p => p.endsWith("_write"));

  // Show inline section view
  if (activeSection) {
    return (
      <CaregiverPatientSection
        patientEmail={patientEmail}
        sectionKey={activeSection.dataType}
        canWrite={activeSection.canWrite}
        onBack={() => setActiveSection(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold shadow-sm">
            {initial}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{patientEmail}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-violet-400" />
              Caregiver dashboard — {allowedSections.length} section{allowedSections.length !== 1 ? "s" : ""} accessible
            </p>
          </div>
        </div>
      </div>

      {/* Write permissions summary */}
      {writePerms.length > 0 && (
        <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-violet-600 mr-1">Your write access:</span>
          {writePerms.map(p => (
            <span key={p} className="text-[11px] bg-white border border-violet-200 text-violet-700 px-2 py-0.5 rounded-full font-medium">
              {WRITE_LABELS[p] || p}
            </span>
          ))}
        </div>
      )}

      {/* Accessible sections */}
      {allowedSections.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Accessible Health Sections</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allowedSections.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.key}
                  onClick={() => setActiveSection({ dataType: section.dataType, canWrite: false })}
                  className="group text-left flex flex-col gap-3 p-4 rounded-2xl border bg-white hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${section.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{section.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{section.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked sections */}
      {lockedSections.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Restricted Sections</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {lockedSections.map(section => {
              const Icon = section.icon;
              return (
                <div
                  key={section.key}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 opacity-50"
                >
                  <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-500 font-medium">{section.label}</span>
                  <LockKeyhole className="w-3 h-3 text-slate-300 ml-auto flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}