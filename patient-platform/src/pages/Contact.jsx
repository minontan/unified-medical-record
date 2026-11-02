import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import ContactForm from "@/components/contact/ContactForm";
import { Mail, MessageSquare, Clock, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Contact() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('contact.title')}</h1>
        <p className="text-sm text-slate-400 mt-1">{t('contact.responseTimeText')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info cards */}
        <div className="space-y-4">
          {[
            { icon: MessageSquare, title: "General Enquiries", body: "Questions about features, your account, or anything Unified Medical Record-related.", color: "blue" },
            { icon: Clock, title: "Response Time", body: "We typically respond within 1–2 business days (Mon–Fri, SGT).", color: "teal" },
            { icon: Shield, title: "Clinical Queries", body: "For health questions, we'll route your message to the appropriate clinical advisory member.", color: "indigo" },
          ].map((c) => (
            <div key={c.title} className={`bg-${c.color}-50 border border-${c.color}-200 rounded-2xl p-5`}>
              <div className={`w-9 h-9 rounded-xl bg-${c.color}-100 flex items-center justify-center mb-3`}>
                <c.icon className={`w-4 h-4 text-${c.color}-600`} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">{c.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Send us a message</h2>
              <p className="text-xs text-slate-400">We read every message personally.</p>
            </div>
          </div>
          <ContactForm
            prefillEmail={user?.email || ""}
            prefillName={user?.full_name || ""}
          />
        </div>
      </div>
    </div>
  );
}