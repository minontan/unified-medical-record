export const DEFAULT_DATE_FORMAT = "slashes";
export const DATE_FORMATS = { ddmmyyyy: "", slashes: "/", dots: "." };

function singaporeDateParts(value) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00+08:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date).map(({ type, value }) => [type, value]));
}

export function singaporeToday() {
  const { year, month, day } = singaporeDateParts(new Date());
  return `${year}-${month}-${day}`;
}

export function formatPrescriptionDate(value, format = DEFAULT_DATE_FORMAT) {
  if (!value) return "—";
  const parts = singaporeDateParts(value);
  if (!parts) return "—";
  return [parts.day, parts.month, parts.year].join(DATE_FORMATS[format] ?? "");
}