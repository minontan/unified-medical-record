export function containsNationalId(value) {
  return /\b[STFGM]\s*\d{7}\s*[A-Z]\b/i.test(String(value || ""));
}

export function validateInternalIdentity(header) {
  if (!String(header.resident_name || "").trim()) {
    throw new Error("Resident name is required.");
  }
  if (containsNationalId(JSON.stringify(header))) {
    throw new Error("Do not enter national ID numbers in this app. Use the nursing home's internal resident number; fill the patient ID in Word locally.");
  }
}