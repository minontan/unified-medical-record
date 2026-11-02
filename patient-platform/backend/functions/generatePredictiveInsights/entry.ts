import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Redact direct identifiers before sending any data to an LLM.
// Mirrors src/lib/piiMasking.js — backend functions can't import from src/.
function maskIdentifiers(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, 'XXXX EMAIL')
    .replace(/\b[STFG]\d{7}[A-Z]\b/g, 'XXXX ID')
    .replace(/(\+?65[\s-]?)?[689]\d{3}[\s-]?\d{4}\b/g, 'XXXX PHONE');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const email = user.email;

    const [allModels, healthProfiles, medications, labResults] = await Promise.all([
      base44.entities.PredictiveModel.filter({ created_by: email, is_latest: true }, '-computed_at', 20),
      base44.entities.UserHealthProfile.filter({ created_by: email }, '-created_date', 1),
      base44.entities.Medication.filter({ created_by: email }, '-start_date', 100),
      base44.entities.LabResult.filter({ created_by: email }, '-collected_at', 50),
    ]);

    const allergies = healthProfiles[0]?.allergies || [];

    if (!allModels.length) {
      return Response.json({ success: false, message: 'No models found. Run computePredictiveModels first.' });
    }

    // H4 fix: per-user daily quota for the LLM insight loop (enforced via LlmUsage).
    const usageDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const PREDICTIVE_CAP = 10;
    const usageRows = await base44.asServiceRole.entities.LlmUsage.filter({ user_email: email, usage_date: usageDate }, '-created_date', 1);
    const usageRow = usageRows[0] || null;
    const purposeCounts = (() => { try { return JSON.parse(usageRow?.purpose_counts || '{}'); } catch { return {}; } })();
    if ((purposeCounts.predictive_insights || 0) >= PREDICTIVE_CAP || (usageRow?.call_count || 0) >= 30) {
      return Response.json({ success: false, message: 'Daily insight limit reached. Please try again tomorrow.' }, { status: 429 });
    }
    let usageId = usageRow?.id || null;
    let usageTotal = usageRow?.call_count || 0;

    // L6 fix: capture old insight ids for cleanup AFTER successful regeneration
    // (no data loss if the LLM loop fails midway).
    const oldInsightIds = (await base44.entities.PredictiveInsight.filter({ created_by: email }, '-generated_at', 50)).map(i => i.id);

    // Build a concise medication context for the LLM — active meds with dates, recent changes
    const activeMeds = medications.filter(m => m.is_active).map(m =>
      `${m.medication_name}${m.dosage ? ' '+m.dosage : ''}${m.frequency ? ', '+m.frequency : ''}${m.start_date ? ' (started '+m.start_date+')' : ''}${m.condition ? ' ['+m.condition+']' : ''}`
    );
    const recentlyCeased = medications
      .filter(m => !m.is_active && (m.end_date || m.updated_date))
      .sort((a,b) => new Date(b.end_date || b.updated_date) - new Date(a.end_date || a.updated_date))
      .slice(0, 5)
      .map(m => `${m.medication_name}${m.end_date ? ' (ceased '+m.end_date+')' : ''}${m.condition ? ' ['+m.condition+']' : ''}`);

    // Build recent lab context (last 5 results with dates)
    const recentLabs = labResults.slice(0, 10).map(r =>
      `${r.test_name}: ${r.numeric_result != null ? r.numeric_result+' '+r.unit : r.text_result}${r.collected_at ? ' ('+r.collected_at.split('T')[0]+')' : ''}${r.reference_range_text ? ' [ref: '+r.reference_range_text+']' : ''}`
    );

    const medicationContext = [
      activeMeds.length   ? `Active medications: ${activeMeds.join('; ')}` : '',
      recentlyCeased.length ? `Recently ceased: ${recentlyCeased.join('; ')}` : '',
    ].filter(Boolean).join('\n');

    const labContext = recentLabs.length ? `Recent lab results:\n${recentLabs.join('\n')}` : '';

    const generatedAt = new Date().toISOString();
    const createdInsights = [];

    for (const model of allModels) {
      // H4 fix: stop once the daily insight cap is reached.
      if ((purposeCounts.predictive_insights || 0) >= PREDICTIVE_CAP) break;
      const drivers = (() => { try { return JSON.parse(model.key_drivers || '[]'); } catch { return []; } })();
      const clinicalDetail = (() => { try { return JSON.parse(model.clinical_score_detail || '{}'); } catch { return {}; } })();

      // Extract medication effect observations embedded by computePredictiveModels
      const medEffects = clinicalDetail.medication_effects || [];
      const segAnalysis = clinicalDetail.segmented_analysis || null;

      const medEffectNarrative = medEffects.length
        ? `\nMedication effect observations:\n${medEffects.map(e =>
            `• ${e.medication} was ${e.event_type === 'start' ? 'started' : 'stopped'} on ${e.event_date}: average value ${e.direction} by ${Math.abs(e.pct_change)}% (${e.avg_before} → ${e.avg_after})`
          ).join('\n')}`
        : '';

      const segNarrative = (segAnalysis?.before_slope != null && segAnalysis?.after_slope != null)
        ? `\nSegmented trajectory: slope changed from ${segAnalysis.before_slope > 0 ? '+':''}${segAnalysis.before_slope} to ${segAnalysis.after_slope > 0 ? '+':''}${segAnalysis.after_slope} units/month after ${segAnalysis.breakpoint}.`
        : '';

      const allergyContext = allergies.length > 0
        ? `\nPatient Known Allergies: ${allergies.join(', ')}\nIMPORTANT: Flag any recommended medications or substance classes that conflict with these allergies.`
        : '';

      const modelSummary = `
Model: ${model.model_type}
Risk Category: ${model.risk_category}
Risk Score: ${model.risk_score !== null ? Math.round(model.risk_score * 10) / 10 : 'N/A'}
Trend: ${model.trend_direction}
Trend Slope: ${model.trend_slope !== null ? model.trend_slope : 'N/A'} units/month
Data Points Used: ${model.data_points_used}
Key Drivers: ${drivers.join('; ')}${medEffectNarrative}${segNarrative}
      `.trim();

      const prompt = `
You are a clinical health intelligence engine generating personalised insights for a patient's digital health twin.

Rules:
- Write in second-person ("Your HbA1c...")
- Be specific with numbers where available
- Include a clear action recommendation
- Reference relevant clinical thresholds
- Do NOT diagnose — frame as health intelligence and pattern observation
- Keep body under 130 words
- Tone: warm, empowering, evidence-informed
- If medication effect observations are present, explicitly describe the temporal relationship (e.g. "Since starting X in [month], your Y has decreased by Z%")
- If a segmented trajectory change is present, describe the before/after trend meaningfully
- If the medication context shows a relevant active or recently ceased medication, weave it into your narrative${allergyContext}

Model Data:
${modelSummary}

${medicationContext}

${labContext}

Return a JSON object:
{
  "title": "Short headline (max 10 words)",
  "body": "Full explanation with temporal medication context where relevant (max 130 words)",
  "insight_type": one of: trajectory_alert | trend_reversal | risk_threshold_crossed | intervention_opportunity | positive_progress | data_gap_warning | medication_effect,
  "severity": one of: info | positive | warning | urgent,
  "action_recommended": "One clear action step"
}
      `.trim();

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: maskIdentifiers(prompt),
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            body: { type: "string" },
            insight_type: { type: "string" },
            severity: { type: "string" },
            action_recommended: { type: "string" }
          }
        }
      });

      // H4 fix: increment usage after each successful LLM call.
      purposeCounts.predictive_insights = (purposeCounts.predictive_insights || 0) + 1;
      usageTotal += 1;
      if (usageId) {
        await base44.asServiceRole.entities.LlmUsage.update(usageId, { call_count: usageTotal, purpose_counts: JSON.stringify(purposeCounts) });
      } else {
        const created = await base44.asServiceRole.entities.LlmUsage.create({ user_email: email, usage_date: usageDate, call_count: usageTotal, purpose_counts: JSON.stringify(purposeCounts) });
        usageId = created.id;
      }

      // Classify as medication_effect if we have strong evidence
      const insightType = medEffects.length > 0 && result.insight_type !== 'urgent' ? 'medication_effect' : (result.insight_type || 'trajectory_alert');

      const insight = await base44.entities.PredictiveInsight.create({
        insight_type: insightType,
        title: result.title,
        body: result.body,
        severity: result.severity || 'info',
        linked_model_type: model.model_type,
        linked_model_id: model.id,
        action_recommended: result.action_recommended,
        is_dismissed: false,
        generated_at: generatedAt,
        created_by: email
      });

      createdInsights.push({ id: insight.id, model_type: model.model_type, severity: result.severity, med_effects_surfaced: medEffects.length });
    }

    // L6 fix: delete archived insights only after ALL new ones were generated.
    for (const id of oldInsightIds) {
      await base44.entities.PredictiveInsight.delete(id);
    }

    return Response.json({
      success: true,
      insights_generated: createdInsights.length,
      insights: createdInsights
    });

  } catch (error) {
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});