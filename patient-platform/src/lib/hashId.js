// Deterministic opaque identifier for community like/reaction identity (M1 fix).
// Stores a truncated SHA-256 of the email instead of the raw email so like/reaction
// lists never expose PII. 16 hex chars (64 bits) is collision-safe at community scale
// and stops email enumeration via the public read path.
export async function hashId(email) {
  if (!email || typeof email !== "string") return null;
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email.trim().toLowerCase()));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
  } catch {
    return null;
  }
}
