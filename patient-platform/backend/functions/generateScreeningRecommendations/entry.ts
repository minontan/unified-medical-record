import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch user health profile and all active protocols in parallel
  const [profiles, protocols] = await Promise.all([
    base44.entities.UserHealthProfile.filter({ created_by: user.email }),
    base44.asServiceRole.entities.ScreeningProtocol.filter({ is_active: true }),
  ]);

  const profile = profiles[0] || null;

  if (!profile) {
    return Response.json({ recommendations: [], profile_incomplete: true });
  }

  // Calculate age
  const dob = new Date(profile.date_of_birth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

  const recommendations = [];

  for (const protocol of protocols) {
    // Gender check
    if (protocol.gender && protocol.gender !== 'all') {
      if (profile.biological_sex !== protocol.gender) continue;
    }

    // Age check
    if (protocol.min_age != null && age < protocol.min_age) continue;
    if (protocol.max_age != null && age > protocol.max_age) continue;

    // Sexually active check (cervical)
    if (protocol.sexually_active_required && !profile.sexually_active_ever) continue;

    // Smoking / lung cancer checks
    if (protocol.min_pack_years != null) {
      if ((profile.pack_years || 0) < protocol.min_pack_years) continue;
    }
    if (protocol.smoking_status_required && protocol.smoking_status_required.length > 0) {
      if (!protocol.smoking_status_required.includes(profile.smoking_status)) continue;
    }

    // APCS score check (colorectal)
    if (protocol.min_apcs_score != null) {
      if ((profile.apcs_score || 0) < protocol.min_apcs_score) continue;
    }

    // Risk factor checks
    if (protocol.required_risk_factors && protocol.required_risk_factors.length > 0) {
      const userRiskFactors = [];
      if (profile.high_risk_breast) userRiskFactors.push('high_risk');
      if (profile.smoking_status === 'current' || profile.smoking_status === 'quit_lt_15y') userRiskFactors.push('smoker');
      if ((profile.family_history_cancers || []).length > 0) userRiskFactors.push('family_history');
      if ((profile.apcs_score || 0) < 4) userRiskFactors.push('average_risk');

      const allMet = protocol.required_risk_factors.every(rf => userRiskFactors.includes(rf));
      if (!allMet) continue;
    }

    recommendations.push({
      cancer_type: protocol.cancer_type,
      test_type: protocol.test_type,
      frequency: protocol.frequency,
      evidence_level: protocol.evidence_level,
      notes: protocol.notes || null,
      protocol_id: protocol.id,
    });
  }

  return Response.json({ recommendations, profile_incomplete: false, age });
  } catch (error) {
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});