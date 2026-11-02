export const DATE_FORMATS = { ddmmyyyy: '', slashes: '/', dots: '.' };

export function formatPrescriptionDate(value, format = 'slashes') {
  if (!value) return '—';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00+08:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date).map(({ type, value }) => [type, value]));
  return [parts.day, parts.month, parts.year].join(DATE_FORMATS[format] ?? '');
}