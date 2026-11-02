import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    multi_patient_detected: { type: "boolean" },
    patient_sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          section_index: { type: "integer" },
          pso_number: { type: "string" },
          created_on: { type: "string" },
          remarks: { type: "string" },
          date_of_birth: { type: "string" },
          gender: { type: "string" },
          drug_allergy: { type: "string" },
          medications: {
            type: "array",
            items: {
              type: "object",
              properties: {
                drug_code: { type: "string" },
                drug_name: { type: "string" },
                frequency: { type: "string" },
                dosage: { type: "string" },
                quantity: { type: "string" },
                uom: { type: "string" },
                route: { type: "string" },
                dosage_form: { type: "string" },
                duration: { type: "string" },
                confidence: { type: "string" },
              },
            },
          },
        },
        required: ["section_index", "medications"],
      },
    },
  },
  required: ["multi_patient_detected", "patient_sections"],
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const fileUri = body && body.file_uri;
    if (typeof fileUri !== 'string' || !fileUri || fileUri.length > 2048) {
      return Response.json({ error: body?.file_url ? 'This upload screen is out of date. Reload the app, select the redacted file again and confirm redaction before running OCR.' : 'A privately uploaded, redacted file is required. Select the file again and retry.' }, { status: 400 });
    }
    const { signed_url: fileUrl } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 300 });

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are an OCR extraction tool for nursing-home Infocare medication documents (Singapore). ' +
        'The upload may be an image (png/jpg screenshot), a PDF, or a Word docx file. ' +
        'The document may contain data for MULTIPLE patients — if it clearly does, split it into one patient section per patient, in the order they appear, each with its own header fields and medication table. ' +
        'If it contains exactly one patient, return a single section. ' +
        'The patient name and patient identifiers may be deliberately masked out with black boxes by the operator — never attempt to read, infer, reconstruct, or report patient identity in any form; treat masked regions as absent and never place identity fields in your output. ' +
        'Extract ONLY text that is literally visible in the document. Never guess, infer, complete, or correct any clinical value — leave any uncertain field as an empty string. ' +
        'Per section, extract the non-identifying header fields if visible: PSO number, Created On, Remarks. ' +
        'Also extract per section, exactly as written: date_of_birth (the value after "DOB:", e.g. "02/04/1949", keep the original format), gender (e.g. "Female" or "Male"), and drug_allergy (the text after "Drug / Medication Allergy :", e.g. "AMOXICILLIN"; if it says no known allergy, copy that wording). Leave empty if not visible. Never extract national ID numbers. ' +
        'Transcribe the complete Drug Name verbatim as plain text: preserve spelling, capitalization, punctuation, brand names, strengths, abbreviations and wording exactly as visible. Never match against a drug glossary, standardize, expand abbreviations, substitute names, or move text out of the Drug Name into other fields. ' +
        'For each medication row extract Drug Code, Drug Name, Frequency, Dosage, Quantity and UOM when visible. Extract Route, Form (dosage_form) and Duration only when explicitly present in their own source fields; never infer them from the drug name or medical knowledge. ' +
        'Do not extract per-medication approval status or approval dates. Duration and quantity are alternatives; never invent one from the other. ' +
        'For each medication row set confidence to "high", "medium" or "low" based on OCR clarity. ' +
        'Do not add medication rows that are not visible. ' +
        'Set multi_patient_detected to true only if the document clearly contains data for more than one patient.',
      file_urls: [fileUrl],
      response_json_schema: EXTRACTION_SCHEMA,
    });

    // Safety net: the schema excludes patient identity, but never return it even if reported.
    if (result && typeof result === 'object') {
      delete result.resident_name;
      delete result.resident_id;
      if (Array.isArray(result.patient_sections)) {
        result.patient_sections.forEach((section) => {
          if (section && typeof section === 'object') {
            delete section.resident_name;
            delete section.resident_id;
            if (Array.isArray(section.medications)) {
              section.medications.forEach((m) => {
                delete m.resident_name;
                delete m.resident_id;
              });
            }
          }
        });
      }
    }

    // Never return a national identifier accidentally captured in a free-text field.
    const redacted = JSON.parse(JSON.stringify(result).replace(/\b[STFGM]\s*\d{7}\s*[A-Z]\b/gi, '[redacted]'));
    return Response.json(redacted);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}