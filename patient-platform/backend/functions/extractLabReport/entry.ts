import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Per-user daily LLM quota for document extraction (server-side enforcement).
const DAILY_CAP = 20;
const MAX_FILE_URI_LEN = 500;
const MAX_PROMPT_CHARS = 12000;

function sgtDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body;
    try {
      body = await req.json();
    } catch (_) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { file_uri, json_schema, prompt } = body || {};
    if (!file_uri || typeof file_uri !== 'string' || file_uri.length > MAX_FILE_URI_LEN) {
      return Response.json({ error: 'file_uri is required' }, { status: 400 });
    }
    if (!json_schema || typeof json_schema !== 'object') {
      return Response.json({ error: 'json_schema is required' }, { status: 400 });
    }
    if (prompt != null && (typeof prompt !== 'string' || prompt.length > MAX_PROMPT_CHARS)) {
      return Response.json({ error: `Prompt exceeds ${MAX_PROMPT_CHARS} characters` }, { status: 400 });
    }

    // Quota check (LlmUsage — clients cannot write this entity; only service-role functions can).
    const usageDate = sgtDate();
    const usageRows = await base44.asServiceRole.entities.LlmUsage.filter({ user_email: user.email, usage_date: usageDate }, '-created_date', 1);
    const usage = usageRows[0] || null;
    const purposeCounts = (() => { try { return JSON.parse(usage?.purpose_counts || '{}'); } catch { return {}; } })();
    if ((usage?.call_count || 0) >= DAILY_CAP || (purposeCounts.lab_extraction || 0) >= DAILY_CAP) {
      return Response.json({ error: 'Daily extraction limit reached. Please try again tomorrow.' }, { status: 429 });
    }

    // Signed URL (short expiry) generated server-side; extraction runs in the backend.
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 120 });

    let extracted;
    if (prompt && typeof prompt === 'string') {
      // Prompt-based document extraction (medical documents, pregnancy markers, ...).
      const llmResult = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [signed_url],
        response_json_schema: json_schema,
      });
      extracted = llmResult;
    } else {
      // Schema-based lab-report extraction.
      extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({ file_url: signed_url, json_schema });
    }

    // Increment usage.
    purposeCounts.lab_extraction = (purposeCounts.lab_extraction || 0) + 1;
    const newCount = (usage?.call_count || 0) + 1;
    if (usage?.id) {
      await base44.asServiceRole.entities.LlmUsage.update(usage.id, { call_count: newCount, purpose_counts: JSON.stringify(purposeCounts) });
    } else {
      await base44.asServiceRole.entities.LlmUsage.create({ user_email: user.email, usage_date: usageDate, call_count: newCount, purpose_counts: JSON.stringify(purposeCounts) });
    }

    return Response.json({ extracted });
  } catch (error) {
    console.error('Error:', error.message, error.stack);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});
