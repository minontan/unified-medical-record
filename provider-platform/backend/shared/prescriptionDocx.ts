import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, ImageRun, AlignmentType } from 'npm:docx@9.5.1';

import { formatPrescriptionDate } from './prescriptionDates.ts';

export async function buildPrescriptionDocx(prescription, resident, items, dateFormat = 'slashes') {
  const paragraph = (text, bold = false) => new Paragraph({ children: [new TextRun({ text: String(text || ''), bold })], spacing: { after: 100 } });
  const cell = (text, bold = false) => new TableCell({ children: String(text || '—').split('\n').map((line) => paragraph(line, bold)) });
  // Optional letterhead logo: deployers set LOGO_URL to their own asset (PNG).
  // No logo ships with the repository - the document renders without one when unset or unreachable.
  const LOGO_URL = '';
  let logo = null;
  if (LOGO_URL) {
    try {
      const logoResponse = await fetch(LOGO_URL);
      if (logoResponse.ok) logo = new Uint8Array(await logoResponse.arrayBuffer());
    } catch { /* logo is optional */ }
  }
  const medicationText = (item) => {
    const dose = String(item.dose || '').trim(), unit = String(item.uom || '').trim(), form = String(item.dosage_form || '').trim();
    return [item.drug_name, dose, unit && dose.toLowerCase().endsWith(unit.toLowerCase()) ? '' : unit, form.toLowerCase() === unit.toLowerCase() ? '' : form, item.frequency].filter(Boolean).join(' ');
  };
  const rows = [new TableRow({ tableHeader: true, children: ['No.', 'Route', 'Medicine Name / Dose / Unit / Form / Frequency', 'Duration / Quantity'].map((text) => cell(text, true)) })];
  items.forEach((item, index) => rows.push(new TableRow({ children: [
    cell(index + 1), cell(item.route),
    cell(medicationText(item)),
    cell([item.duration, [item.quantity, item.uom].filter(Boolean).join(' ')].filter(Boolean).join(' / ')),
  ] })));
  const doc = new Document({ creator: 'Prescription team', title: 'Prescription', styles: { default: { document: { run: { font: 'Arial', size: 22 } } } }, sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 850, bottom: 850, left: 850, right: 850 } } },
    children: [ ...(logo ? [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new ImageRun({ data: logo, type: 'png', transformation: { width: 85, height: 110 } })] })] : []),
      paragraph(`${prescription.facility || '[Facility Name]'}`, true), paragraph(prescription.facility_address),
      paragraph(`Resident: ${resident.name}`, true),
      paragraph('Patient ID: ______________________________'), paragraph(`Level/ward: ${[prescription.ward, prescription.bed].filter(Boolean).join(' / ')}`),
      paragraph(`Gender: ${prescription.gender || '______________________________'}`),
      paragraph(`DOB: ${prescription.date_of_birth || '______________________________'}`),
      paragraph(`Drug Allergy: ${prescription.drug_allergy || '______________________________'}`, !!prescription.drug_allergy),
      paragraph(`Prescription Date: ${formatPrescriptionDate(prescription.prescription_date, dateFormat)}`),
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
      paragraph(''), paragraph("Doctor’s Name: ______________________________"), paragraph('MCR No.: ______________________________'),
      paragraph(''), paragraph('Signature: ______________________________'),
      paragraph(''), paragraph('Date: ______________________________'),
      paragraph(`Trace ID: ${prescription.trace_id} · Version ${prescription.version}`),
      paragraph("Valid only upon the doctor's physical approval and signature."),
    ],
  }] });
  return Packer.toBuffer(doc);
}