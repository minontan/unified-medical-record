import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const rateLimitStore = (globalThis.__umrGlossaryRateLimit ??= new Map());
const RATE_LIMIT = 40;
const RATE_WINDOW_MS = 60 * 1000;
const MAX_QUERY_LEN = 100;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const now = Date.now();
    const hits = (rateLimitStore.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
    if (hits.length >= RATE_LIMIT) {
      return Response.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }
    hits.push(now);
    rateLimitStore.set(ip, hits);

    const { query, limit = 20 } = await req.json();

    if (!query || query.trim().length < 3) {
      return Response.json({ results: [] });
    }

    const q = query.trim();
    if (q.length > MAX_QUERY_LEN) {
      return Response.json({ error: 'Query too long' }, { status: 400 });
    }

    // Run three targeted DB filters in parallel — one per searchable field.
    // Each returns at most `limit` records, so we fetch a small set fast
    // instead of scanning all 18k rows in memory.
    const [byName, byGeneric, byBrand] = await Promise.all([
      base44.asServiceRole.entities.DrugGlossary.filter(
        { drug_name: { $regex: q, $options: 'i' } }, 'drug_name', limit
      ),
      base44.asServiceRole.entities.DrugGlossary.filter(
        { generic_name: { $regex: q, $options: 'i' } }, 'drug_name', limit
      ),
      base44.asServiceRole.entities.DrugGlossary.filter(
        { brand_name: { $regex: q, $options: 'i' } }, 'drug_name', limit
      ),
    ]);

    // Merge, deduplicate by id, cap at limit
    const seen = new Set();
    const merged = [];
    for (const r of [...byName, ...byGeneric, ...byBrand]) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      merged.push({
        id: r.id,
        drug_name: r.drug_name,
        generic_name: r.generic_name || null,
        brand_name: r.brand_name || null,
        strength: r.strength || null,
        route: r.route || null,
        drug_form: r.drug_form || null,
      });
      if (merged.length >= limit) break;
    }

    return Response.json({ results: merged });
  } catch (error) {
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});