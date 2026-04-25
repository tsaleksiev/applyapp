"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import type { TakeHome, ApplicationWithCompany } from "@/lib/types";

export default function TakeHomeDetailPage() {
  const { id, takehomeId } = useParams<{ id: string; takehomeId: string }>();
  const router = useRouter();
  const [_th, setTh] = useState<TakeHome | null>(null);
  const [app, setApp] = useState<ApplicationWithCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    assigned_at: "",
    deadline_at: "",
    submitted_at: "",
    estimated_hours: "",
    actual_hours: "",
    description: "",
    my_solution_url: "",
    reflection: "",
    outcome: "",
  });

  const load = useCallback(async () => {
    const [res, appRes] = await Promise.all([
      fetch(`/api/applications/${id}/takehomes/${takehomeId}`),
      fetch(`/api/applications/${id}`),
    ]);
    const data = await res.json();
    setTh(data);
    setApp(await appRes.json());
    setForm({
      title: data.title ?? "",
      assigned_at: data.assigned_at ? data.assigned_at.slice(0, 16) : "",
      deadline_at: data.deadline_at ? data.deadline_at.slice(0, 16) : "",
      submitted_at: data.submitted_at ? data.submitted_at.slice(0, 16) : "",
      estimated_hours: data.estimated_hours ? String(data.estimated_hours) : "",
      actual_hours: data.actual_hours ? String(data.actual_hours) : "",
      description: data.description ?? "",
      my_solution_url: data.my_solution_url ?? "",
      reflection: data.reflection ?? "",
      outcome: data.outcome ?? "",
    });
    setLoading(false);
  }, [id, takehomeId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`/api/applications/${id}/takehomes/${takehomeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          assigned_at: form.assigned_at || null,
          deadline_at: form.deadline_at || null,
          submitted_at: form.submitted_at || null,
          estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
          actual_hours: form.actual_hours ? Number(form.actual_hours) : null,
          description: form.description || null,
          my_solution_url: form.my_solution_url || null,
          reflection: form.reflection || null,
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

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/applications" className="hover:underline">Applications</Link>
          <span>/</span>
          <Link href={`/applications/${id}`} className="hover:underline">{app?.company_name ?? "Application"}</Link>
          <span>/</span>
          <span>Take-home</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{form.title || "Take-home"}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/applications/${id}`)}>Back</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide">Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 col-span-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => f("title")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Assigned At</Label>
            <Input type="datetime-local" value={form.assigned_at} onChange={(e) => f("assigned_at")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Deadline</Label>
            <Input type="datetime-local" value={form.deadline_at} onChange={(e) => f("deadline_at")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Submitted At</Label>
            <Input type="datetime-local" value={form.submitted_at} onChange={(e) => f("submitted_at")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Outcome</Label>
            <Input value={form.outcome} onChange={(e) => f("outcome")(e.target.value)} placeholder="passed, failed…" />
          </div>
          <div className="space-y-1">
            <Label>Estimated Hours</Label>
            <Input type="number" value={form.estimated_hours} onChange={(e) => f("estimated_hours")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Actual Hours</Label>
            <Input type="number" value={form.actual_hours} onChange={(e) => f("actual_hours")(e.target.value)} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label>My Solution URL</Label>
            <Input value={form.my_solution_url} onChange={(e) => f("my_solution_url")(e.target.value)} placeholder="https://github.com/…" />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide">The Prompt / Description</h2>
        <MarkdownEditor value={form.description} onChange={f("description")} placeholder="Paste the take-home prompt here…" minRows={8} />
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide">Reflection</h2>
        <MarkdownEditor value={form.reflection} onChange={f("reflection")} placeholder="What was hard? What did I learn?" minRows={6} />
      </section>

      <div className="flex justify-end pb-8">
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
