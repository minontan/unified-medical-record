import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is Unified Medical Record?",
    answer: "Unified Medical Record is a personal health information platform that applies evidence-based clinical guidelines — from the AHA, ADA, ACC, ESC, USPSTF, and WHO — to your own health data, helping you understand your lab results, blood pressure trends, cancer screening options, and cardiometabolic risk classification.",
  },
  {
    question: "Is Unified Medical Record a medical device?",
    answer: "No. Unified Medical Record is a personal health information tool, not a regulated medical device. It has not been evaluated or approved by any national health authority for clinical or diagnostic use.",
  },
  {
    question: "Can Unified Medical Record diagnose medical conditions?",
    answer: "No. Unified Medical Record classifies your readings against published clinical thresholds for informational purposes only. It does not diagnose, treat, or cure any medical condition. Always consult a qualified healthcare provider for diagnosis and treatment.",
  },
  {
    question: "Which clinical guidelines does Unified Medical Record reference?",
    answer: "Unified Medical Record references 2025–2026 guidelines from the American Heart Association (AHA), American Diabetes Association (ADA), American College of Cardiology (ACC), European Society of Cardiology (ESC), U.S. Preventive Services Task Force (USPSTF), World Health Organization (WHO), Singapore Ministry of Health, and Malaysia Clinical Practice Guidelines.",
  },
  {
    question: "How does Unified Medical Record handle my health data?",
    answer: "Your health records are private, secure, and owned entirely by you. Unified Medical Record does not monetise, sell, or share your health data with third parties. You can export or delete your data at any time.",
  },
  {
    question: "How are lab results extracted from uploaded reports?",
    answer: "When you upload a PDF or photo of your blood test report, Unified Medical Record uses AI to extract test names, values, units, and reference ranges automatically. Extracted values should always be verified against your original report, as document quality can affect accuracy.",
  },
  {
    question: "What is the Digital Human Twin?",
    answer: "The Digital Human Twin is an experimental feature that computes mathematical risk trajectories for biomarkers like HbA1c, blood pressure, and LDL. It is under active development, has not been validated in clinical trials, and all predictions are informational only.",
  },
  {
    question: "Can I share my Unified Medical Record data with my doctor?",
    answer: "Yes. Unified Medical Record can generate a structured health summary compiling your self-entered data into a printable document intended to facilitate discussions with your healthcare provider. This summary is not a clinical report or medical record.",
  },
  {
    question: "Does Unified Medical Record replace medical advice?",
    answer: "No. Unified Medical Record is designed to help you understand your health data between consultations. It does not replace professional medical advice, clinical diagnosis, or treatment from a qualified healthcare provider.",
  },
  {
    question: "Is Unified Medical Record free to use?",
    answer: "Unified Medical Record offers a free tier with access to core features including health measurements, lab result tracking, and cardiometabolic classification. Additional features may be available in future subscription tiers.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">FAQ</p>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Frequently asked questions</h2>
        <p className="text-slate-500 mt-3 max-w-xl mx-auto">Common questions about what Unified Medical Record is, how it works, and what it is not.</p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <h3 className="text-sm md:text-base font-semibold text-slate-900">{faq.question}</h3>
                <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-6 pb-5">
                  <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}