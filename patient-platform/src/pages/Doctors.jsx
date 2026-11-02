import { Stethoscope, HardHat } from "lucide-react";

export default function Doctors() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Find a Doctor</h1>
        <p className="text-sm text-slate-400 mt-1">Browse specialists and book appointments</p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <HardHat className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">This page is under construction</p>
          <p className="text-xs text-amber-600 mt-0.5">The Find Doctors feature is not yet ready. We're working on it and it will be available soon.</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/80 p-16 text-center mt-6">
        <Stethoscope className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Coming Soon</h2>
        <p className="text-sm text-slate-400 max-w-xs">
          The doctor finder feature is currently under development. Check back soon!
        </p>
      </div>
    </div>
  );
}