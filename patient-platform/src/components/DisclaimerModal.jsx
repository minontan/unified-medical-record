// TODO(i18n): disclaimer strings below are hardcoded English. Translated `disclaimer.*` keys
// exist in all 11 locale files but are not yet consumed - wire useTranslation before
// relying on localized consent text.
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, Lock, FlaskConical, CheckCircle2, Brain, Pill, Baby } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Bump this version string whenever there's a meaningful app update
// that warrants re-acceptance of the disclaimer.
const DISCLAIMER_VERSION = "v3.0-2026-04";

export default function DisclaimerModal() {
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (!authed) return;
      const user = await base44.auth.me();
      const email = user?.email;
      setUserEmail(email);

      // Key is per-user + per-version: forces re-acceptance on new version OR new login from different user
      const key = `umr_disclaimer_${DISCLAIMER_VERSION}_${email}`;
      const accepted = sessionStorage.getItem(key);
      if (!accepted) setOpen(true);
    });
  }, []);

  const handleAccept = () => {
    if (userEmail) {
      const key = `umr_disclaimer_${DISCLAIMER_VERSION}_${userEmail}`;
      // sessionStorage: clears on tab/browser close, so requires acceptance each new session (login)
      sessionStorage.setItem(key, "true");
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-t-2xl px-6 py-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Welcome to Unified Medical Record</h2>
              <p className="text-teal-100 text-xs mt-0.5">Please read and acknowledge before continuing</p>
            </div>
            <span className="ml-auto text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">{DISCLAIMER_VERSION}</span>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="px-6 py-5 space-y-3 overflow-y-auto flex-1">

          <DisclaimerItem
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
            bg="bg-amber-50 border-amber-200"
            title="Not a substitute for medical advice"
            text="Unified Medical Record is a personal health tracking and information tool. It does not replace the advice, diagnosis, or treatment of a qualified healthcare professional. Always consult your doctor or pharmacist before making any health or medication decisions."
          />

          <DisclaimerItem
            icon={<AlertTriangle className="w-4 h-4 text-orange-500" />}
            bg="bg-orange-50 border-orange-200"
            title="Algorithmically generated insights"
            text="Cardiometabolic insights, cancer screening recommendations, MSK risk classifications, and clinical pearls are generated algorithmically from published guidelines (AHA, ADA, ACC, ESC, USPSTF, WHO, Singapore MOH, Malaysia CPG). They are informational only and may not reflect your complete clinical picture. Discuss all findings with your healthcare provider."
          />

          <DisclaimerItem
            icon={<Brain className="w-4 h-4 text-violet-500" />}
            bg="bg-violet-50 border-violet-200"
            title="Digital Human Twin — Experimental Feature"
            text="The Predictive Twin and its trajectory models, risk scores, and AI-generated insights are experimental and currently under active development. Predictions are mathematical projections only and carry inherent uncertainty. They have not been validated in a clinical trial and must not be used to make clinical or treatment decisions."
          />

          <DisclaimerItem
            icon={<Pill className="w-4 h-4 text-teal-600" />}
            bg="bg-teal-50 border-teal-200"
            title="Medications & Allergies"
            text="Allergy information in Unified Medical Record is self-reported for personal reference only. Unified Medical Record does not perform drug-allergy interaction screening. Always verify your allergy and medication information with a licensed pharmacist or prescribing physician before any clinical decision."
          />

          <DisclaimerItem
            icon={<Baby className="w-4 h-4 text-sky-500" />}
            bg="bg-sky-50 border-sky-200"
            title="Family Hub & Children's Health"
            text="Child health records, vaccination data, and milestone tracking in Unified Medical Record are informational tools for parental reference only. Vaccination schedules shown are for general guidance and may differ from national immunisation programmes in your country. Always consult a paediatrician or child health nurse."
          />

          <DisclaimerItem
            icon={<Lock className="w-4 h-4 text-teal-600" />}
            bg="bg-teal-50 border-teal-200"
            title="Your privacy is protected"
            text="Your health data is stored privately and securely. Only you can access your records unless you explicitly grant access via Caregiver Access. We do not share your data with third parties."
          />

          <DisclaimerItem
            icon={<FlaskConical className="w-4 h-4 text-slate-400" />}
            bg="bg-slate-50 border-slate-200"
            title="Some features are in development"
            text="The Find Doctors, Pharmacies, Diagnostic Centres directories, and the Digital Twin Predictive Engine are actively being built. Information shown in these sections is for demonstration purposes only and should not be used to make real-world healthcare decisions."
          />

          <DisclaimerItem
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            bg="bg-emerald-50 border-emerald-200"
            title="Use as a guide, not a diagnosis"
            text="This app is designed to help you organise, track, and better understand your health data — not to diagnose or treat any condition. If you experience a medical emergency, contact emergency services immediately."
          />
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 flex-shrink-0 border-t border-slate-100">
          <Button
            onClick={handleAccept}
            className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold"
          >
            I understand and agree to continue
          </Button>
          <p className="text-center text-[10px] text-slate-400 mt-3">
            By continuing, you acknowledge that Unified Medical Record is a health management aid and not a clinical service. This acknowledgement is required each session and whenever the app is updated.
          </p>
        </div>
      </div>
    </div>
  );
}

function DisclaimerItem({ icon, bg, title, text }) {
  return (
    <div className={`flex gap-3 p-3.5 rounded-xl border ${bg}`}>
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}