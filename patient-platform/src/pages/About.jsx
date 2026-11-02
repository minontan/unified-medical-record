import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, ShieldCheck, Users, Stethoscope } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 py-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">About Unified Medical Record</h1>
        <p className="mt-2 text-slate-500 text-sm">Empowering individuals to take charge of their long-term health.</p>
      </div>

      {/* What we do */}
      <section className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-800">What is Unified Medical Record?</h2>
        <p className="text-slate-600 leading-relaxed text-sm">
          Unified Medical Record is a comprehensive personal health management platform designed to help individuals
          living with or at risk of chronic conditions — including hypertension, diabetes, and
          hyperlipidaemia — track, understand, and act on their health data. From uploading laboratory
          results and medical documents to logging daily measurements and medications, Unified Medical Record brings
          all your health information into one secure, easy-to-use space.
        </p>
        <p className="text-slate-600 leading-relaxed text-sm">
          Beyond simple record-keeping, Unified Medical Record provides evidence-based cardiometabolic insights,
          personalised cancer screening recommendations aligned with international clinical guidelines
          (ADA, AHA, USPSTF, Singapore MOH CPG, APASL), musculoskeletal risk assessments, and a
          digital health summary you can share with your care team. Our platform also supports family
          caregiving through the Family Hub and caregiver access controls, so no one has to navigate
          their health journey alone.
        </p>
      </section>

      {/* Who it's for */}
      <section className="bg-teal-50 border border-teal-200 rounded-2xl p-7 space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Who is it for?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: Heart, title: "Chronic Disease Patients", body: "People managing hypertension, diabetes, or high cholesterol who want a single place to monitor their progress and understand their numbers." },
            { icon: Users, title: "Caregivers & Families", body: "Parents, spouses, and adult children who co-manage health records for loved ones, with granular permission controls for each data category." },
            { icon: ShieldCheck, title: "Preventive Health Seekers", body: "Health-conscious individuals who want personalised cancer screening timelines and risk assessments before symptoms appear." },
            { icon: Stethoscope, title: "Healthcare Professionals", body: "Clinicians and allied health staff who want patients to arrive at consultations with organised, up-to-date health summaries." },
          ].map((c) => (
            <div key={c.title} className="bg-white rounded-xl p-4 border border-teal-100 flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <c.icon className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{c.title}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who builds it */}
      <section className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Who builds Unified Medical Record?</h2>
        <p className="text-slate-600 leading-relaxed text-sm">
          Unified Medical Record is built and maintained by <span className="font-semibold text-slate-800">MedNex Pte Ltd</span>,
          a health-technology company headquartered in Singapore. Our multidisciplinary team combines
          clinical expertise in internal medicine and preventive health with deep experience in software
          engineering and data science. Every feature is designed with clinician input to ensure the
          information presented is accurate, evidence-based, and genuinely useful — not just aesthetically
          pleasing. We are committed to responsible AI, data privacy under PDPA and GDPR principles,
          and continuous improvement guided by user feedback and evolving clinical guidelines.
        </p>
        <p className="text-slate-600 leading-relaxed text-sm">
          Have questions or feedback? We'd love to hear from you.
        </p>
        <Link
          to={createPageUrl("Contact")}
          className="inline-flex items-center gap-2 mt-1 text-sm font-medium text-teal-700 hover:text-teal-800 underline underline-offset-2"
        >
          Contact the Unified Medical Record team →
        </Link>
      </section>
    </div>
  );
}