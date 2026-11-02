import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import MedicalDocUploader from "@/components/medicaldocs/MedicalDocUploader";
import MedicalDocCard from "@/components/medicaldocs/MedicalDocCard";
import { Plus, Loader2 } from "lucide-react";

// ─── Section definitions ──────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "radiology",
    label: "Radiology & Imaging",
    description: "X-ray, CT scan, MRI, Ultrasound, PET scan, Mammogram, Doppler",
    color: "blue",
    icon: "🩻",
  },
  {
    id: "ecg",
    label: "ECG & Cardiac Investigations",
    description: "ECG / EKG, Holter monitor, Echocardiogram, Stress test / TMT",
    color: "rose",
    icon: "🫀",
  },
  {
    id: "bmd",
    label: "Bone Density / DXA",
    description: "DEXA scan, BMD report, T-score, Z-score, Fracture risk assessment",
    color: "purple",
    icon: "🦴",
  },
  {
    id: "spirometry",
    label: "Spirometry & Lung Function",
    description: "FEV1, FVC, Peak flow, DLCO, Full lung function test",
    color: "cyan",
    icon: "🫁",
  },
  {
    id: "microbiology",
    label: "Microbiology & Culture",
    description: "Culture & sensitivity, Gram stain, MRSA screen, AFB, Wound swab",
    color: "orange",
    icon: "🦠",
  },
  {
    id: "histopathology",
    label: "Histopathology & Cytology",
    description: "Biopsy, PAP smear, FNAC, Tissue pathology",
    color: "pink",
    icon: "🔬",
  },
  {
    id: "ophthalmology",
    label: "Ophthalmology",
    description: "Visual acuity, IOP, Fundus photo, Visual field test, OCT",
    color: "indigo",
    icon: "👁️",
  },
  {
    id: "audiology",
    label: "Audiometry & Hearing",
    description: "Pure tone audiogram, Tympanometry, Otoacoustic emissions",
    color: "violet",
    icon: "👂",
  },
  {
    id: "other",
    label: "Other Reports",
    description: "Any other medical investigation not listed above",
    color: "slate",
    icon: "📄",
  },
];

const COLOUR = {
  blue:   { header: "bg-blue-50 border-blue-200",   title: "text-blue-700",   btn: "bg-blue-600 hover:bg-blue-700"   },
  rose:   { header: "bg-rose-50 border-rose-200",   title: "text-rose-700",   btn: "bg-rose-600 hover:bg-rose-700"   },
  purple: { header: "bg-purple-50 border-purple-200", title: "text-purple-700", btn: "bg-purple-600 hover:bg-purple-700"},
  cyan:   { header: "bg-cyan-50 border-cyan-200",   title: "text-cyan-700",   btn: "bg-cyan-600 hover:bg-cyan-700"   },
  orange: { header: "bg-orange-50 border-orange-200", title: "text-orange-700", btn: "bg-orange-600 hover:bg-orange-700"},
  pink:   { header: "bg-pink-50 border-pink-200",   title: "text-pink-700",   btn: "bg-pink-600 hover:bg-pink-700"   },
  indigo: { header: "bg-indigo-50 border-indigo-200", title: "text-indigo-700", btn: "bg-indigo-600 hover:bg-indigo-700"},
  violet: { header: "bg-violet-50 border-violet-200", title: "text-violet-700", btn: "bg-violet-600 hover:bg-violet-700"},
  slate:  { header: "bg-slate-50 border-slate-200", title: "text-slate-700",  btn: "bg-slate-600 hover:bg-slate-700" },
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MedicalDocuments() {
  const { t } = useTranslation();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null); // section id currently showing uploader

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    const data = await base44.entities.MedicalDocument.filter({ created_by: user.email }, "-report_date", 300);
    setDocs(data);
    setLoading(false);
  };

  const handleSaved = (record) => {
    setDocs((prev) => [record, ...prev]);
    setUploading(null);
  };

  const handleDelete = async (id) => {
    await base44.entities.MedicalDocument.delete(id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('nav.medicalDocuments')}</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload and archive non-blood-test medical reports — radiology, ECG, spirometry, pathology and more.
          AI extracts a summary of each report for quick reference.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        </div>
      ) : (
        <div className="space-y-5">
          {SECTIONS.map((section) => {
            const c = COLOUR[section.color] || COLOUR.slate;
            const sectionDocs = docs.filter((d) => d.doc_type === section.id);
            const isUploading = uploading === section.id;

            return (
              <div key={section.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                {/* Section header */}
                <div className={`flex items-center justify-between px-5 py-4 border-b ${c.header}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{section.icon}</span>
                    <div>
                      <p className={`text-sm font-semibold ${c.title}`}>{section.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{section.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sectionDocs.length > 0 && (
                      <span className="text-xs text-slate-400">{sectionDocs.length} document{sectionDocs.length !== 1 ? "s" : ""}</span>
                    )}
                    <Button
                      size="sm"
                      onClick={() => setUploading(isUploading ? null : section.id)}
                      className={`rounded-xl h-8 gap-1.5 text-xs text-white ${isUploading ? "bg-slate-400 hover:bg-slate-500" : c.btn}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {isUploading ? "Cancel" : "Add"}
                    </Button>
                  </div>
                </div>

                {/* Uploader */}
                {isUploading && (
                  <div className="p-5 border-b border-slate-100">
                    <MedicalDocUploader
                      docType={section.id}
                      onSaved={handleSaved}
                      onCancel={() => setUploading(null)}
                    />
                  </div>
                )}

                {/* Documents list */}
                {sectionDocs.length > 0 ? (
                  <div className="p-4 space-y-2">
                    {sectionDocs.map((doc) => (
                      <MedicalDocCard key={doc.id} doc={doc} onDelete={handleDelete} />
                    ))}
                  </div>
                ) : (
                  !isUploading && (
                    <div className="px-5 py-6 text-center">
                      <p className="text-xs text-slate-400">No {section.label.toLowerCase()} documents yet</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">Click "Add" to upload your first report</p>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}