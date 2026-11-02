import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CalendarCheck, Clock, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from "moment";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

const statusConfig = {
  requested: { color: "bg-amber-50 text-amber-600 border-amber-200", label: "Requested" },
  confirmed: { color: "bg-emerald-50 text-emerald-600 border-emerald-200", label: "Confirmed" },
  completed: { color: "bg-blue-50 text-blue-600 border-blue-200", label: "Completed" },
  cancelled: { color: "bg-slate-50 text-slate-400 border-slate-200", label: "Cancelled" },
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await base44.auth.me();
    const data = await base44.entities.Appointment.filter({ created_by: user.email }, "-appointment_date", 100);
    setAppointments(data);
    setLoading(false);
  };

  const handleCancel = async (id) => {
    await base44.entities.Appointment.update(id, { status: "cancelled" });
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
    );
  };

  const now = moment();
  const filtered = appointments.filter((a) => {
    if (filter === "upcoming") return moment(a.appointment_date).isAfter(now) && a.status !== "cancelled";
    if (filter === "past") return moment(a.appointment_date).isBefore(now) || a.status === "completed";
    if (filter === "cancelled") return a.status === "cancelled";
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Under construction banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <HardHat className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">This page is under construction</p>
          <p className="text-xs text-amber-600 mt-0.5">The Appointments feature is not yet ready. We're working on it and it will be available soon.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your consultations and visits</p>
        </div>
        <Link to={createPageUrl("Doctors")}>
          <Button className="h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 px-5">
            <CalendarCheck className="w-4 h-4" /> Book New
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        {["upcoming", "past", "cancelled", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filter === f
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt) => {
            const sc = statusConfig[appt.status] || statusConfig.requested;
            return (
              <div key={appt.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-teal-50 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs text-teal-600 font-semibold">{moment(appt.appointment_date).format("MMM")}</span>
                    <span className="text-2xl font-bold text-teal-700 leading-none">{moment(appt.appointment_date).format("D")}</span>
                    <span className="text-[10px] text-teal-500">{moment(appt.appointment_date).format("YYYY")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-slate-900">Dr. {appt.doctor_name}</h3>
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide border ${sc.color}`}>
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">
                      {moment(appt.appointment_date).format("h:mm A")}
                      {appt.reason && ` · ${appt.reason}`}
                    </p>
                    {appt.share_measurements && (
                      <p className="text-xs text-teal-600 mt-1 font-medium">📊 Measurements shared with doctor</p>
                    )}
                    {appt.notes && (
                      <p className="text-xs text-slate-400 mt-1">{appt.notes}</p>
                    )}
                  </div>
                  {appt.status !== "cancelled" && appt.status !== "completed" && (
                    <Button
                      variant="ghost"
                      onClick={() => handleCancel(appt.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-sm shrink-0"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}