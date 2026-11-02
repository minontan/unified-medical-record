import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, CheckCheck, Trash2, AlertTriangle, Info, AlertCircle, Activity, HeartHandshake, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import moment from "moment";

const typeConfig = {
  caregiver_invite_sent: { icon: HeartHandshake, color: "text-teal-600", bg: "bg-teal-50" },
  caregiver_invite_received: { icon: HeartHandshake, color: "text-teal-600", bg: "bg-teal-50" },
  caregiver_approved: { icon: HeartHandshake, color: "text-emerald-600", bg: "bg-emerald-50" },
  caregiver_revoked: { icon: HeartHandshake, color: "text-slate-500", bg: "bg-slate-50" },
  lab_result_error: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
  lab_result_critical: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
  measurement_reminder: { icon: Activity, color: "text-orange-500", bg: "bg-orange-50" },
  insight_update: { icon: Info, color: "text-blue-500", bg: "bg-blue-50" },
  general: { icon: Bell, color: "text-slate-500", bg: "bg-slate-50" },
};

const severityBadge = {
  critical: "bg-red-100 text-red-700 border-red-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  info: "bg-slate-100 text-slate-600 border-slate-200",
};

const pageMap = {
  LabResults: "/LabResults",
  Measurements: "/Measurements",
  CaregiverAccess: "/CaregiverAccess",
  CardiometabolicInsights: "/CardiometabolicInsights",
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    const data = await base44.entities.Notification.filter({ user_email: user.email }, "-created_date", 100);
    setNotifications(data);
    setLoading(false);
  };

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id) => {
    await base44.entities.Notification.delete(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = async () => {
    await Promise.all(notifications.map((n) => base44.entities.Notification.delete(n.id)));
    setNotifications([]);
  };

  const filtered = filter === "unread"
    ? notifications.filter((n) => !n.is_read)
    : filter === "critical"
    ? notifications.filter((n) => n.severity === "critical" || n.severity === "warning")
    : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllRead} className="h-9 rounded-xl gap-2 text-sm">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" onClick={clearAll} className="h-9 rounded-xl gap-2 text-sm text-slate-500">
              <Trash2 className="w-4 h-4" /> Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[["all", "All"], ["unread", "Unread"], ["critical", "Alerts"]].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
              ${filter === val ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {label}
            {val === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 bg-teal-100 text-teal-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-slate-200 rounded-2xl">
          <Bell className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No notifications</p>
          <p className="text-xs text-slate-400 mt-1">Health alerts and activity updates will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const cfg = typeConfig[n.type] || typeConfig.general;
            const Icon = cfg.icon;
            const page = n.link_page && pageMap[n.link_page];
            return (
              <div
                key={n.id}
                className={`flex gap-3 p-4 rounded-2xl border transition-all ${n.is_read ? "bg-white border-slate-200" : "bg-slate-50 border-teal-200 shadow-sm"}`}
              >
                <div className={`mt-0.5 flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${n.is_read ? "text-slate-600" : "text-slate-900"}`}>{n.title}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${severityBadge[n.severity] || severityBadge.info}`}>
                        {n.severity}
                      </span>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />}
                    </div>
                    <button onClick={() => deleteNotification(n.id)} className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-slate-400">{moment(n.created_date).fromNow()}</span>
                    {page && (
                      <Link
                        to={page}
                        onClick={() => markRead(n.id)}
                        className="text-[11px] text-teal-600 font-medium hover:underline"
                      >
                        View →
                      </Link>
                    )}
                    {!n.is_read && (
                      <button onClick={() => markRead(n.id)} className="text-[11px] text-slate-400 hover:text-slate-600">
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}