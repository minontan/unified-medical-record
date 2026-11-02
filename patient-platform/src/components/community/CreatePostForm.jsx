import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Eye, EyeOff } from "lucide-react";

const categories = [
  { value: "journey", label: "My Journey" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "nutrition", label: "Nutrition" },
  { value: "exercise", label: "Exercise" },
  { value: "mental_health", label: "Mental Health" },
  { value: "medication", label: "Medication" },
  { value: "tips", label: "Tips & Advice" },
  { value: "question", label: "Question" },
  { value: "success_story", label: "Success Story" },
];

const conditions = [
  { value: "hypertension", label: "Hypertension" },
  { value: "diabetes", label: "Diabetes" },
  { value: "hyperlipidaemia", label: "Hyperlipidaemia" },
];

export default function CreatePostForm({ onSubmit, onClose, userName, groupId }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [privacy, setPrivacy] = useState("public");
  const [loading, setLoading] = useState(false);

  const toggleCondition = (c) => {
    setSelectedConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const displayName = privacy === "anonymous" ? "Anonymous" : (userName || "Anonymous");
    await onSubmit({
      title,
      content,
      category,
      conditions: selectedConditions,
      author_name: displayName,
      privacy,
      likes_count: 0,
      liked_by: "",
      comments_count: 0,
      group_id: groupId || "",
    });
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xl shadow-slate-200/50">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900">Share with the Community</h3>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 h-11 rounded-xl border-slate-200"
            placeholder="What's on your mind?"
            required
          />
        </div>

        <div>
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Category</Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger className="mt-1.5 h-11 rounded-xl border-slate-200">
              <SelectValue placeholder="Choose a category..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Content</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1.5 rounded-xl border-slate-200 resize-none"
            rows={4}
            placeholder="Share your experience, tips, or questions..."
            required
          />
        </div>

        <div>
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Related Conditions</Label>
          <div className="flex flex-wrap gap-3">
            {conditions.map((c) => (
              <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedConditions.includes(c.value)}
                  onCheckedChange={() => toggleCondition(c.value)}
                />
                <span className="text-sm text-slate-700">{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Privacy Setting */}
        <div>
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Post Privacy</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPrivacy("public")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors flex-1 justify-center
                ${privacy === "public" ? "bg-teal-50 border-teal-300 text-teal-700" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              <Eye className="w-4 h-4" />
              <span>Public</span>
              <span className="text-[11px] opacity-70 hidden sm:inline">— show my name</span>
            </button>
            <button
              type="button"
              onClick={() => setPrivacy("anonymous")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors flex-1 justify-center
                ${privacy === "anonymous" ? "bg-slate-100 border-slate-400 text-slate-700" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              <EyeOff className="w-4 h-4" />
              <span>Anonymous</span>
              <span className="text-[11px] opacity-70 hidden sm:inline">— hide my name</span>
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={!title || !content || !category || loading}
          className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium"
        >
          {loading ? "Publishing..." : "Publish Post"}
        </Button>
      </form>
    </div>
  );
}