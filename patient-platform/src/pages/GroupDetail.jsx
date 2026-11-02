import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { hashId } from "@/lib/hashId";
import PostCard from "@/components/community/PostCard";
import CreatePostForm from "@/components/community/CreatePostForm";
import { ArrowLeft, Plus, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function GroupDetail() {
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const groupId = params.get("id");

  useEffect(() => {
    if (groupId) loadData();
  }, [groupId]);

  const loadData = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const allGroups = await base44.entities.SupportGroup.list("-created_date", 100);
    const g = allGroups.find((gr) => gr.id === groupId);
    setGroup(g);
    const allPosts = await base44.entities.CommunityPost.list("-created_date", 200);
    const groupPosts = allPosts.filter((p) => p.group_id === groupId);
    setPosts(groupPosts);
    setLoading(false);
  };

  const handleCreatePost = async (data) => {
    const authorName = user?.privacy_posts === "named" && !user?.is_anonymous
      ? user?.full_name
      : user?.display_name || "Anonymous";
    // M5 fix: create via server function so trust fields cannot be forged in the payload.
    await base44.functions.invoke("createCommunityPost", { ...data, group_id: groupId, author_name: authorName });
    await loadData();
    setShowForm(false);
  };

  const handleLike = async (post) => {
    // M1 fix: store a hash of the user's email, never the raw email.
    const myHash = await hashId(user.email);
    if (!myHash) return;
    const ids = post.liked_by ? post.liked_by.split(",").filter(Boolean) : [];
    const isLiked = ids.includes(myHash);
    const newIds = isLiked ? ids.filter((i) => i !== myHash) : [...ids, myHash];
    await base44.entities.CommunityPost.update(post.id, {
      liked_by: newIds.join(","),
      likes_count: newIds.length,
    });
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, liked_by: newIds.join(","), likes_count: newIds.length } : p));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Group not found</p>
        <Link to={createPageUrl("Groups")}>
          <Button variant="outline" className="mt-4 rounded-xl">Back to Groups</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to={createPageUrl("Groups")} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Groups
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center border border-teal-100">
            <Users className="w-6 h-6 text-teal-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">{group.name}</h1>
            <p className="text-sm text-slate-400 mt-1">{group.description}</p>
            <p className="text-xs text-slate-400 mt-2">{group.member_count || 0} members</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Group Discussion</h2>
        <Button onClick={() => setShowForm(!showForm)} className="h-9 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 text-sm px-4">
          <Plus className="w-4 h-4" /> Post
        </Button>
      </div>

      {showForm && (
        <CreatePostForm
          onSubmit={handleCreatePost}
          onClose={() => setShowForm(false)}
          userName={(user?.privacy_posts === "named" && !user?.is_anonymous) ? user?.full_name : (user?.display_name || "Anonymous")}
          groupId={groupId}
        />
      )}

      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <p className="text-slate-400 text-sm">No posts in this group yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onLike={handleLike} currentUserEmail={user?.email} />
          ))}
        </div>
      )}
    </div>
  );
}