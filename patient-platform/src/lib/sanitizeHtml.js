// Basic HTML sanitizer to neutralize common XSS vectors in LLM-generated HTML.
// Strips <script>, <iframe>, <object>, <embed>, <base>, <form> tags,
// event handler attributes (on*), and javascript:/data: URLs in href/src.
export function sanitizeHtml(html) {
  if (!html || typeof html !== "string") return "";
  return html
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove dangerous tags entirely
    .replace(/<\/?(iframe|object|embed|base|form|input|textarea|button|link|meta)\b[^>]*>/gi, "")
    // Remove event handler attributes (onload, onerror, onclick, etc.)
    .replace(/\s+on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "")
    // Neutralize javascript: and data: URLs in href/src attributes
    .replace(/(href|src)\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*["']?\s*data:[^"'\s>]*/gi, '$1="#"');
}