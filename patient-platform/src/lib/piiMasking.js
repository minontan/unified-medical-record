// PII masking utility for data sent to AI/LLM models.
// Replaces direct identifiers (email, national-ID numbers, phone) with generic "XXXX" labels
// so clinical context reaches the model without exposing the user's identity.
//
// Used by:
// - LabUploader (sanitise extracted lab metadata before storage)
// - generatePredictiveInsights backend function (inline copy masks the LLM prompt)

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// National ID: prefix letter + 7 digits + check letter
const NATIONAL_ID_RE = /\b[STFG]\d{7}[A-Z]\b/g;
const NATIONAL_ID_TEST = /\b[STFG]\d{7}[A-Z]\b/;
// SG phone: optional +65, then 8/9 + 7 digits, optional separators
const PHONE_RE = /(\+?65[\s-]?)?[689]\d{3}[\s-]?\d{4}\b/g;

export function maskIdentifiers(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(EMAIL_RE, "XXXX EMAIL")
    .replace(NATIONAL_ID_RE, "XXXX ID")
    .replace(PHONE_RE, "XXXX PHONE");
}

// Sanitise extracted lab data — strips identifiers that the OCR/LLM may have
// captured into lab_name or lab_report_id metadata fields before persistence.
export function sanitiseLabExtraction(output) {
  if (!output || typeof output !== "object") return output;
  const cleaned = { ...output };
  if (typeof cleaned.lab_name === "string") {
    cleaned.lab_name = maskIdentifiers(cleaned.lab_name).replace(/\s+/g, " ").trim();
  }
  if (typeof cleaned.lab_report_id === "string") {
    if (NATIONAL_ID_TEST.test(cleaned.lab_report_id)) {
      cleaned.lab_report_id = "XXXX ID";
    } else {
      cleaned.lab_report_id = maskIdentifiers(cleaned.lab_report_id).trim();
    }
  }
  return cleaned;
}