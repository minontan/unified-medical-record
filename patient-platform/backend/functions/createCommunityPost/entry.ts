import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// M5 fix: community post creation mediated server-side so trust fields
// (liked_by / reactions / likes_count / comments_count) can NEVER be forged
// in the create payload — they are always initialized empty.
const CATEGORIES = ['journey', 'lifestyle', 'nutrition', 'exercise', 'mental_health', 'medication', 'tips', 'question', 'success_story'];
const CONDITIONS = ['hypertension', 'diabetes', 'hyperlipidaemia'];

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

    const { title, content, category, conditions, privacy, author_name, group_id } = body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return Response.json({ error: 'title is required' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return Response.json({ error: 'content is required' }, { status: 400 });
    }
    if (title.length > 200) return Response.json({ error: 'title too long' }, { status: 400 });
    if (content.length > 20000) return Response.json({ error: 'content too long' }, { status: 400 });

    const categoryVal = CATEGORIES.includes(category) ? category : 'journey';
    const conditionsVal = Array.isArray(conditions)
      ? conditions.filter((c) => CONDITIONS.includes(c)).slice(0, 3)
      : [];
    const privacyVal = privacy === 'anonymous' ? 'anonymous' : 'public';
    const authorName = typeof author_name === 'string' && author_name.trim()
      ? author_name.trim().slice(0, 100)
      : 'Anonymous';
    const groupIdVal = typeof group_id === 'string' ? group_id.slice(0, 100) : '';

    const created = await base44.entities.CommunityPost.create({
      title: title.trim(),
      content,
      category: categoryVal,
      conditions: conditionsVal,
      privacy: privacyVal,
      author_name: authorName,
      group_id: groupIdVal,
      liked_by: '',
      likes_count: 0,
      reactions: '{}',
      comments_count: 0,
    });

    return Response.json({ post: created });
  } catch (error) {
    console.error('Error:', error.message, error.stack);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});
