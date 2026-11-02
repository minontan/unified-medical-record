import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import DisclaimerModal from "@/components/DisclaimerModal";
import NotificationBell from "@/components/NotificationBell";
import {
  LayoutDashboard,
  Activity,
  Users,
  UsersRound,
  Stethoscope,
  CalendarCheck,
  FileText,
  FlaskConical,
  PersonStanding,
  TestTube2,
  Menu,
  LogOut,
  ChevronRight,
  Settings,
  Pill,
  UserPlus,
  ShieldCheck,
  Mail,
  HeartHandshake,
  Bone,
  FolderHeart,
  Database,
  Brain,
  Baby
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

const useNavGroups = () => {
  const { t } = useTranslation();
  return [
    {
      items: [
        { name: t('nav.dashboard'), icon: LayoutDashboard, page: "Dashboard" },
      ]
    },
    {
      label: t('nav.uploadRecords', 'Upload Records'),
      items: [
        { name: t('nav.labResults'), icon: TestTube2, page: "LabResults" },
        { name: t('nav.medicalDocuments', 'Medical Documents'), icon: FolderHeart, page: "MedicalDocuments" },
        { name: "Medications & Allergies", icon: Pill, page: "Medications" },
      ]
    },
    {
      label: t('nav.trackMeasures', 'Track Measures'),
      items: [
        { name: t('nav.measurements'), icon: Activity, page: "Measurements" },
        { name: t('nav.womensHealth'), icon: PersonStanding, page: "WomensHealth" },
        { name: t('nav.boneMuscleFragility'), icon: Bone, page: "MusculoskeletalHealth" },
      ]
    },
    {
      label: t('nav.insightsAdvice', 'Insights & Advice'),
      items: [
        { name: t('nav.cardiometabolicInsights'), icon: Activity, page: "CardiometabolicInsights" },
        { name: t('nav.cancerScreening'), icon: ShieldCheck, page: "ScreeningDashboard" },
      ]
    },
    {
      label: t('nav.summarise', 'Summarise'),
      items: [
        { name: t('nav.healthSummary'), icon: FileText, page: "Summary" },
        { name: "Predictive Twin", icon: Brain, page: "DigitalTwin", notReady: true },
      ]
    },
    {
      label: t('nav.community'),
      items: [
        { name: t('nav.community'), icon: Users, page: "Community" },
        { name: t('nav.supportGroups'), icon: UsersRound, page: "Groups" },
        { name: t('nav.friendsFamily'), icon: UserPlus, page: "Friends" },
        { name: "Family Hub", icon: Baby, page: "FamilyHub" },
      ]
    },
    {
      label: t('nav.connectProvider'),
      items: [
        { name: t('nav.findDoctors'), icon: Stethoscope, page: "Doctors", notReady: true },
        { name: t('nav.diagnosticCentres'), icon: FlaskConical, page: "DiagnosticCentres", notReady: true },
        { name: t('nav.pharmacies'), icon: Pill, page: "Pharmacies", notReady: true },
        { name: t('nav.appointments'), icon: CalendarCheck, page: "Appointments", notReady: true },
      ]
    },
    {
      label: t('nav.help'),
      items: [
        { name: t('nav.caregiverAccess'), icon: HeartHandshake, page: "CaregiverAccess" },
        { name: "About Unified Medical Record", icon: HeartHandshake, page: "About" },
        { name: t('nav.contactUs'), icon: Mail, page: "Contact" },
        { name: "Drug Glossary (Admin)", icon: Database, page: "DrugGlossaryAdmin", adminOnly: true },
      ]
    },
  ];
};

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoadingAuth, isLoadingPublicSettings, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navGroups = useNavGroups();

  // Landing page renders without sidebar/layout
  if (currentPageName === "Landing") {
    return <>{children}</>;
  }

  // While auth is still resolving, show a minimal spinner (no sidebar)
  if (isLoadingAuth || isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  // If not authenticated, don't render the sidebar (AuthenticatedApp handles redirect)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DisclaimerModal />
      <style>{`
        :root {
          --primary: 166 84% 32%;
          --primary-foreground: 0 0% 100%;
        }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-slate-200/80 z-50 
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <img
            src="/logo.png"
            alt="Unified Medical Record"
            className="h-10 w-auto"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-hide">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-4 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.items.filter(item => !item.adminOnly || user?.role === 'admin').map((item) => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                        ${isActive
                          ? "bg-teal-50 text-teal-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
                    >
                      <item.icon className={`w-[18px] h-[18px] ${isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                      <span>{item.name}</span>
                      {item.notReady && !isActive && (
                        <span className="ml-auto text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600">Building</span>
                      )}
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto text-teal-400" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        {user && (
          <div className="p-4 border-t border-slate-100 space-y-3">
            {/* User identity */}
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {user.full_name?.charAt(0) || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{user.full_name || "User"}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            {/* Action icons row */}
            <div className="flex items-center justify-between px-3">
              <Link
                to={createPageUrl("Profile")}
                title="Profile & Settings"
                className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <NotificationBell userEmail={user?.email} />
              <LanguageSwitcher />
              <button
                onClick={() => base44.auth.logout()}
                title="Log out"
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-slate-200/80 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Unified Medical Record"
                className="h-8 w-auto"
              />
            </div>
            <div className="w-9" />
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
        
        <footer className="border-t border-slate-200 py-4 px-4 md:px-8 mt-auto">
          <p className="text-center text-xs text-slate-400">A MedNex Pte Ltd project</p>
        </footer>
      </main>
    </div>
  );
}