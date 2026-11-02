import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, CheckCircle2, Loader2, Mail, User, MessageSquare, Tag, ShieldCheck } from "lucide-react";

const SUBJECTS = [
  "General Enquiry",
  "Technical Support",
  "Feature Request",
  "Clinical / Medical Question",
  "Account Issue",
  "Partnership / Business",
  "Other",
];

function generateCaptcha() {
  const ops = ["+", "+", "-", "+", "*"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;
  if (op === "*") {
    a = Math.floor(Math.random() * 9) + 2;
    b = Math.floor(Math.random() * 5) + 2;
    answer = a * b;
  } else if (op === "-") {
    a = Math.floor(Math.random() * 10) + 6;
    b = Math.floor(Math.random() * 5) + 1;
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 15) + 1;
    b = Math.floor(Math.random() * 15) + 1;
    answer = a + b;
  }
  return { question: `What is ${a} ${op} ${b}?`, answer: String(answer) };
}

export default function ContactForm({ prefillEmail = "", prefillName = "" }) {
  const [form, setForm] = useState({
    name: prefillName,
    email: prefillEmail,
    subject: "",
    message: "",
  });
  // Honeypot — must stay empty
  const [honeypot, setHoneypot] = useState("");
  // CAPTCHA
  const [captcha, setCaptcha] = useState(() => generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState(false);
  // Timing — bots submit instantly
  const formLoadTime = useRef(Date.now());

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // Refresh CAPTCHA on mount
  useEffect(() => {
    setCaptcha(generateCaptcha());
    formLoadTime.current = Date.now();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCaptchaError(false);

    // Layer 1a: Honeypot check
    if (honeypot) return; // silently drop — bots shouldn't know they failed

    // Layer 1b: Timing check — reject if submitted in under 2 seconds
    if (Date.now() - formLoadTime.current < 2000) return;

    // Layer 1c: CAPTCHA check
    if (captchaInput.trim() !== captcha.answer) {
      setCaptchaError(true);
      setCaptcha(generateCaptcha());
      setCaptchaInput("");
      return;
    }

    setLoading(true);
    const res = await base44.functions.invoke("sendContactMessage", {
      ...form,
      _hp: honeypot,          // backend also validates
      _ts: Date.now(),
    });
    setLoading(false);

    if (res.data?.success) {
      setSent(true);
    } else {
      setError(res.data?.error || "Something went wrong. Please try again.");
      // Regenerate CAPTCHA on any failure
      setCaptcha(generateCaptcha());
      setCaptchaInput("");
    }
  };

  const resetForm = () => {
    setSent(false);
    setForm({ name: prefillName, email: prefillEmail, subject: "", message: "" });
    setHoneypot("");
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
    formLoadTime.current = Date.now();
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Message sent!</h3>
        <p className="text-slate-500 text-sm max-w-sm">
          Thanks for reaching out. We'll get back to you within 1–2 business days. Check your inbox for a confirmation.
        </p>
        <button onClick={resetForm} className="text-sm text-blue-600 hover:underline font-medium mt-2">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot — hidden from real users, css-hidden not display:none so bots see it */}
      <div style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }} aria-hidden="true" tabIndex={-1}>
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          autoComplete="off"
          tabIndex={-1}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            <User className="w-3.5 h-3.5 inline mr-1 text-blue-500" />Your Name
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Jane Tan"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            <Mail className="w-3.5 h-3.5 inline mr-1 text-blue-500" />Email Address
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="jane@example.com"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          <Tag className="w-3.5 h-3.5 inline mr-1 text-blue-500" />Subject
        </label>
        <select
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white text-slate-700"
        >
          <option value="">Select a topic…</option>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          <MessageSquare className="w-3.5 h-3.5 inline mr-1 text-blue-500" />Your Message
        </label>
        <textarea
          required
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={5}
          placeholder="Tell us how we can help…"
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white resize-none"
        />
      </div>

      {/* CAPTCHA */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <p className="text-xs font-semibold text-blue-700">Quick verification</p>
        </div>
        <p className="text-sm text-slate-700 font-medium mb-2">{captcha.question}</p>
        <input
          type="number"
          required
          value={captchaInput}
          onChange={(e) => { setCaptchaInput(e.target.value); setCaptchaError(false); }}
          placeholder="Your answer"
          className={`w-40 px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white ${captchaError ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:border-blue-400"}`}
        />
        {captchaError && <p className="text-xs text-red-500 mt-1">Incorrect — please try again.</p>}
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {loading ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}