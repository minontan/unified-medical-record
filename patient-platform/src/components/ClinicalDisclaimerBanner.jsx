import { AlertTriangle } from "lucide-react";

export default function ClinicalDisclaimerBanner({ guidelines }) {
  return (
    <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
      <AlertTriangle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">
          Important Notice — For Informational Use Only
        </p>
        <p className="text-[11px] text-blue-700 leading-relaxed">
          The outputs of this module are generated algorithmically by reference to internationally recognised,
          peer-reviewed clinical guidelines and evidence-based outcome parameters, including but not limited to
          those published by the{" "}
          <span className="font-semibold">{guidelines}</span>.
          These outputs are intended solely for general health information and educational purposes and{" "}
          <span className="font-semibold">do not constitute, and shall not be construed as, medical advice,
          clinical diagnosis, or a recommendation for any specific treatment, intervention, or course of action.</span>{" "}
          Individual clinical applicability may vary based on personal health history, comorbidities, concurrent
          medications, and other factors not captured herein. Users are strongly advised to consult a qualified
          and registered healthcare professional before making any health-related decisions. The platform and its
          operators expressly disclaim all liability arising from reliance on this information.
        </p>
      </div>
    </div>
  );
}