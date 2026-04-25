"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import type { Interview, ApplicationWithCompany } from "@/lib/types";

export default function InterviewDetailPage() {
  const { id, interviewId } = useParams<{ id: string; interviewId: string }>();
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [app, setApp] = useState<ApplicationWithCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    round_name: "",
    scheduled_at: "",
    duration_minutes: "",
    format: "",
    interviewer_names: "",
    interviewer_roles: "",
    preparation_notes: "",
    questions_asked: "",
    my_performance_notes: "",
    outcome: "",
  });

  const load = useCallback(async () => {
    const [res, appRes] = await Promise.all([
      fetch(`/api/applications/${id}/interviews/${interviewId}`),
      fetch(`/api/applications/${id}`),
    ]);
    const data = await res.json();
    setInterview(data);
    setApp(await appRes.json());
    setForm({
      round_name: data.round_name ?? "",
      scheduled_at: data.scheduled_at ? data.scheduled_at.slice(0, 16) : "",
      duration_minutes: data.duration_minutes ? String(data.duration_minutes) : "",
      format: data.format ?? "",
      interviewer_names: data.interviewer_names ?? "",
      interviewer_roles: data.interviewer_roles ?? "",
      preparation_notes: data.preparation_notes ?? "",
      questions_asked: data.questions_asked ?? "",
      my_performance_notes: data.my_performance_notes ?? "",
      outcome: data.outcome ?? "",
    });
    setLoading(false);
  }, [id, interviewId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`/api/applications/${id}/interviews/${interviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round_name: form.round_name,
          scheduled_at: form.scheduled_at || null,
          duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
          format: form.format || null,
          interviewer_names: form.interviewer_names || null,
          interviewer_roles: form.interviewer_roles || null,
          preparation_notes: form.preparation_notes || null,
          questions_asked: form.questions_asked || null,
          my_performance_notes: form.my_performance_notes || null,
          outcome: form.outcome || null,
        }),
      });
    } finally {
      setSaving(false);
    }
  };

  const f = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (!interview) return <p className="text-destructive">Interview not found.</p>;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/applications" className="hover:underline">Applications</Link>
          <span>/</span>
          <Link href={`/applications/${id}`} className="hover:underline">{app?.company_name ?? "Application"}</Link>
          <span>/</span>
          <span>Interview</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{form.round_name || "Interview"}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/applications/${id}`)}>Back</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </div>

      {/* Scheduled details */}
      <section className="space-y-4">
        <h2 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide">Scheduled Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Round Name *</Label>
            <Input value={form.round_name} onChange={(e) => f("round_name")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Format</Label>
            <Select value={form.format} onValueChange={(v) => v && f("format")(v)}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {["phone", "video", "onsite", "take-home"].map((fmt) => (
                  <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Scheduled At</Label>
            <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => f("scheduled_at")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Duration (minutes)</Label>
            <Input type="number" value={form.duration_minutes} onChange={(e) => f("duration_minutes")(e.target.value)} placeholder="60" />
          </div>
          <div className="space-y-1">
            <Label>Interviewer Names</Label>
            <Input value={form.interviewer_names} onChange={(e) => f("interviewer_names")(e.target.value)} placeholder="Alice, Bob" />
          </div>
          <div className="space-y-1">
            <Label>Interviewer Roles</Label>
            <Input value={form.interviewer_roles} onChange={(e) => f("interviewer_roles")(e.target.value)} placeholder="Senior Eng, EM" />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide">Preparation Notes</h2>
        <MarkdownEditor value={form.preparation_notes} onChange={f("preparation_notes")} placeholder="What do I want to prep before this interview?" minRows={8} />
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide">Questions Asked</h2>
        <MarkdownEditor value={form.questions_asked} onChange={f("questions_asked")} placeholder="Fill in after the interview…" minRows={8} />
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide">My Performance Notes</h2>
        <MarkdownEditor value={form.my_performance_notes} onChange={f("my_performance_notes")} placeholder="Honest self-assessment after the interview…" minRows={6} />
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide">Outcome</h2>
        <Select value={form.outcome} onValueChange={(v) => v && f("outcome")(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select outcome…" />
          </SelectTrigger>
          <SelectContent>
            {["passed", "failed", "no feedback yet"].map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <div className="flex justify-end pb-8">
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
