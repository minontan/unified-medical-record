export function medicationText(item) {
  const dose = String(item.dose || "").trim();
  const unit = String(item.uom || "").trim();
  const form = String(item.dosage_form || "").trim();
  const doseHasUnit = unit && dose.toLowerCase().endsWith(unit.toLowerCase());
  return [item.drug_name, dose, doseHasUnit ? "" : unit, form.toLowerCase() === unit.toLowerCase() ? "" : form, item.frequency].filter(Boolean).join(" ");
}