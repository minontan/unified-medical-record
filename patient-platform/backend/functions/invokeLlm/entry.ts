import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Per-user daily LLM quota, enforced server-side via the LlmUsage entity.
const DAILY_CAP = 30;
const PURPOSE_CAPS = { translate_lab_terms: 10, predictive_insights: 10, lab_extraction: 15 };
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

    const { prompt, response_json_schema, purpose = 'general' } = body || {};
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }
    if (prompt.length > MAX_PROMPT_CHARS) {
      return Response.json({ error: `Prompt exceeds ${MAX_PROMPT_CHARS} characters` }, { status: 400 });
    }

    const usageDate = sgtDate();
    const usageRows = await base44.asServiceRole.entities.LlmUsage.filter({ user_email: user.email, usage_date: usageDate }, '-created_date', 1);
    const usage = usageRows[0] || null;
    const purposeCounts = (() => { try { return JSON.parse(usage?.purpose_counts || '{}'); } catch { return {}; } })();
    const purposeCap = PURPOSE_CAPS[purpose];
    if (purposeCap != null && (purposeCounts[purpose] || 0) >= purposeCap) {
      return Response.json({ error: `Daily limit reached for ${purpose}. Please try again tomorrow.` }, { status: 429 });
    }
    if ((usage?.call_count || 0) >= DAILY_CAP) {
      return Response.json({ error: 'Daily LLM limit reached. Please try again tomorrow.' }, { status: 429 });
    }

    const result = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema });

    // Increment usage (client cannot write this entity; only service-role functions can).
    purposeCounts[purpose] = (purposeCounts[purpose] || 0) + 1;
    const newCount = (usage?.call_count || 0) + 1;
    if (usage?.id) {
      await base44.asServiceRole.entities.LlmUsage.update(usage.id, { call_count: newCount, purpose_counts: JSON.stringify(purposeCounts) });
    } else {
      await base44.asServiceRole.entities.LlmUsage.create({ user_email: user.email, usage_date: usageDate, call_count: newCount, purpose_counts: JSON.stringify(purposeCounts) });
    }

    return Response.json({ result });
  } catch (error) {
    console.error('Error:', error.message, error.stack);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});
