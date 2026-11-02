import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import * as XLSX from 'npm:xlsx@0.18.5';

// Fuzzy column matcher — returns the best matching header name for a given set of keywords
function detectColumn(headers, keywords) {
  const lc = headers.map(h => (h || '').toString().toLowerCase().trim());
  // Exact match first
  for (const kw of keywords) {
    const idx = lc.findIndex(h => h === kw.toLowerCase());
    if (idx >= 0) return headers[idx];
  }
  // Partial / contains match
  for (const kw of keywords) {
    const idx = lc.findIndex(h => h.includes(kw.toLowerCase()));
    if (idx >= 0) return headers[idx];
  }
  return null;
}

// Map of field -> keywords to search headers for
const FIELD_KEYWORDS = {
  concept_id:   ['concept_id', 'conceptid', 'concept id', 'id'],
  drug_name:    ['drug_name', 'drug name', 'drugname', 'name', 'product', 'medicine'],
  generic_name: ['drug_name2', 'generic_name', 'generic name', 'generic', 'inn', 'non-proprietary'],
  brand_name:   ['brand', 'brand_name', 'brand name', 'trade name', 'proprietary'],
  drug_form:    ['drug_form', 'form', 'dosage form', 'formulation', 'dose form'],
  strength:     ['strength', 'dosage', 'dose', 'concentration', 'potency'],
  route:        ['route', 'administration', 'route of administration', 'roa'],
};

function buildMapping(headers) {
  const mapping = {};
  for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
    mapping[field] = detectColumn(headers, keywords);
  }
  return mapping;
}

function parseRows(rows, mapping) {
  const colOf = (field) => mapping[field] ? rows[0]?.indexOf(mapping[field]) ?? -1 : -1;
  // Build column index map from header row
  const header = rows[0] || [];
  const idx = {};
  for (const [field, col] of Object.entries(mapping)) {
    idx[field] = col ? header.indexOf(col) : -1;
  }

  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const get = (field) => {
      const ci = idx[field];
      if (ci < 0) return undefined;
      const v = (row[ci] || '').toString().trim();
      return v || undefined;
    };
    const drug_name = get('drug_name');
    if (!drug_name) continue;
    records.push({
      concept_id:   get('concept_id'),
      drug_name,
      generic_name: get('generic_name'),
      brand_name:   get('brand_name'),
      drug_form:    get('drug_form'),
      strength:     get('strength'),
      route:        get('route'),
    });
  }
  return records;
}

// Check if an IPv4 address string belongs to a private, loopback, link-local,
// or CGNAT address space — these must never be reachable via SSRF.
function isPrivateIp(ipStr) {
  const parts = ipStr.split('.');
  if (parts.length !== 4) return false;
  const [a, b] = parts.map(Number);
  if (a === 127 || a === 10 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

// Validate file URL to prevent SSRF — must be HTTPS and must not resolve to
// private/loopback/link-local addresses or cloud metadata endpoints.
// For domain names, DNS resolution is performed via DNS-over-HTTPS (Google DNS)
// to verify that the resolved IP does not belong to a restricted range,
// preventing bypasses where an attacker registers a domain pointing to a
// private or metadata IP address.
async function validateFileUrl(urlStr) {
  let url;
  try { url = new URL(urlStr); } catch { return false; }
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host === 'metadata.google.internal') return false;
  const ipMatch = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    // Host is a literal IP — validate directly
    if (isPrivateIp(host)) return false;
    return true;
  }
  // Host is a domain name — resolve via DNS-over-HTTPS and validate all
  // resolved A records against restricted IP ranges.
  try {
    const dohRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`);
    const dohJson = await dohRes.json();
    const answers = dohJson.Answer || [];
    if (answers.length === 0) return false;
    for (const answer of answers) {
      if (answer.type === 1 && isPrivateIp(answer.data)) return false;
    }
  } catch {
    return false; // DNS resolution failed — fail closed
  }
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { file_url, preview_only } = await req.json();
    if (!file_url) {
      return Response.json({ error: 'No file_url provided' }, { status: 400 });
    }

    // Validate URL to prevent SSRF (must be HTTPS, not resolve to private/internal IPs)
    if (!(await validateFileUrl(file_url))) {
      return Response.json({ error: 'Invalid file URL: must be HTTPS and not point to private or internal addresses' }, { status: 400 });
    }

    // Download the file (redirects rejected — SSRF residual fix)
    const fileRes = await fetch(file_url, { redirect: 'manual' });
    if (fileRes.status >= 300 && fileRes.status < 400) {
      return Response.json({ error: 'Redirects are not allowed' }, { status: 400 });
    }
    const arrayBuffer = await fileRes.arrayBuffer();

    // Detect file type from URL and parse accordingly
    const isCsv = file_url.toLowerCase().includes('.csv');
    let rows;

    if (isCsv) {
      const text = new TextDecoder().decode(arrayBuffer);
      const workbook = XLSX.read(text, { type: 'string' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    } else {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    }

    if (!rows || rows.length < 2) {
      return Response.json({ error: 'File appears empty or has no data rows' }, { status: 400 });
    }

    const headers = (rows[0] || []).map(h => (h || '').toString().trim());
    const mapping = buildMapping(headers);

    if (!mapping.drug_name) {
      return Response.json({
        error: `Could not detect a drug name column. Found headers: ${headers.slice(0, 10).join(', ')}`,
      }, { status: 400 });
    }

    // Preview mode — return mapping + sample rows only
    if (preview_only) {
      const records = parseRows(rows, mapping);
      return Response.json({
        mapping,
        total_rows: records.length,
        sample: records.slice(0, 3),
      });
    }

    // Full import
    const records = parseRows(rows, mapping);

    if (records.length === 0) {
      return Response.json({ error: 'No valid drug records found in file' }, { status: 400 });
    }

    // Delete existing entries in batches
    const batchSize = 200;
    let page = 0;
    while (true) {
      const chunk = await base44.asServiceRole.entities.DrugGlossary.list('drug_name', batchSize);
      if (!chunk.length) break;
      await Promise.all(chunk.map(r => base44.asServiceRole.entities.DrugGlossary.delete(r.id)));
      if (chunk.length < batchSize) break;
      page++;
      if (page > 300) break;
    }

    // Insert in batches of 100
    const BATCH = 100;
    let inserted = 0;
    for (let i = 0; i < records.length; i += BATCH) {
      await base44.asServiceRole.entities.DrugGlossary.bulkCreate(records.slice(i, i + BATCH));
      inserted += BATCH;
    }

    return Response.json({ success: true, inserted, total: records.length, mapping });
  } catch (error) {
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});