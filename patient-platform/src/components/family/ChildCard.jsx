import { Calendar, ArrowRight } from "lucide-react";
import { differenceInYears, differenceInMonths, parseISO } from "date-fns";

const AVATAR_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"
];

export function getAgeLabel(dob) {
  const birthDate = parseISO(dob);
  const years = differenceInYears(new Date(), birthDate);
  if (years < 2) {
    const months = differenceInMonths(new Date(), birthDate);
    return `${months} month${months !== 1 ? "s" : ""}`;
  }
  return `${years} yr${years !== 1 ? "s" : ""}`;
}

const statusConfig = {
  active: null,
  transfer_initiated: { label: "Transfer Pending", color: "bg-amber-100 text-amber-700" },
  transferred: { label: "Transferred", color: "bg-slate-100 text-slate-500" }
};

export default function ChildCard({ child, isSelected, onClick, onTransfer }) {
  const color = child.avatar_color || AVATAR_COLORS[child.full_name?.charCodeAt(0) % AVATAR_COLORS.length];
  const status = statusConfig[child.status];
  const age = getAgeLabel(child.date_of_birth);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200
        ${isSelected
          ? "border-teal-400 bg-teal-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          {child.full_name?.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800 truncate">{child.full_name}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {age} · {child.sex}
          </p>
        </div>
        {status && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
            {status.label}
          </span>
        )}
        {isSelected && <ArrowRight className="w-4 h-4 text-teal-500 flex-shrink-0" />}
      </div>
    </button>
  );
}