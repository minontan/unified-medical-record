import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// M2 fix: support-group membership mutations mediated server-side.
// SupportGroup.update RLS is creator-or-admin only, which made client-side
// join/leave fail (403) for groups created by someone else. The service-role
// path below appends/removes the CALLER's email — the server, not the client,
// decides who is a member.
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

    const { group_id, action } = body || {};
    if (!group_id || typeof group_id !== 'string') {
      return Response.json({ error: 'group_id is required' }, { status: 400 });
    }
    if (action !== 'join' && action !== 'leave') {
      return Response.json({ error: 'action must be join or leave' }, { status: 400 });
    }

    const group = await base44.asServiceRole.entities.SupportGroup.get(group_id);
    if (!group) return Response.json({ error: 'Group not found' }, { status: 404 });

    const emails = group.member_emails
      ? group.member_emails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
      : [];
    const userEmail = user.email.toLowerCase();

    if (action === 'join') {
      if (!emails.includes(userEmail)) emails.push(userEmail);
    } else {
      const idx = emails.indexOf(userEmail);
      if (idx >= 0) emails.splice(idx, 1);
    }

    const updated = await base44.asServiceRole.entities.SupportGroup.update(group.id, {
      member_emails: emails.join(','),
      member_count: emails.length,
    });

    return Response.json({ group: updated });
  } catch (error) {
    console.error('Error:', error.message, error.stack);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});
