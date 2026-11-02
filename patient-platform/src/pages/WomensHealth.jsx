import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import MenstrualSection from "@/components/womens/MenstrualSection";
import PregnancyMarkersSection from "@/components/womens/PregnancyMarkersSection";
import PregnancyVitalsSection from "@/components/womens/PregnancyVitalsSection";
import ImmunisationsSection from "@/components/womens/ImmunisationsSection";
import { useTranslation } from "react-i18next";

export default function WomensHealth() {
  const { t } = useTranslation();
  const TABS = [
    { key: "cycle", label: t('womensHealth.menstrualCycle') },
    { key: "markers", label: t('womensHealth.pregnancyMarkers') },
    { key: "vitals", label: t('womensHealth.pregnancyTest') },
    { key: "immunisations", label: t('womensHealth.immunisations') },
  ];
  const [logs, setLogs] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cycle");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    const [data, labs] = await Promise.all([
      base44.entities.WomensHealthLog.filter({ created_by: user.email }, "-logged_at", 500),
      base44.entities.LabResult.filter({ created_by: user.email }, "-collected_at", 500),
    ]);
    setLogs(data);
    setLabResults(labs);
    setLoading(false);
  };

  const handleCreate = async (entry) => {
    const created = await base44.entities.WomensHealthLog.create(entry);
    setLogs((prev) => [created, ...prev]);
  };

  const handleDelete = async (id) => {
    await base44.entities.WomensHealthLog.delete(id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('womensHealth.title')}</h1>
        <p className="text-sm text-slate-400 mt-1">{t('womensHealth.logEntry')}</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              activeTab === t.key
                ? "bg-pink-600 text-white border-pink-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-pink-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "cycle" && (
        <MenstrualSection logs={logs} onCreate={handleCreate} onDelete={handleDelete} />
      )}
      {activeTab === "markers" && (
        <PregnancyMarkersSection logs={logs} onCreate={handleCreate} onDelete={handleDelete} labResults={labResults} />
      )}
      {activeTab === "vitals" && (
        <PregnancyVitalsSection logs={logs} onCreate={handleCreate} onDelete={handleDelete} />
      )}
      {activeTab === "immunisations" && (
        <ImmunisationsSection logs={logs} onCreate={handleCreate} onDelete={handleDelete} />
      )}
    </div>
  );
}