"use client";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  applicationId: number;
  onCreated: () => void;
}

export function NewInterviewDialog({ open, onOpenChange, applicationId, onCreated }: Props) {
  const [roundName, setRoundName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [format, setFormat] = useState("");
  const [interviewerNames, setInterviewerNames] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!roundName.trim()) e.roundName = "Round name is required";
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    try {
      await fetch(`/api/applications/${applicationId}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round_name: roundName.trim(),
          scheduled_at: scheduledAt || null,
          duration_minutes: durationMinutes ? Number(durationMinutes) : null,
          format: format || null,
          interviewer_names: interviewerNames || null,
        }),
      });
      onCreated();
      onOpenChange(false);
      setRoundName(""); setScheduledAt(""); setDurationMinutes(""); setFormat(""); setInterviewerNames("");
      setErrors({});
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Interview Round</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Round Name *</Label>
            <Input
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              placeholder="e.g. Recruiter screen, Technical 1…"
            />
            {errors.roundName && <p className="text-destructive text-xs">{errors.roundName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Scheduled</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Duration (min)</Label>
              <Input type="number" placeholder="60" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Format</Label>
              <Select value={format} onValueChange={(v) => v && setFormat(v)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {["phone", "video", "onsite", "take-home"].map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Interviewers</Label>
              <Input placeholder="Alice, Bob" value={interviewerNames} onChange={(e) => setInterviewerNames(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Saving…" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
