import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [profiles, insights] = await Promise.all([
    base44.entities.UserHealthProfile.filter({ created_by: user.email }),
    base44.asServiceRole.entities.MedicalInsight.filter({ is_active: true }),
  ]);

  const profile = profiles[0] || null;
  if (!profile) {
    return Response.json({ insights: [], profile_incomplete: true });
  }

  // Calculate age
  const dob = new Date(profile.date_of_birth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

  const isSmoker = profile.smoking_status === 'current' || profile.smoking_status === 'quit_lt_15y' || profile.smoking_status === 'quit_gt_15y';
  const matched = [];

  for (const insight of insights) {
    // Sex filter
    if (insight.biological_sex && insight.biological_sex !== 'all') {
      if (profile.biological_sex !== insight.biological_sex) continue;
    }

    // Age filter
    if (insight.min_age != null && age < insight.min_age) continue;
    if (insight.max_age != null && age > insight.max_age) continue;

    // Smoker requirement
    if (insight.requires_smoker === true && !isSmoker) continue;

    // Sexually active requirement
    if (insight.requires_sexually_active === true && !profile.sexually_active_ever) continue;

    // High risk breast requirement
    if (insight.requires_high_risk_breast === true && !profile.high_risk_breast) continue;

    // Pack years minimum
    if (insight.min_pack_years != null && (profile.pack_years || 0) < insight.min_pack_years) continue;

    // APCS score minimum
    if (insight.min_apcs_score != null && (profile.apcs_score || 0) < insight.min_apcs_score) continue;

    // Family history requirement
    if (insight.requires_family_history && insight.requires_family_history.length > 0) {
      const userFH = profile.family_history_cancers || [];
      const hasAny = insight.requires_family_history.some(c => userFH.includes(c));
      if (!hasAny) continue;
    }

    matched.push(insight);
  }

  return Response.json({ insights: matched, profile_incomplete: false, age });
  } catch (error) {
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});