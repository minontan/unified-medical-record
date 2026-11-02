import { base44 } from "@/api/base44Client";

export function makeTraceId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TRC-${ts}-${rand}`;
}

export async function getActorName() {
  try {
    const me = await base44.auth.me();
    return me?.full_name || me?.email || "User";
  } catch {
    return "System";
  }
}

export async function logAudit({ traceId, entityType, entityId, action, details, version = 1, role = "system" }) {
  const actor_name = await getActorName();
  return base44.entities.AuditLog.create({
    trace_id: traceId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    actor_name,
    actor_role: role,
    details: details || "",
    version,
  });
}

const REQUIRED_ITEM_FIELDS = [
  ["drug_name", "medicine name"],
  ["route", "route"],
  ["dose", "dose"],
  ["frequency", "frequency"],
];

export function computeItemFlags(item) {
  const flags = [];
  REQUIRED_ITEM_FIELDS.forEach(([key, label]) => {
    if (!item[key] || String(item[key]).trim() === "") flags.push(`Missing ${label}`);
  });
  if (!String(item.duration || "").trim() && !String(item.quantity || "").trim()) {
    flags.push("Missing duration or quantity");
  }
  // Recompute validation rather than carrying stale saved warnings forward.
  const generatedFlags = new Set([
    ...REQUIRED_ITEM_FIELDS.map(([, label]) => `Missing ${label}`),
    "Missing duration", "Missing quantity", "Missing duration or quantity",
    "Not approved in source system", "Missing approval date",
    "No exact drug glossary match — verify name",
  ]);
  (Array.isArray(item.flags) ? item.flags : []).forEach((f) => {
    if (f && !generatedFlags.has(f) && !flags.includes(f)) flags.push(f);
  });
  return flags;
}