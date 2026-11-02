import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function BookingModal({ doctor, open, onClose, onSubmit, userName }) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [shareMeasurements, setShareMeasurements] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      doctor_id: doctor.id,
      doctor_name: doctor.name,
      patient_name: userName,
      appointment_date: new Date(date).toISOString(),
      reason,
      status: "requested",
      share_measurements: shareMeasurements,
      notes: notes || undefined,
    });
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Book Appointment</DialogTitle>
          <p className="text-sm text-slate-400 mt-1">with Dr. {doctor?.name}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div>
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Preferred Date & Time</Label>
            <Input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 h-11 rounded-xl border-slate-200"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Reason for Visit</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1.5 h-11 rounded-xl border-slate-200"
              placeholder="e.g. Routine check-up, medication review"
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Additional Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1.5 rounded-xl border-slate-200 resize-none"
              rows={2}
              placeholder="Any additional information..."
            />
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-teal-50/50 border border-teal-100 cursor-pointer">
            <Checkbox
              checked={shareMeasurements}
              onCheckedChange={setShareMeasurements}
            />
            <div>
              <p className="text-sm font-medium text-slate-800">Share my health measurements</p>
              <p className="text-xs text-slate-400">Allow the doctor to view your recorded measurements</p>
            </div>
          </label>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!date || loading}
              className="flex-1 h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
            >
              {loading ? "Booking..." : "Request Booking"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}