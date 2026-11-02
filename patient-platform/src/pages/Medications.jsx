import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pill, Loader2, FileText, Upload, X, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DrugAutocomplete from "@/components/medications/DrugAutocomplete";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import moment from "moment";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

export default function Medications() {
  const { t } = useTranslation();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("active");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summary, setSummary] = useState("");

  // Allergies state
  const [allergyProfile, setAllergyProfile] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [newAllergy, setNewAllergy] = useState("");
  const [addingAllergy, setAddingAllergy] = useState(false);
  const [savingAllergy, setSavingAllergy] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [condition, setCondition] = useState("general");
  const [doctor, setDoctor] = useState("");
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await base44.auth.me();
    const [data, profiles] = await Promise.all([
      base44.entities.Medication.filter({ created_by: user.email }, "-created_date", 200),
      base44.entities.UserHealthProfile.filter({ created_by: user.email }, "-created_date", 1),
    ]);
    setMedications(data);
    if (profiles.length > 0) {
      setAllergyProfile(profiles[0]);
      setAllergies(profiles[0].allergies || []);
    }
    setLoading(false);
  };

  const saveAllergies = async (updated) => {
    setSavingAllergy(true);
    const user = await base44.auth.me();
    if (allergyProfile) {
      await base44.entities.UserHealthProfile.update(allergyProfile.id, { allergies: updated });
    } else {
      const created = await base44.entities.UserHealthProfile.create({
        date_of_birth: "2000-01-01",
        biological_sex: "male",
        allergies: updated,
      });
      setAllergyProfile(created);
    }
    setAllergies(updated);
    setSavingAllergy(false);
  };

  const handleAddAllergy = async () => {
    const trimmed = newAllergy.trim();
    if (!trimmed) return;
    setNewAllergy("");
    setAddingAllergy(false);
    await saveAllergies([...allergies, trimmed]);
  };

  const handleRemoveAllergy = async (index) => {
    await saveAllergies(allergies.filter((_, i) => i !== index));
  };

  const handleAllergyKeyDown = (e) => {
    if (e.key === "Enter") handleAddAllergy();
    if (e.key === "Escape") { setAddingAllergy(false); setNewAllergy(""); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    let imageUrl = null;
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      imageUrl = file_url;
    }

    await base44.entities.Medication.create({
      medication_name: name,
      brand_name: brandName || undefined,
      generic_name: genericName || undefined,
      dosage,
      frequency: frequency || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      is_active: isActive,
      condition,
      prescribing_doctor: doctor || undefined,
      notes: notes || undefined,
      image_url: imageUrl,
    });

    resetForm();
    await loadData();
    setShowForm(false);
    setUploading(false);
    toast.success("Medication added");
  };

  const resetForm = () => {
    setName(""); setBrandName(""); setGenericName(""); setDosage(""); setFrequency("");
    setStartDate(""); setEndDate(""); setIsActive(true); setCondition("general");
    setDoctor(""); setNotes(""); setImageFile(null);
  };

  const handleDelete = async (id) => {
    await base44.entities.Medication.delete(id);
    setMedications((prev) => prev.filter((m) => m.id !== id));
    toast.success("Medication deleted");
  };

  const generateSummary = async () => {
    setGeneratingSummary(true);
    const active = medications.filter((m) => m.is_active);
    const ceased = medications.filter((m) => !m.is_active);

    const prompt = `Generate a clean, professional medication summary report for a patient.

CURRENT MEDICATIONS (${active.length}):
${active.map((m) => `- ${m.medication_name}${m.brand_name ? ` (${m.brand_name})` : ""}${m.generic_name ? ` [Generic: ${m.generic_name}]` : ""}: ${m.dosage}${m.frequency ? `, ${m.frequency}` : ""}${m.start_date ? `, Started: ${moment(m.start_date).format("MMM YYYY")}` : ""}${m.prescribing_doctor ? `, Prescribed by: ${m.prescribing_doctor}` : ""}`).join("\n")}

CEASED MEDICATIONS (${ceased.length}):
${ceased.length ? ceased.map((m) => `- ${m.medication_name}${m.brand_name ? ` (${m.brand_name})` : ""}: ${m.dosage}${m.start_date ? `, Started: ${moment(m.start_date).format("MMM YYYY")}` : ""}${m.end_date ? `, Stopped: ${moment(m.end_date).format("MMM YYYY")}` : ""}`).join("\n") : "None"}

Generate a structured HTML report (no <html>, <head>, <body> tags) with:
1. A header "Medication Summary Report" with current date
2. A clear section for Current Medications with a table
3. A clear section for Ceased Medications
4. Professional formatting suitable for sharing with doctors
5. Use inline CSS for clean tables and spacing`;

    const llmRes = await base44.functions.invoke("invokeLlm", { prompt, purpose: "medication_summary" });
    const result = llmRes.data?.result;
    setSummary(sanitizeHtml(result));
    setGeneratingSummary(false);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head><title>Medication Summary</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
          ${summary}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filtered = medications.filter((m) => {
    if (filter === "active") return m.is_active;
    if (filter === "ceased") return !m.is_active;
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Medications & Allergies</h1>
        <p className="text-sm text-slate-400 mt-1">Track your medications and known allergies</p>
      </div>

      <Tabs defaultValue="medications">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="medications" className="gap-1.5"><Pill className="w-4 h-4" /> Medications</TabsTrigger>
          <TabsTrigger value="allergies" className="gap-1.5"><AlertTriangle className="w-4 h-4" /> Allergies</TabsTrigger>
        </TabsList>

        <TabsContent value="allergies" className="mt-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-800">Known Allergies</h2>
                  <p className="text-xs text-slate-400">Medications, foods, environmental triggers, etc.</p>
                </div>
              </div>
              {savingAllergy && <Loader2 className="w-4 h-4 animate-spin text-slate-300" />}
            </div>

            {allergies.length === 0 && !addingAllergy ? (
              <p className="text-sm text-slate-400 py-4 text-center">No allergies recorded</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full">
                    {allergy}
                    <button onClick={() => handleRemoveAllergy(i)} className="hover:text-red-500 transition-colors ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {addingAllergy ? (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={newAllergy}
                  onChange={e => setNewAllergy(e.target.value)}
                  onKeyDown={handleAllergyKeyDown}
                  placeholder="e.g. Penicillin, Peanuts, Dust mites…"
                  className="h-10 rounded-xl border-slate-200"
                />
                <Button onClick={handleAddAllergy} className="h-10 bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4">Add</Button>
                <Button variant="ghost" onClick={() => { setAddingAllergy(false); setNewAllergy(""); }} className="h-10 rounded-xl px-3">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <button onClick={() => setAddingAllergy(true)} className="flex items-center gap-1.5 text-sm text-teal-600 font-medium hover:text-teal-700 transition-colors">
                <Plus className="w-4 h-4" /> Add allergy
              </button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="medications" className="mt-6">
      <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button
            onClick={generateSummary}
            disabled={generatingSummary || medications.length === 0}
            variant="outline"
            className="h-10 rounded-xl gap-2"
          >
            {generatingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Summary
          </Button>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 px-5"
          >
            <Plus className="w-4 h-4" /> {showForm ? "Close" : "Add Medication"}
          </Button>
          <div className="flex gap-2 ml-auto">
            {["active", "ceased", "all"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  filter === f ? "bg-teal-600 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Add Medication</h3>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Medication Name *</Label>
                <DrugAutocomplete
                  value={name}
                  onChange={setName}
                  onSelect={(item) => {
                    setName(item.drug_name);
                    if (item.generic_name) setGenericName(item.generic_name);
                    if (item.brand_name) setBrandName(item.brand_name);
                    if (item.strength && !dosage) setDosage(item.strength);
                  }}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Dosage *</Label>
                <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 10mg" className="mt-1.5 h-11 rounded-xl border-slate-200" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Brand Name</Label>
                <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} className="mt-1.5 h-11 rounded-xl border-slate-200" />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Generic Name</Label>
                <Input value={genericName} onChange={(e) => setGenericName(e.target.value)} className="mt-1.5 h-11 rounded-xl border-slate-200" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Frequency</Label>
                <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. Once daily" className="mt-1.5 h-11 rounded-xl border-slate-200" />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="mt-1.5 h-11 rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hypertension">Hypertension</SelectItem>
                    <SelectItem value="diabetes">Diabetes</SelectItem>
                    <SelectItem value="hyperlipidaemia">Hyperlipidaemia</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Prescribing Doctor</Label>
              <Input value={doctor} onChange={(e) => setDoctor(e.target.value)} className="mt-1.5 h-11 rounded-xl border-slate-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1.5 h-11 rounded-xl border-slate-200" />
              </div>
              {!isActive && (
                <div>
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1.5 h-11 rounded-xl border-slate-200" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
              <div>
                <Label className="text-sm font-medium text-slate-900">Currently Taking</Label>
                <p className="text-xs text-slate-400">Is this an active medication?</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5 rounded-xl border-slate-200 resize-none" rows={2} />
            </div>

            <div>
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Upload Image (Optional)</Label>
              <div className="mt-1.5">
                <label className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-teal-300 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">{imageFile ? imageFile.name : "Upload prescription/medication photo"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>

            <Button type="submit" disabled={uploading || !name || !dosage} className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
              {uploading ? "Saving..." : "Save Medication"}
            </Button>
          </form>
        </div>
      )}


      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <Pill className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No medications recorded</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((med) => (
            <div key={med.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                {med.image_url && (
                  <img src={med.image_url} alt={med.medication_name} className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{med.medication_name}</h3>
                      {(med.brand_name || med.generic_name) && (
                        <p className="text-sm text-slate-400">
                          {med.brand_name && `Brand: ${med.brand_name}`}
                          {med.brand_name && med.generic_name && " • "}
                          {med.generic_name && `Generic: ${med.generic_name}`}
                        </p>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                      med.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                    }`}>
                      {med.is_active ? "Active" : "Ceased"}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-slate-500">
                    <p><span className="font-medium">Dosage:</span> {med.dosage}{med.frequency && `, ${med.frequency}`}</p>
                    {med.prescribing_doctor && <p><span className="font-medium">Doctor:</span> {med.prescribing_doctor}</p>}
                    {med.start_date && (
                      <p className="flex items-center gap-1 text-xs">
                        <Calendar className="w-3 h-3" />
                        Started: {moment(med.start_date).format("MMM D, YYYY")}
                        {med.end_date && ` • Stopped: ${moment(med.end_date).format("MMM D, YYYY")}`}
                      </p>
                    )}
                    {med.notes && <p className="text-xs text-slate-400 italic">{med.notes}</p>}
                  </div>
                </div>
                <Button variant="ghost" onClick={() => handleDelete(med.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-sm shrink-0">
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Medication Summary</h2>
            <Button onClick={handlePrint} variant="outline" className="h-9 rounded-xl gap-2 text-sm">
              Print / Save PDF
            </Button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: summary }} />
        </div>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
}