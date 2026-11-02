import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ShieldCheck, UserPlus, Loader2, Check,
  HeartHandshake, Trash2, ChevronDown, ChevronUp, ChevronRight
} from "lucide-react";
import CaregiverDashboard from "@/components/caregiver/CaregiverDashboard";

const PERMISSION_GROUPS = [
  {
    group: "Measurements & Vitals",
    permissions: [
      { key: "measurements_read",  label: "View Measurements" },
    ],
  },
  {
    group: "Lab Results",
    permissions: [
      { key: "lab_results_read",   label: "View Lab Results" },
    ],
  },
  {
    group: "Medical Documents",
    permissions: [
      { key: "medical_documents_read",  label: "View Medical Documents" },
    ],
  },
  {
    group: "Medications",
    permissions: [
      { key: "medications_read",  label: "View Medications" },
    ],
  },
  {
    group: "Appointments",
    permissions: [
      { key: "appointments_read",  label: "View Appointments" },
    ],
  },
  {
    group: "Women's Health",
    permissions: [
      { key: "womens_health_read",  label: "View Women's Health" },
    ],
  },
  {
    group: "Bone, Muscle & Frailty",
    permissions: [
      { key: "msk_read",  label: "View MSK Assessments" },
    ],
  },
];

const BUILDING_PERMISSIONS = [
  { group: "Measurements & Vitals",  key: "measurements_write",       label: "Log Measurements" },
  { group: "Lab Results",            key: "lab_results_write",        label: "Upload Lab Results" },
  { group: "Medical Documents",      key: "medical_documents_write",  label: "Upload Medical Documents" },
  { group: "Medications",            key: "medications_write",        label: "Manage Medications" },
  { group: "Appointments",           key: "appointments_write",       label: "Book Appointments" },
  { group: "Women's Health",         key: "womens_health_write",      label: "Log Women's Health" },
  { group: "Bone, Muscle & Frailty", key: "msk_write",               label: "Add MSK Assessments" },
];

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.permissions);

const DEFAULT_PERMISSIONS = [
  "measurements_read", "lab_results_read", "medical_documents_read",
  "medications_read", "appointments_read", "msk_read"
];

