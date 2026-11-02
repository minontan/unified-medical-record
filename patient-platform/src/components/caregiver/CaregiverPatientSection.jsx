/**
 * Renders a specific patient data section inline for a caregiver.
 * Fetches data via the getCaregiverPatientData backend function (service role, bypasses RLS).
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle, ArrowLeft, TestTube2, FolderHeart, Activity, Pill, CalendarCheck, PersonStanding, Bone } from "lucide-react";
import { format } from "date-fns";
import LabHistoryList from "@/components/labresults/LabHistoryList";
import MedicalDocCard from "@/components/medicaldocs/MedicalDocCard";

const SECTION_META = {
  lab_results:       { label: "Lab Results",       icon: TestTube2,      color: "text-teal-600"   },
  medical_documents: { label: "Medical Documents",  icon: FolderHeart,    color: "text-indigo-600" },
  measurements:      { label: "Measurements",       icon: Activity,       color: "text-blue-600"   },
  medications:       { label: "Medications",        icon: Pill,           color: "text-amber-600"  },
  appointments:      { label: "Appointments",       icon: CalendarCheck,  color: "text-green-600"  },
  womens_health:     { label: "Women's Health",     icon: PersonStanding, color: "text-pink-600"   },
  msk:               { label: "Bone & Muscle",      icon: Bone,           color: "text-orange-600" },
};

// ── Simple read-only renderers ────────────────────────────────────────────────

function MeasurementsList({ data }) {
  if (!data.length) return <Empty />;
  return (
    <div className="space-y-2">
      {data.map(m => (
        <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-800 capitalize">{m.measurement_type?.replace(/_/g, ' ')}</p>
            <p className="text-xs text-slate-400">{m.measured_at ? format(new Date(m.measured_at), 'd MMM yyyy') : '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">
              {m.value_primary}{m.value_secondary != null ? `/${m.value_secondary}` : ''} <span className="font-normal text-slate-400 text-xs">{m.unit}</span>
            </p>
            {m.notes && <p className="text-[11px] text-slate-400 mt-0.5">{m.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function MedicationsList({ data }) {
  if (!data.length) return <Empty />;
  return (
    <div className="space-y-2">
      {data.map(m => (
        <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">{m.medication_name}</p>
              <p className="text-xs text-slate-500">{m.dosage}{m.frequency ? ` · ${m.frequency}` : ''}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${m.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {m.is_active ? 'Active' : 'Stopped'}
            </span>
          </div>
          {m.prescribing_doctor && <p className="text-[11px] text-slate-400 mt-1">Dr. {m.prescribing_doctor}</p>}
        </div>
      ))}
    </div>
  );
}

function AppointmentsList({ data }) {
  if (!data.length) return <Empty />;
  return (
    <div className="space-y-2">
      {data.map(a => (
        <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-sm font-semibold text-slate-800">{a.doctor_name}</p>
          <p className="text-xs text-slate-500">{a.appointment_date ? format(new Date(a.appointment_date), 'd MMM yyyy, HH:mm') : '—'}</p>
          {a.reason && <p className="text-[11px] text-slate-400 mt-0.5">{a.reason}</p>}
          <span className={`mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full font-medium capitalize
            ${a.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700'
            : a.status === 'cancelled' ? 'bg-red-100 text-red-600'
            : 'bg-slate-100 text-slate-500'}`}>{a.status}</span>
        </div>
      ))}
    </div>
  );
}

function GenericList({ data, labelFn, subFn }) {
  if (!data.length) return <Empty />;
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={item.id || i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-sm text-slate-700">{labelFn(item)}</p>
          {subFn && <p className="text-xs text-slate-400 mt-0.5">{subFn(item)}</p>}
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-slate-400 text-center py-8">No records found for this patient.</p>;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CaregiverPatientSection({ patientEmail, sectionKey, onBack, canWrite = false }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const meta = SECTION_META[sectionKey] || { label: sectionKey, icon: Activity, color: "text-slate-600" };
  const Icon = meta.icon;

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await base44.functions.invoke('getCaregiverPatientData', {
          patient_email: patientEmail,
          data_type: sectionKey,
        });
        // res is axios response; actual payload is in res.data
        const payload = res.data;
        if (payload?.error) {
          setError(payload.error);
        } else {
          setData(payload?.data || []);
        }
      } catch (e) {
        // Axios error — extract message from response body if present
        const msg = e.response?.data?.error || e.message || 'Failed to load patient data.';
        setError(msg);
      }
      setLoading(false);
    })();
  }, [patientEmail, sectionKey]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <Icon className={`w-5 h-5 ${meta.color}`} />
          <div>
            <h3 className="text-base font-bold text-slate-900">{meta.label}</h3>
            <p className="text-xs text-slate-400">{patientEmail}</p>
          </div>
        </div>
      </div>

      {/* Access notice */}
      <div className={`px-3 py-2 rounded-xl border ${canWrite ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
        <p className={`text-[11px] ${canWrite ? 'text-blue-700' : 'text-amber-700'}`}>
          {canWrite
            ? 'You have read & write access to this section as a caregiver.'
            : 'You are viewing this data as a caregiver. Records are read-only.'}
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {sectionKey === 'lab_results' && (
            <LabHistoryList results={data} onDelete={() => {}} onDateChange={() => {}} onResultsUpdate={() => {}} />
          )}
          {sectionKey === 'medical_documents' && (
            <div className="space-y-3">
              {data.length === 0 ? <Empty /> : data.map(doc => (
                <MedicalDocCard key={doc.id} doc={doc} onDelete={() => {}} readOnly />
              ))}
            </div>
          )}
          {sectionKey === 'measurements' && <MeasurementsList data={data} />}
          {sectionKey === 'medications' && <MedicationsList data={data} />}
          {sectionKey === 'appointments' && <AppointmentsList data={data} />}
          {sectionKey === 'womens_health' && (
            <GenericList
              data={data}
              labelFn={item => item.log_type ? item.log_type.replace(/_/g, ' ') : 'Health log'}
              subFn={item => item.created_date ? format(new Date(item.created_date), 'd MMM yyyy') : ''}
            />
          )}
          {sectionKey === 'msk' && (
            <GenericList
              data={data}
              labelFn={item => `Assessment — Age ${item.age || '?'}`}
              subFn={item => item.assessed_at ? format(new Date(item.assessed_at), 'd MMM yyyy') : ''}
            />
          )}
        </>
      )}
    </div>
  );
}