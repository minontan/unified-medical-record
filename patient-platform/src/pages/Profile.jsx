import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function Profile() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  // Form state
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [privacyMeasurements, setPrivacyMeasurements] = useState("private");
  const [privacyAppointments, setPrivacyAppointments] = useState("private");
  const [privacyPosts, setPrivacyPosts] = useState("anonymous");
  const [allowDiscovery, setAllowDiscovery] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const u = await base44.auth.me();
    setUser(u);
    setIsAnonymous(u.is_anonymous || false);
    setDisplayName(u.display_name || "");
    setPrivacyMeasurements(u.privacy_measurements || "private");
    setPrivacyAppointments(u.privacy_appointments || "private");
    setPrivacyPosts(u.privacy_posts || "anonymous");
    setAllowDiscovery(u.allow_discovery !== undefined ? u.allow_discovery : true);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      is_anonymous: isAnonymous,
      display_name: displayName || undefined,
      privacy_measurements: privacyMeasurements,
      privacy_appointments: privacyAppointments,
      privacy_posts: privacyPosts,
      allow_discovery: allowDiscovery,
    });
    await loadUser();
    setSaving(false);
    toast.success("Settings saved");
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('profile.title')}</h1>
        <p className="text-sm text-slate-400 mt-1">{t('profile.privacySettings')}</p>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xl font-bold">
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{user?.full_name}</h3>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <p className="text-xs text-teal-600 font-medium mt-1">{user?.role === "admin" ? "Administrator" : "Member"}</p>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{t('profile.privacySettings')}</h3>
            <p className="text-xs text-slate-400">Control what information you share</p>
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div>
            <Label className="text-sm font-medium text-slate-900">Display Name</Label>
            <p className="text-xs text-slate-400 mt-1">Optional name shown in community posts</p>
          </div>
          <div>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. HealthWarrior123"
              className="h-11 rounded-xl border-slate-200"
            />
            <p className="text-xs text-slate-400 mt-1.5">Leave blank to use your real name</p>
          </div>
        </div>

        {/* Anonymous Mode */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <Label className="text-sm font-medium text-slate-900">Anonymous Mode</Label>
              <p className="text-xs text-slate-400 mt-1">Always use display name instead of real name</p>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>
        </div>

        {/* Health Measurements Privacy */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <Label className="text-sm font-medium text-slate-900">Health Measurements</Label>
          <Select value={privacyMeasurements} onValueChange={setPrivacyMeasurements}>
            <SelectTrigger className="h-11 rounded-xl border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">🔒 Private - Only me</SelectItem>
              <SelectItem value="doctors_only">👨‍⚕️ Doctors only - When shared with appointments</SelectItem>
              <SelectItem value="community">👥 Community - Visible in support groups</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Appointments Privacy */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <Label className="text-sm font-medium text-slate-900">Appointments</Label>
          <Select value={privacyAppointments} onValueChange={setPrivacyAppointments}>
            <SelectTrigger className="h-11 rounded-xl border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">🔒 Private - Only me</SelectItem>
              <SelectItem value="doctors_only">👨‍⚕️ Shared with doctors</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Community Posts */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <Label className="text-sm font-medium text-slate-900">Community Posts</Label>
          <Select value={privacyPosts} onValueChange={setPrivacyPosts}>
            <SelectTrigger className="h-11 rounded-xl border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anonymous">🎭 Anonymous - Use display name</SelectItem>
              <SelectItem value="named">👤 Named - Show real name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Discovery Settings */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <Label className="text-sm font-medium text-slate-900">Allow Discovery</Label>
              <p className="text-xs text-slate-400 mt-1">Let others find and add you as a friend</p>
            </div>
            <Switch checked={allowDiscovery} onCheckedChange={setAllowDiscovery} />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white mt-6"
        >
          {saving ? t('common.loading') : t('profile.saveChanges')}
        </Button>
      </div>
    </div>
  );
}