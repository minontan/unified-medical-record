import { Activity, CalendarCheck, Users, Pill } from "lucide-react";

export default function QuickStats({ measurementCount, appointmentCount, groupCount, medicationCount }) {
  const stats = [
    { label: "Total Readings", value: measurementCount, icon: Activity, color: "text-teal-600 bg-teal-50" },
    { label: "Upcoming Appts", value: appointmentCount, icon: CalendarCheck, color: "text-blue-600 bg-blue-50" },
    { label: "Groups Joined", value: groupCount, icon: Users, color: "text-purple-600 bg-purple-50" },
    { label: "Active Medications", value: medicationCount, icon: Pill, color: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-xl border border-slate-200/80 p-4">
          <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
            <stat.icon className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}