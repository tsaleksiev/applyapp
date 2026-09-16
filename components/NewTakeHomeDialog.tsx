"use client";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  applicationId: number;
  onCreated: () => void;
}

export function NewTakeHomeDialog({ open, onOpenChange, applicationId, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [assignedAt, setAssignedAt] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required";
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    try {
      await fetch(`/api/applications/${applicationId}/takehomes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          assigned_at: assignedAt || null,
          deadline_at: deadlineAt || null,
          estimated_hours: estimatedHours ? Number(estimatedHours) : null,
        }),
      });
      onCreated();
      onOpenChange(false);
      setTitle(""); setAssignedAt(""); setDeadlineAt(""); setEstimatedHours(""); setErrors({});
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Take-home</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="contents">
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Coding challenge" />
            {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Assigned</Label>
              <Input type="datetime-local" value={assignedAt} onChange={(e) => setAssignedAt(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Deadline</Label>
              <Input type="datetime-local" value={deadlineAt} onChange={(e) => setDeadlineAt(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Estimated hours</Label>
            <Input type="number" placeholder="4" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add"}</Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
