import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/useRole";
import { ClipboardList, FilePlus2, Menu, ScrollText, ShieldAlert, UserCircle2, Users } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Work Queue", icon: ClipboardList, badge: "queue" },
  { to: "/intake/new", label: "New Intake", icon: FilePlus2 },
  { to: "/residents", label: "Residents", icon: Users },
  { to: "/quarantined", label: "Quarantined", icon: ShieldAlert, badge: "quarantine" },
  { to: "/audit", label: "Audit Log", icon: ScrollText },
  { to: "/profile", label: "My Profile", icon: UserCircle2 },
];

export default function Layout() {
  const { role } = useRole();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState({ queue: null, quarantine: null });

  useEffect(() => {
    setOpen(false);
    base44.entities.Prescription.list("-updated_date", 200).then((rows) => {
      setCounts((c) => ({
        ...c,
        queue: rows.filter((p) => ["draft", "in_review", "changes_requested"].includes(p.status)).length,
      }));
    });
    base44.entities.IntakeDocument.filter({ status: "quarantined" }, "-created_date", 200).then((rows) => {
      setCounts((c) => ({ ...c, quarantine: rows.length }));
    });
  }, [location.pathname]);

  const badgeFor = (key) => (key === "queue" ? counts.queue : counts.quarantine);

  const nav = (
    <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon, badge }) => {
        const count = badge ? badgeFor(badge) : null;
        return (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {count !== null && count > 0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                {count}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  const roleBadge = (
    <div className="border-t px-3 py-3 flex items-center gap-2.5">
      <UserCircle2 className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground leading-none">Signed in as</p>
        <p className="text-sm font-medium capitalize leading-tight">
          {role}
          <span className="block text-[11px] font-normal text-muted-foreground">
            assigned by your administrator
          </span>
        </p>
      </div>
    </div>
  );

  const sidebarInner = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b">
        <h1 className="font-heading font-bold text-sm leading-tight">Nursing Home Prescription Generator</h1>
        <p className="text-[11px] text-muted-foreground mt-1">
          Drafting assistant — pharmacist review and the authorised doctor's signature are required for every
          prescription.
        </p>
      </div>
      {nav}
      {roleBadge}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 border-r bg-card z-20">{sidebarInner}</aside>
      <div className="md:hidden sticky top-0 z-30 border-b bg-card px-4 py-3 flex items-center justify-between">
        <button aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-heading font-bold text-sm">Nursing Home Rx Generator</span>
        <span className="w-5" />
      </div>
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative w-64 h-full border-r bg-card">{sidebarInner}</aside>
        </div>
      )}
      <main className="md:ml-60 max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}