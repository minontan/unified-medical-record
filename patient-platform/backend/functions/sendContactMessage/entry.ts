import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ADMIN_EMAIL = "admin@example.org";
const FORWARD_EMAIL = "admin@example.org"; // configure: destination for forwarded contact submissions

// In-memory rate limit store: { ip -> [timestamps] } — globalThis-pinned so the
// limit survives sandbox hot-reloads (previously it silently reset).
const rateLimitStore = (globalThis.__umrContactRateLimitStore ??= new Map());
const RATE_LIMIT = 3;           // max submissions
const RATE_WINDOW_MS = 15 * 60 * 1000; // per 15 minutes

// Spam keywords (case-insensitive)
const SPAM_KEYWORDS = [
  "casino", "viagra", "crypto", "bitcoin", "click here", "free money",
  "make money fast", "loan offer", "investment opportunity", "seo service",
  "buy followers", "cheap meds", "payday loan",
];

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) return true;
  timestamps.push(now);
  rateLimitStore.set(ip, timestamps);
  return false;
}

function containsSpam(text) {
  const lower = text.toLowerCase();
  return SPAM_KEYWORDS.some(kw => lower.includes(kw));
}

function escapeHtml(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get client IP from headers
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Layer 2a: IP rate limiting
    if (isRateLimited(ip)) {
      return Response.json(
        { error: "Too many messages sent. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    const { name, email, subject, message, _hp, _ts } = await req.json();

    // Layer 2b: Honeypot — if filled, silently succeed (don't reveal detection)
    if (_hp && _hp.length > 0) {
      return Response.json({ success: true });
    }

    // Layer 2c: Timing check — reject if client-side timestamp is less than 2s from now
    if (_ts && Date.now() - _ts < 2000) {
      return Response.json({ success: true }); // silent drop
    }

    // Basic validation
    if (!name || !email || !message) {
      return Response.json({ error: "Name, email and message are required." }, { status: 400 });
    }

    // Layer 2d: Spam keyword detection
    if (containsSpam(name) || containsSpam(message) || containsSpam(subject || "")) {
      return Response.json({ error: "Your message was flagged as spam. Please remove any promotional content." }, { status: 400 });
    }

    const adminEmailBody = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1d4ed8;">New Contact Enquiry — Unified Medical Record</h2>
  <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
    <tr><td style="padding: 8px; font-weight: bold; color: #475569;">Name</td><td style="padding: 8px; color: #0f172a;">${escapeHtml(name)}</td></tr>
    <tr style="background:#f8fafc"><td style="padding: 8px; font-weight: bold; color: #475569;">Email</td><td style="padding: 8px; color: #0f172a;">${escapeHtml(email)}</td></tr>
    <tr><td style="padding: 8px; font-weight: bold; color: #475569;">Subject</td><td style="padding: 8px; color: #0f172a;">${escapeHtml(subject || "Not specified")}</td></tr>
    <tr style="background:#f8fafc"><td style="padding: 8px; font-weight: bold; color: #475569; vertical-align: top;">Message</td><td style="padding: 8px; color: #0f172a; white-space: pre-wrap;">${escapeHtml(message)}</td></tr>
    <tr><td style="padding: 8px; font-weight: bold; color: #475569;">Client IP</td><td style="padding: 8px; color: #94a3b8; font-size:12px;">${escapeHtml(ip)}</td></tr>
  </table>
  <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">Sent via Unified Medical Record contact form</p>
</div>
    `.trim();

    // Send to admin + forward in parallel, then auto-reply to sender
    await Promise.all([
      base44.asServiceRole.integrations.Core.SendEmail({
        to: ADMIN_EMAIL,
        from_name: "Unified Medical Record Contact Form",
        subject: `[Unified Medical Record Enquiry] ${subject || "General Query"} — from ${name}`,
        body: adminEmailBody,
      }),
      base44.asServiceRole.integrations.Core.SendEmail({
        to: FORWARD_EMAIL,
        from_name: "Unified Medical Record Contact Form",
        subject: `[Unified Medical Record Enquiry] ${subject || "General Query"} — from ${name}`,
        body: adminEmailBody,
      }),
    ]);

    // Auto-reply to sender
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      from_name: "Unified Medical Record Team",
      subject: "We've received your message — Unified Medical Record",
      body: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1d4ed8;">Thanks for reaching out, ${escapeHtml(name)}!</h2>
  <p style="color: #475569; line-height: 1.6;">We've received your message and our team will get back to you within 1–2 business days.</p>
  <div style="background: #f0f9ff; border-left: 4px solid #1d4ed8; padding: 16px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 0; font-weight: bold; color: #1e3a5f;">Your message:</p>
    <p style="margin: 8px 0 0; color: #475569; white-space: pre-wrap;">${escapeHtml(message)}</p>
  </div>
  <p style="color: #475569; line-height: 1.6;">In the meantime, feel free to explore the Unified Medical Record platform and take control of your health journey.</p>
  <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">The Unified Medical Record Team · A MedNex Pte Ltd project</p>
</div>
      `.trim(),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});