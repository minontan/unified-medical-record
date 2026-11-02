import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Runs on a schedule — checks all users for health alerts and creates notifications
Deno.serve(async (req) => {
  try {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  // H3 fix: scheduled (cron) runs present with a null user; any authenticated caller must
  // be an admin. This prevents regular users from triggering an on-demand full-table
  // health-data scan.
  if (user && user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // H3 fix: minimum-interval guard (hot-reload safe via globalThis) — caps how often the
  // expensive full-table scan can run, including repeated null-user (cron/unauthenticated) hits.
  const MIN_INTERVAL_MS = 6 * 60 * 60 * 1000;
  const lastRun = globalThis.__umrDailyNotifyLastRun || 0;
  const nowMs = Date.now();
  if (nowMs - lastRun < MIN_INTERVAL_MS) {
    return Response.json({ ok: true, skipped: 'interval guard', retry_in_ms: MIN_INTERVAL_MS - (nowMs - lastRun) });
  }
  globalThis.__umrDailyNotifyLastRun = nowMs;

  // Get all users
  const users = await base44.asServiceRole.entities.User.list();

  let totalCreated = 0;

  for (const user of users) {
    const email = user.email;
    const now = new Date();
    const notifications = [];

    // ── 1. Critically abnormal lab results (daily warning) ─────────────────
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const recentLabs = await base44.asServiceRole.entities.LabResult.filter({ created_by: email }, '-collected_at', 100);
    const criticalLabs = recentLabs.filter((r) => {
      if (r.numeric_result == null) return false;
      const low = r.reference_range_low;
      const high = r.reference_range_high;
      if (low == null && high == null) return false;
      const percentLow = low != null ? ((low - r.numeric_result) / low) * 100 : 0;
      const percentHigh = high != null ? ((r.numeric_result - high) / high) * 100 : 0;
      // Flag if >20% outside range
      return percentLow > 20 || percentHigh > 20;
    });

    if (criticalLabs.length > 0) {
      const names = criticalLabs.slice(0, 3).map((r) => r.test_name).join(', ');
      notifications.push({
        user_email: email,
        type: 'lab_result_critical',
        title: `${criticalLabs.length} lab result(s) significantly out of range`,
        message: `The following results are significantly outside normal range: ${names}${criticalLabs.length > 3 ? ` and ${criticalLabs.length - 3} more` : ''}. Please review and consult your doctor.`,
        is_read: false,
        link_page: 'LabResults',
        severity: 'critical',
      });
    }

    // ── 2. Lab result potential unit/data errors ────────────────────────────
    const labErrors = recentLabs.filter((r) => {
      if (r.numeric_result == null) return false;
      // Detect implausible values that suggest unit mismatch
      const name = (r.test_name || '').toLowerCase();
      const val = r.numeric_result;
      // HbA1c: if labelled % but value >20, likely mmol/mol entered as %
      if ((name.includes('hba1c') || name.includes('a1c')) && r.unit?.includes('%') && val > 20) return true;
      // Glucose: if labelled mmol/L but value >30, likely mg/dL
      if (name.includes('glucose') && r.unit?.toLowerCase().includes('mmol') && val > 30) return true;
      // Cholesterol: if mmol/L but >15, likely mg/dL
      if ((name.includes('cholesterol') || name.includes('ldl') || name.includes('hdl')) && r.unit?.toLowerCase().includes('mmol') && val > 15) return true;
      return false;
    });

    if (labErrors.length > 0) {
      const names = labErrors.map((r) => r.test_name).join(', ');
      notifications.push({
        user_email: email,
        type: 'lab_result_error',
        title: 'Possible unit error in lab results',
        message: `The following results may have incorrect units or values: ${names}. Please verify and correct if needed.`,
        is_read: false,
        link_page: 'LabResults',
        severity: 'warning',
      });
    }

    // ── 3. Measurement reminders for out-of-range readings ─────────────────
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentMeasurements = await base44.asServiceRole.entities.HealthMeasurement.filter({ created_by: email }, '-measured_at', 50);

    // Check if last BP was out of range and no new reading in 24h
    const lastBP = recentMeasurements.find((m) => m.measurement_type === 'blood_pressure');
    if (lastBP) {
      const sbp = lastBP.value_primary;
      const dbp = lastBP.value_secondary;
      const isOutOfRange = sbp >= 130 || (dbp && dbp >= 80);
      const hoursSince = (now - new Date(lastBP.measured_at)) / (1000 * 60 * 60);
      if (isOutOfRange && hoursSince > 24) {
        notifications.push({
          user_email: email,
          type: 'measurement_reminder',
          title: 'Blood pressure check reminder',
          message: `Your last BP reading was ${sbp}/${dbp} mmHg (above target). Please log a new reading today to monitor your trend.`,
          is_read: false,
          link_page: 'Measurements',
          severity: 'warning',
        });
      }
    }

    // Check if last glucose was out of range and no new reading in 24h
    const lastGlucose = recentMeasurements.find((m) => m.measurement_type === 'blood_glucose');
    if (lastGlucose) {
      const gval = lastGlucose.value_primary;
      const unit = lastGlucose.unit || 'mmol/L';
      const isMg = unit.toLowerCase().includes('mg');
      const gNorm = isMg ? gval / 18.016 : gval;
      const isOutOfRange = gNorm < 3.9 || gNorm > 10.0;
      const hoursSince = (now - new Date(lastGlucose.measured_at)) / (1000 * 60 * 60);
      if (isOutOfRange && hoursSince > 24) {
        notifications.push({
          user_email: email,
          type: 'measurement_reminder',
          title: 'Blood glucose check reminder',
          message: `Your last glucose reading was ${gval} ${unit} (outside target range). Please log a new reading today.`,
          is_read: false,
          link_page: 'Measurements',
          severity: 'warning',
        });
      }
    }

    // ── 4. Avoid duplicate notifications (check last 24h for same type) ────
    const existingToday = await base44.asServiceRole.entities.Notification.filter(
      { 'data.user_email': email },
      '-created_date',
      50
    );
    const recentTypes = new Set(
      existingToday
        .filter((n) => new Date(n.created_date) > new Date(now.getTime() - 24 * 60 * 60 * 1000))
        .map((n) => n.type)
    );

    const deduped = notifications.filter((n) => !recentTypes.has(n.type));

    if (deduped.length > 0) {
      await base44.asServiceRole.entities.Notification.bulkCreate(deduped);
      totalCreated += deduped.length;
    }
  }

  return Response.json({ ok: true, total_created: totalCreated });
  } catch (error) {
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});