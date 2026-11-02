import { Star, MapPin, Phone, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const specialtyLabels = {
  general_practitioner: "General Practitioner",
  cardiologist: "Cardiologist",
  endocrinologist: "Endocrinologist",
  internist: "Internist",
  nephrologist: "Nephrologist",
  dietitian: "Dietitian",
  other: "Specialist",
};

export default function DoctorCard({ doctor, onBook }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-md hover:shadow-slate-100 transition-all">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center text-teal-600 font-bold text-xl shrink-0 border border-teal-100">
          {doctor.name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{doctor.name}</h3>
              <p className="text-xs text-teal-600 font-medium">{specialtyLabels[doctor.specialty] || doctor.specialty}</p>
            </div>
            {doctor.accepts_new_patients && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full shrink-0">
                <CheckCircle className="w-3 h-3" /> Accepting
              </span>
            )}
          </div>

          {doctor.clinic_name && (
            <p className="text-sm text-slate-500 mt-2">{doctor.clinic_name}</p>
          )}

          <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-400">
            {doctor.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {doctor.city || doctor.address}
              </span>
            )}
            {doctor.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> {doctor.phone}
              </span>
            )}
            {doctor.rating && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400" fill="#fbbf24" /> {doctor.rating.toFixed(1)}
              </span>
            )}
          </div>

          {doctor.bio && (
            <p className="text-sm text-slate-400 mt-3 line-clamp-2">{doctor.bio}</p>
          )}

          <div className="mt-4">
            <Button
              onClick={() => onBook(doctor)}
              className="h-9 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-5"
            >
              Request Appointment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}