export default function CaregiverAccess() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Caregivers I've granted access to (I am the patient)
  const [myCaregiversGranted, setMyCaregiversGranted] = useState([]);
  // Patients who granted me caregiver access (I am the caregiver)
  const [myCaregiverOf, setMyCaregiverOf] = useState([]);
  // Pending requests sent to me as a caregiver
  const [pendingForMe, setPendingForMe] = useState([]);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermissions, setInvitePermissions] = useState(DEFAULT_PERMISSIONS);
  const [inviting, setInviting] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const u = await base44.auth.me();
    setUser(u);
    const all = await base44.entities.Connection.list("-created_date", 200);
    const caregiver = all.filter(c => c.relationship === "caregiver");

    // I am the patient (user_email = me), I invited caregivers
    setMyCaregiversGranted(caregiver.filter(c => c.user_email === u.email && c.status === "accepted"));
    // I am the caregiver (friend_email = me), accepted
    setMyCaregiverOf(caregiver.filter(c => c.friend_email === u.email && c.status === "accepted"));
    // Pending invites where I am the caregiver (friend_email = me)
    setPendingForMe(caregiver.filter(c => c.friend_email === u.email && c.status === "pending"));
    setLoading(false);
  };

  const togglePermission = (key) => {
    setInvitePermissions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    if (inviteEmail.trim().toLowerCase() === user.email.toLowerCase()) {
      toast.error("You cannot invite yourself.");
      return;
    }
    setInviting(true);

    // Check for existing caregiver relationship
    const existing = await base44.entities.Connection.list("-created_date", 200);
    const dupe = existing.find(c =>
      c.relationship === "caregiver" &&
      ((c.user_email === user.email && c.friend_email === inviteEmail.trim().toLowerCase()) ||
       (c.user_email === inviteEmail.trim().toLowerCase() && c.friend_email === user.email))
    );
    if (dupe) {
      toast.error("A caregiver relationship already exists with this person.");
      setInviting(false);
      return;
    }

    await base44.entities.Connection.create({
      user_email: user.email,
      friend_email: inviteEmail.trim().toLowerCase(),
      friend_name: inviteEmail.trim().toLowerCase(),
      status: "pending",
      relationship: "caregiver",
      patient_email: user.email,
      caregiver_email: inviteEmail.trim().toLowerCase(),
      caregiver_permissions: invitePermissions,
    });

    toast.success("Caregiver invitation sent!");
    setInviteEmail("");
    setInvitePermissions(DEFAULT_PERMISSIONS);
    setInviting(false);
    await loadData();
  };

  const handleAccept = async (conn) => {
    await base44.entities.Connection.update(conn.id, { status: "accepted" });
    toast.success("You are now a caregiver for this person.");
    await loadData();
  };

  const handleDecline = async (conn) => {
    await base44.entities.Connection.update(conn.id, { status: "declined" });
    toast.success("Request declined.");
    await loadData();
  };

  const handleRevoke = async (conn) => {
    await base44.entities.Connection.delete(conn.id);
    toast.success("Caregiver access revoked.");
    await loadData();
  };

  const permissionLabel = (key) => ALL_PERMISSIONS.find(p => p.key === key)?.label || key;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  // Show caregiver dashboard for selected patient
  if (selectedPatient) {
    return (
      <div className="max-w-3xl">
        <CaregiverDashboard patient={selectedPatient} onBack={() => setSelectedPatient(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('caregiverAccess.title')}</h1>
        <p className="text-sm text-slate-400 mt-1">
          Grant a trusted person (family member or carer) access to manage your health data, or view the patients you're caring for.
        </p>
      </div>

      {/* Pending requests where I need to respond */}
      {pendingForMe.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-amber-800 mb-3">
            Caregiver Invitations Pending Your Response ({pendingForMe.length})
          </h2>
          <div className="space-y-3">
            {pendingForMe.map(conn => (
              <div key={conn.id} className="flex items-start justify-between gap-4 bg-white rounded-xl border border-amber-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                    {conn.user_email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{conn.user_email}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Wants you to be their caregiver</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(conn.caregiver_permissions || []).map(p => (
                        <span key={p} className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full font-medium">
                          {permissionLabel(p)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button onClick={() => handleAccept(conn)} size="sm" className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs gap-1">
                    <Check className="w-3 h-3" /> Accept
                  </Button>
                  <Button onClick={() => handleDecline(conn)} size="sm" variant="outline" className="h-8 rounded-lg text-xs">
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grant access section (I am the patient) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Grant Caregiver Access</h2>
            <p className="text-xs text-slate-400">Invite someone to help manage your health data</p>
          </div>
        </div>

        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Caregiver's Email Address</label>
            <div className="flex gap-2">
              <Input
                type="email"
                required
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="caregiver@example.com"
                className="flex-1 h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Permissions selector */}
          <div>
            <button
              type="button"
              onClick={() => setShowPermissions(!showPermissions)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors"
            >
              {showPermissions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Permissions ({invitePermissions.length} selected)
            </button>

            {showPermissions && (
              <div className="mt-3 space-y-3">
                {PERMISSION_GROUPS.map(group => (
                  <div key={group.group}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">{group.group}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.permissions.map(p => (
                        <label
                          key={p.key}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-sm
                            ${invitePermissions.includes(p.key)
                              ? "border-teal-400 bg-teal-50 text-teal-800"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                        >
                          <input
                            type="checkbox"
                            checked={invitePermissions.includes(p.key)}
                            onChange={() => togglePermission(p.key)}
                            className="accent-teal-600"
                          />
                          {p.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Building permissions notice */}
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest mb-2">Coming Soon — Edit Access</p>
            <div className="flex flex-wrap gap-2">
              {BUILDING_PERMISSIONS.map(p => (
                <span key={p.key} className="flex items-center gap-1.5 text-[11px] bg-white border border-amber-200 text-amber-600 px-2.5 py-1 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  {p.label}
                  <span className="text-[9px] font-bold uppercase tracking-wide text-amber-400 ml-0.5">({p.group})</span>
                </span>
              ))}
            </div>
            <p className="text-[10px] text-amber-500 mt-2">These edit features are still being built and are not available to grant yet.</p>
          </div>

          <Button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 px-6"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Send Invitation
          </Button>
        </form>

        {/* My granted caregivers */}
        {myCaregiversGranted.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Active Caregivers</h3>
            <div className="space-y-2">
              {myCaregiversGranted.map(conn => (
                <div key={conn.id} className="flex items-start justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                      {conn.friend_email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{conn.friend_email}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(conn.caregiver_permissions || []).map(p => (
                          <span key={p} className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full font-medium">
                            {permissionLabel(p)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRevoke(conn)}
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 text-xs gap-1 h-8"
                  >
                    <Trash2 className="w-3 h-3" /> Revoke
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Patients I'm caring for (I am the caregiver) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <HeartHandshake className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Patients I'm Caring For</h2>
            <p className="text-xs text-slate-400">Select a patient to open their caregiver dashboard</p>
          </div>
        </div>

        {myCaregiverOf.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <HeartHandshake className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No one has granted you caregiver access yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myCaregiverOf.map(conn => {
              const patientEmail = conn.patient_email || conn.user_email;
              const readPerms = (conn.caregiver_permissions || []).filter(p => p.endsWith("_read"));
              return (
                <button
                  key={conn.id}
                  onClick={() => setSelectedPatient(conn)}
                  className="group text-left flex flex-col gap-3 p-5 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/60 to-purple-50/30 hover:border-violet-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-base font-bold shadow-sm">
                        {patientEmail.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 leading-tight">{patientEmail}</p>
                        <p className="text-[11px] text-violet-500 font-medium mt-0.5">
                          {readPerms.length} section{readPerms.length !== 1 ? "s" : ""} accessible
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-violet-300 group-hover:text-violet-500 transition-colors flex-shrink-0 mt-1" />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {readPerms.slice(0, 4).map(p => (
                      <span key={p} className="text-[10px] bg-white border border-violet-200 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                        {permissionLabel(p)}
                      </span>
                    ))}
                    {readPerms.length > 4 && (
                      <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">
                        +{readPerms.length - 4} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-violet-100/60">
                    <span className="text-[10px] text-slate-400">Tap to open dashboard</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRevoke(conn); }}
                      className="text-[10px] text-red-400 hover:text-red-600 font-medium transition-colors"
                    >
                      Leave
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">About Caregiver Access</p>
            <p className="text-xs text-blue-600 mt-1 leading-relaxed">
              Caregiver access lets a trusted person — such as an adult child managing an elderly parent's health — view or update specific sections of your health data. You remain in full control and can revoke access at any time. Only the sections you explicitly permit will be accessible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}