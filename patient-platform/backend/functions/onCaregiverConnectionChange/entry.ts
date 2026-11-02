import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { event, data, old_data } = body;

    // Verify this is a legitimate entity automation event from the Connection entity.
    // Without this check, an external attacker could POST a crafted payload and
    // trigger notifications to arbitrary email addresses.
    if (!event || event.entity_name !== 'Connection' || !event.entity_id) {
      return Response.json({ ok: true, skipped: 'not a Connection entity event' });
    }

    if (!data) return Response.json({ ok: true });

    // Fetch the actual Connection record from the database to verify it exists
    // and use the DB record as the source of truth for notification recipients.
    // This prevents spoofed webhook payloads from sending notifications to
    // email addresses that are not part of a real Connection record.
    let connection;
    try {
      connection = await base44.asServiceRole.entities.Connection.get(event.entity_id);
    } catch {
      return Response.json({ ok: true, skipped: 'entity not found' });
    }

    if (!connection) return Response.json({ ok: true });

    const isCaregiver = connection.relationship === 'caregiver';
    if (!isCaregiver) return Response.json({ ok: true });

    // Use DB-sourced fields for all notification content — these are verified
    // against the actual entity record, not the untrusted webhook payload.
    const user_email = connection.user_email;
    const friend_email = connection.friend_email;
    const friend_name = connection.friend_name;
    const status = connection.status;
    const caregiver_permissions = connection.caregiver_permissions || [];

    const notifications = [];

    if (event?.type === 'create') {
      // Notify sender
      notifications.push({
        user_email,
        type: 'caregiver_invite_sent',
        title: 'Caregiver invitation sent',
        message: `You sent a caregiver access invitation to ${friend_name || friend_email}.`,
        is_read: false,
        link_page: 'CaregiverAccess',
        severity: 'info',
      });
      // Notify receiver
      notifications.push({
        user_email: friend_email,
        type: 'caregiver_invite_received',
        title: 'Caregiver access request received',
        message: `${user_email} has invited you to access their health data as a caregiver.`,
        is_read: false,
        link_page: 'CaregiverAccess',
        severity: 'info',
      });
    }

    if (event?.type === 'update') {
      // old_data.status comes from the platform's automation payload and is used
      // only for transition detection. The current status is verified from the DB.
      const wasAccepted = old_data?.status !== 'accepted' && status === 'accepted';
      const wasDeclined = old_data?.status !== 'declined' && status === 'declined';
      const wasRevoked = old_data?.status === 'accepted' && status === 'declined';

      if (wasAccepted) {
        // Notify both parties
        notifications.push({
          user_email,
          type: 'caregiver_approved',
          title: 'Caregiver access approved',
          message: `${friend_name || friend_email} has accepted your caregiver access invitation.`,
          is_read: false,
          link_page: 'CaregiverAccess',
          severity: 'info',
        });
        const permSummary = caregiver_permissions.length > 0
          ? ` Permitted sections: ${caregiver_permissions.join(', ').replace(/_/g, ' ')}.`
          : '';
        notifications.push({
          user_email: friend_email,
          type: 'caregiver_approved',
          title: 'You approved caregiver access',
          message: `You approved caregiver access for ${user_email}. They can now view the permitted health data.${permSummary}`,
          is_read: false,
          link_page: 'CaregiverAccess',
          severity: 'info',
        });
      }

      if (wasDeclined) {
        notifications.push({
          user_email,
          type: 'caregiver_revoked',
          title: 'Caregiver access declined',
          message: `${friend_name || friend_email} declined your caregiver access invitation.`,
          is_read: false,
          link_page: 'CaregiverAccess',
          severity: 'info',
        });
      }

      if (wasRevoked) {
        notifications.push({
          user_email,
          type: 'caregiver_revoked',
          title: 'Caregiver access revoked',
          message: `Caregiver access with ${friend_name || friend_email} has ended.`,
          is_read: false,
          link_page: 'CaregiverAccess',
          severity: 'info',
        });
      }
    }

    if (notifications.length > 0) {
      await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
    }

    return Response.json({ ok: true, created: notifications.length });
  } catch (error) {
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});