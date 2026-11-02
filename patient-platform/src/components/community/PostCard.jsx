import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { hashId } from "@/lib/hashId";
import { Heart, MessageCircle, Clock, Send, EyeOff, Trash2 } from "lucide-react";
import moment from "moment";

const categoryColors = {
  journey: "bg-blue-50 text-blue-600",
  lifestyle: "bg-emerald-50 text-emerald-600",
  nutrition: "bg-orange-50 text-orange-600",
  exercise: "bg-cyan-50 text-cyan-600",
  mental_health: "bg-purple-50 text-purple-600",
  medication: "bg-rose-50 text-rose-600",
  tips: "bg-amber-50 text-amber-600",
  question: "bg-indigo-50 text-indigo-600",
  success_story: "bg-green-50 text-green-600",
};

const categoryLabels = {
  journey: "My Journey", lifestyle: "Lifestyle", nutrition: "Nutrition",
  exercise: "Exercise", mental_health: "Mental Health", medication: "Medication",
  tips: "Tips", question: "Question", success_story: "Success Story",
};

const conditionBadge = {
  hypertension: "bg-rose-100 text-rose-700",
  diabetes: "bg-amber-100 text-amber-700",
  hyperlipidaemia: "bg-violet-100 text-violet-700",
};

const EMOJIS = ["❤️", "👍", "💪", "🙏", "😊", "🌟"];

export default function PostCard({ post, onLike, currentUserEmail, currentUserName }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentPrivacy, setCommentPrivacy] = useState("public");
  const [submitting, setSubmitting] = useState(false);
  const [reactions, setReactions] = useState(() => {
    try { return JSON.parse(post.reactions || "{}"); } catch { return {}; }
  });

  const [myHash, setMyHash] = useState(null);
  useEffect(() => {
    hashId(currentUserEmail).then(setMyHash).catch(() => setMyHash(null));
  }, [currentUserEmail]);

  const isLiked = myHash ? post.liked_by?.split(",").filter(Boolean).includes(myHash) : false;

  const loadComments = async () => {
    if (!commentsLoaded) {
      const data = await base44.entities.PostComment.filter({ post_id: post.id }, "created_date", 50);
      setComments(data);
      setCommentsLoaded(true);
    }
    setShowComments((v) => !v);
  };

  const handleReact = async (emoji) => {
    const prev = { ...reactions };
    const entry = prev[emoji] ? { ...prev[emoji], users: [...prev[emoji].users] } : { count: 0, users: [] };
    const alreadyReacted = myHash ? entry.users.includes(myHash) : false;
    if (alreadyReacted) {
      entry.users = entry.users.filter((u) => u !== myHash);
      entry.count = Math.max(0, entry.count - 1);
    } else if (myHash) {
      entry.users.push(myHash);
      entry.count += 1;
    }
    if (entry.count === 0) {
      delete prev[emoji];
    } else {
      prev[emoji] = entry;
    }
    setReactions(prev);
    await base44.entities.CommunityPost.update(post.id, { reactions: JSON.stringify(prev) });
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    const authorName = commentPrivacy === "anonymous" ? "Anonymous" : (currentUserName || "User");
    const newComment = await base44.entities.PostComment.create({
      post_id: post.id,
      content: commentText.trim(),
      author_name: authorName,
      privacy: commentPrivacy,
    });
    // Update comments_count on post
    await base44.entities.CommunityPost.update(post.id, {
      comments_count: (post.comments_count || 0) + 1,
    });
    setComments((prev) => [...prev, newComment]);
    setCommentText("");
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId) => {
    await base44.entities.PostComment.delete(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    await base44.entities.CommunityPost.update(post.id, {
      comments_count: Math.max(0, (post.comments_count || 1) - 1),
    });
  };

  return (
    <article className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 transition-all hover:shadow-md hover:shadow-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {post.author_name?.charAt(0) || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-slate-900 truncate">{post.author_name}</p>
              {post.privacy === "anonymous" && (
                <EyeOff className="w-3 h-3 text-slate-400 flex-shrink-0" title="Posted anonymously" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>{moment(post.created_date).fromNow()}</span>
            </div>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide whitespace-nowrap flex-shrink-0 ${categoryColors[post.category] || "bg-slate-100 text-slate-600"}`}>
          {categoryLabels[post.category] || post.category}
        </span>
      </div>

      {/* Body */}
      <h3 className="text-base font-semibold text-slate-900 mb-1.5 break-words">{post.title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-3 break-words">{post.content}</p>

      {post.conditions?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.conditions.map((c) => (
            <span key={c} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${conditionBadge[c] || "bg-slate-100 text-slate-600"}`}>
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Emoji reactions */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {EMOJIS.map((emoji) => {
          const entry = reactions[emoji];
          const reacted = myHash ? entry?.users?.includes(myHash) : false;
          return (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm border transition-all
                ${reacted ? "bg-teal-50 border-teal-300 shadow-sm" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}
            >
              <span>{emoji}</span>
              {entry?.count > 0 && <span className="text-xs font-semibold text-slate-600">{entry.count}</span>}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => onLike(post)}
          className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked ? "text-rose-500" : "text-slate-400 hover:text-rose-500"}`}
        >
          <Heart className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} />
          <span className="font-medium">{post.likes_count || 0}</span>
        </button>
        <button
          onClick={loadComments}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-teal-600 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="font-medium">{post.comments_count || 0}</span>
          <span className="text-xs">{showComments ? "Hide" : "Comments"}</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 space-y-3">
          {comments.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {c.author_name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold text-slate-700">{c.author_name}</span>
                      {c.privacy === "anonymous" && <EyeOff className="w-3 h-3 text-slate-400" />}
                      <span className="text-[10px] text-slate-400 ml-auto">{moment(c.created_date).fromNow()}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed break-words">{c.content}</p>
                  </div>
                  {c.created_by === currentUserEmail && (
                    <button onClick={() => handleDeleteComment(c.id)} className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          <form onSubmit={handleComment} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 h-9 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="w-9 h-9 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {/* Comment privacy toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCommentPrivacy(commentPrivacy === "public" ? "anonymous" : "public")}
                className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors
                  ${commentPrivacy === "anonymous" ? "bg-slate-100 border-slate-300 text-slate-600" : "bg-white border-slate-200 text-slate-400"}`}
              >
                <EyeOff className="w-3 h-3" />
                {commentPrivacy === "anonymous" ? "Commenting anonymously" : "Comment anonymously"}
              </button>
            </div>
          </form>
        </div>
      )}
    </article>
  );
}