import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { hashId } from "@/lib/hashId";
import PostCard from "@/components/community/PostCard";
import CreatePostForm from "@/components/community/CreatePostForm";
import { Plus, Loader2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const categoryFilters = [
  { value: "all", label: "All Posts" },
  { value: "journey", label: "Journeys" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "nutrition", label: "Nutrition" },
  { value: "exercise", label: "Exercise" },
  { value: "tips", label: "Tips" },
  { value: "question", label: "Questions" },
  { value: "success_story", label: "Success Stories" },
];

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(["all"]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const data = await base44.entities.CommunityPost.filter({ group_id: "" }, "-created_date", 100);
    const allPosts = await base44.entities.CommunityPost.list("-created_date", 100);
    const communityPosts = allPosts.filter((p) => !p.group_id);
    setPosts(communityPosts);
    setLoading(false);
  };

  const handleCreatePost = async (data) => {
    // M5 fix: create via server function so trust fields cannot be forged in the payload.
    await base44.functions.invoke("createCommunityPost", data);
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
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, liked_by: newIds.join(","), likes_count: newIds.length }
          : p
      )
    );
  };

  const toggleFilter = (value) => {
    if (value === "all") {
      setSelectedFilters(["all"]);
    } else {
      let newFilters = selectedFilters.filter(f => f !== "all");
      if (newFilters.includes(value)) {
        newFilters = newFilters.filter(f => f !== value);
        if (newFilters.length === 0) newFilters = ["all"];
      } else {
        newFilters = [...newFilters, value];
      }
      setSelectedFilters(newFilters);
    }
  };

  const filtered = posts
    .filter((p) => selectedFilters.includes("all") || selectedFilters.includes(p.category))
    .filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Community</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Share your journey and connect with others</p>
          
          <Button
            onClick={() => setShowForm(!showForm)}
            className="h-10 sm:h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2 px-4 sm:px-5 text-sm mt-3 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> {showForm ? "Close" : "New Post"}
          </Button>
        </div>

        {/* Search - Desktop: small box, Mobile: icon button */}
        <div className="flex-shrink-0">
          {showSearch ? (
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-9 pr-3 h-10 rounded-xl border-slate-200 text-sm"
                autoFocus
                onBlur={() => !search && setShowSearch(false)}
              />
            </div>
          ) : (
            <Button
              onClick={() => setShowSearch(true)}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-slate-200 lg:hidden"
            >
              <Search className="w-4 h-4" />
            </Button>
          )}
          
          {/* Desktop search always visible */}
          <div className="relative w-48 hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-3 h-10 rounded-xl border-slate-200 text-sm"
            />
          </div>
        </div>
      </div>

      {showForm && (
        <CreatePostForm
          onSubmit={handleCreatePost}
          onClose={() => setShowForm(false)}
          userName={user?.full_name || "User"}
        />
      )}

      {/* Filter Button with Popover */}
      <div className="flex gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-10 rounded-xl border-slate-200 gap-2">
              <Filter className="w-4 h-4" />
              Filter
              {selectedFilters.length > 0 && !selectedFilters.includes("all") && (
                <span className="ml-1 px-1.5 py-0.5 bg-teal-600 text-white text-xs rounded-full">
                  {selectedFilters.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" align="start">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-slate-900">Filter by Category</h4>
              <div className="space-y-2.5">
                {categoryFilters.map((f) => (
                  <div key={f.value} className="flex items-center gap-2">
                    <Checkbox
                      id={f.value}
                      checked={selectedFilters.includes(f.value)}
                      onCheckedChange={() => toggleFilter(f.value)}
                    />
                    <Label
                      htmlFor={f.value}
                      className="text-sm text-slate-700 cursor-pointer flex-1"
                    >
                      {f.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Posts */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center">
          <p className="text-slate-400 text-sm">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              currentUserEmail={user?.email}
              currentUserName={user?.full_name || "User"}
            />
          ))}
        </div>
      )}
    </div>
  );
}