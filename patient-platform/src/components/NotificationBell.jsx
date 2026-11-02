import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotificationBell({ userEmail }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userEmail) return;
    loadCount();
    // Poll every 60s for new notifications
    const interval = setInterval(loadCount, 60000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const loadCount = async () => {
    const data = await base44.entities.Notification.filter({ user_email: userEmail, is_read: false }, "-created_date", 50);
    setUnreadCount(data.length);
  };

  return (
    <Link
      to="/Notifications"
      className="relative p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
      title="Notifications"
    >
      <Bell className="w-4 h-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}