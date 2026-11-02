import { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { CheckCircle, Clock, Info } from "lucide-react";

export default function TransferCarePanel({ child, onUpdated }) {
  const [saving, setSaving] = useState(false);

  const isTransferred = child.status === "transferred";
  const isPending = child.status === "transfer_initiated";

  const cancelTransfer = async () => {
    setSaving(true);
    await base44.entities.ChildProfile.update(child.id, {
      status: "active",
      transfer_to_email: null,
      transfer_initiated_at: null
    });
    setSaving(false);
    onUpdated();
  };

  if (isTransferred) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 text-slate-500">
          <CheckCircle className="w-5 h-5 text-teal-500" />
          <span className="text-sm font-medium">Care has been transferred to {child.transfer_to_email}</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">This profile is now managed by the child's own account.</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-700">
          <Clock className="w-5 h-5" />
          <span className="text-sm font-semibold">Transfer Pending</span>
        </div>
        <p className="text-sm text-amber-700">
          Waiting for <strong>{child.transfer_to_email}</strong> to accept and create their account.
        </p>
        <Button variant="outline" size="sm" onClick={cancelTransfer} disabled={saving}>
          Cancel Transfer
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div>
        <h4 className="font-semibold text-slate-800">Transfer of Care</h4>
        <p className="text-sm text-slate-500 mt-1">
          When your child comes of age, you can transfer their health records to their own account.
        </p>
      </div>

      <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500">
          Transfer of care is being completed and will be available soon. Once live, you will be able to
          transfer this child's records to their own Unified Medical Record account.
        </p>
      </div>
    </div>
  );
}