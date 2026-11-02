const STATUS = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-700 border-slate-300" },
  in_review: { label: "In Review", cls: "bg-blue-50 text-blue-700 border-blue-300" },
  changes_requested: { label: "Changes Requested", cls: "bg-amber-50 text-amber-700 border-amber-300" },
  approved: { label: "Approved", cls: "bg-teal-50 text-teal-700 border-teal-300" },
  printed: { label: "Printed", cls: "bg-indigo-50 text-indigo-700 border-indigo-300" },
  signed: { label: "Signed", cls: "bg-green-50 text-green-700 border-green-300" },
  transmitted: { label: "Transmitted", cls: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  void: { label: "Void", cls: "bg-red-50 text-red-700 border-red-300" },
};

export default function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, cls: "bg-muted text-muted-foreground border-border" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${s.cls}`}>{s.label}</span>;
}