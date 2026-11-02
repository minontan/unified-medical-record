import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

    const { query, limit = 20 } = body || {};
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return Response.json({ results: [] });
    }

    const q = query.trim().toLowerCase();
    // asServiceRole: bypasses the User entity's self-scoped read RLS (added in the H1 fix) to
    // power friend discovery. Server-side allow_discovery filter — the user directory is never
    // returned wholesale to clients.
    const discoverable = await base44.asServiceRole.entities.User.filter(
      { allow_discovery: true },
      'display_name',
      500
    );

    const results = discoverable
      .filter(u =>
        u.email &&
        u.email !== user.email &&
        (u.email.toLowerCase().includes(q) ||
          (u.full_name || '').toLowerCase().includes(q) ||
          (u.display_name || '').toLowerCase().includes(q))
      )
      .slice(0, limit)
      .map(u => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name || null,
        display_name: u.display_name || null,
        is_anonymous: !!u.is_anonymous,
      }));

    return Response.json({ results });
  } catch (error) {
    console.error('Error:', error.message, error.stack);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});
