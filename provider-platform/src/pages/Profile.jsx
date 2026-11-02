import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRole } from "@/lib/useRole";
import { logAudit } from "@/lib/audit";

const REG_LABELS = {
  pharmacist: "SPC registration number",
  nurse: "Nursing registration number (SNB)",
};

export default function Profile() {
  const { role } = useRole();
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.auth
      .me()
      .then((me) => {
        setName(me?.profile_name || "");
        setRegNo(me?.registration_number || "");
        setEmail(me?.email || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setError("");
    setSaved(false);
    try {
      await base44.auth.updateMe({ profile_name: name, registration_number: regNo });
      await logAudit({
        traceId: "PROFILE",
        entityType: "UserProfile",
        action: "profile_updated",
        details: `Profile details updated (role context: ${role})`,
        role,
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">My Profile</h2>
        <p className="text-sm text-muted-foreground">
          Your details autofill the pharmacist review attestation and the prescriber block. Profile updates are recorded
          in the audit log.
        </p>
      </div>
      <div className="border rounded-lg bg-card p-4 space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground">Account email</Label>
          <Input className="h-8 text-sm" value={email} disabled />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Role — assigned by your administrator</Label>
          <Input className="h-8 text-sm capitalize" value={role} disabled />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Full name</Label>
          <Input
            className="h-8 text-sm"
            placeholder="As it should appear on attestations and prescriptions"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
          />
        </div>
        {REG_LABELS[role] ? (
          <div>
            <Label className="text-xs text-muted-foreground">{REG_LABELS[role]}</Label>
            <Input
              className="h-8 text-sm"
              placeholder="e.g. MCR 12345A"
              value={regNo}
              onChange={(e) => {
                setRegNo(e.target.value);
                setSaved(false);
              }}
            />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            The Operations role does not require a professional registration number.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <p className="text-sm text-green-600">Saved — your details will autofill forms.</p>}
        <Button onClick={save}>Save profile</Button>
      </div>
    </div>
  );
}