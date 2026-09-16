"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { MarkdownView } from "@/components/MarkdownEditor";
import { NewInterviewDialog } from "@/components/NewInterviewDialog";
import { NewTakeHomeDialog } from "@/components/NewTakeHomeDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { TechTagInput } from "@/components/TechTagInput";
import type {
  ApplicationWithCompany, ApplicationStatus, Interview, TakeHome, StatusHistory, Technology,
} from "@/lib/types";
import { APPLICATION_STATUSES } from "@/lib/types";

interface AppData extends ApplicationWithCompany {
  status_history: StatusHistory[];
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<AppData | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [takeHomes, setTakeHomes] = useState<TakeHome[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [savingTech, setSavingTech] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editing state
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [editingJD, setEditingJD] = useState(false);
  const [jd, setJd] = useState("");
  const [editingOverview, setEditingOverview] = useState(false);
  const [overviewForm, setOverviewForm] = useState({ source: "", salary_range: "", job_url: "", applied_date: "" });

  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [takeHomeDialogOpen, setTakeHomeDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingInterview, setDeletingInterview] = useState<number | null>(null);
  const [deletingTakeHome, setDeletingTakeHome] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [appRes, interviewsRes, takeHomesRes, techRes] = await Promise.all([
      fetch(`/api/applications/${id}`),
      fetch(`/api/applications/${id}/interviews`),
      fetch(`/api/applications/${id}/takehomes`),
      fetch(`/api/applications/${id}/technologies`),
    ]);
    const appData = await appRes.json();
    setApp(appData);
    setNotes(appData.notes ?? "");
    setJd(appData.job_description ?? "");
    setOverviewForm({
      source: appData.source ?? "",
      salary_range: appData.salary_range ?? "",
      job_url: appData.job_url ?? "",
      applied_date: appData.applied_date ?? "",
    });
    setInterviews(await interviewsRes.json());
    setTakeHomes(await takeHomesRes.json());
    setTechnologies(await techRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const patch = useCallback(async (data: object) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      setApp((prev) => prev ? { ...prev, ...updated } : prev);
      return updated;
    } finally {
      setSaving(false);
    }
  }, [id]);

  const handleStatusChange = (s: ApplicationStatus) => patch({ status: s });

  const saveNotes = async () => {
    await patch({ notes });
    setEditingNotes(false);
  };

  const saveJD = async () => {
    await patch({ job_description: jd });
    setEditingJD(false);
  };

  const saveOverview = async () => {
    await patch({
      source: overviewForm.source || null,
      salary_range: overviewForm.salary_range || null,
      job_url: overviewForm.job_url || null,
      applied_date: overviewForm.applied_date || null,
    });
    setEditingOverview(false);
  };

  const saveTechnologies = async (names: string[]) => {
    setSavingTech(true);
    try {
      const res = await fetch(`/api/applications/${id}/technologies`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technologies: names }),
      });
      setTechnologies(await res.json());
    } finally {
      setSavingTech(false);
    }
  };

  const deleteApp = async () => {
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    router.push("/applications");
  };

  const deleteInterview = async (interviewId: number) => {
    await fetch(`/api/applications/${id}/interviews/${interviewId}`, { method: "DELETE" });
    setInterviews((prev) => prev.filter((i) => i.id !== interviewId));
    setDeletingInterview(null);
  };

  const deleteTakeHome = async (thId: number) => {
    await fetch(`/api/applications/${id}/takehomes/${thId}`, { method: "DELETE" });
    setTakeHomes((prev) => prev.filter((t) => t.id !== thId));
    setDeletingTakeHome(null);
  };

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (!app) return <p className="text-destructive">Application not found.</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/applications" className="hover:underline">Applications</Link>
            <span>/</span>
            <Link href={`/companies/${app.company_id}`} className="hover:underline">
              {app.company_name}
            </Link>
          </div>
          <h1 className="text-2xl font-bold">{app.role_title}</h1>
          <p className="text-muted-foreground">{app.company_name}{app.company_location ? ` · ${app.company_location}` : ""}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Select value={app.status} onValueChange={(v) => handleStatusChange(v as ApplicationStatus)}>
            <SelectTrigger className="w-40">
              <SelectValue>
                <StatusBadge status={app.status} />
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {APPLICATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>Delete</Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jd">Job Description{technologies.length > 0 && ` (${technologies.length})`}</TabsTrigger>
          <TabsTrigger value="interviews">Interviews{interviews.length > 0 && ` (${interviews.length})`}</TabsTrigger>
          <TabsTrigger value="takehomes">Take-homes{takeHomes.length > 0 && ` (${takeHomes.length})`}</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="flex justify-end">
            {editingOverview ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingOverview(false)}>Cancel</Button>
                <Button size="sm" onClick={saveOverview} disabled={saving}>Save</Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditingOverview(true)}>Edit</Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-6">
            {editingOverview ? (
              <>
                <div className="space-y-1">
                  <Label>Source</Label>
                  <Input value={overviewForm.source} onChange={(e) => setOverviewForm((f) => ({ ...f, source: e.target.value }))} placeholder="LinkedIn, Referral…" />
                </div>
                <div className="space-y-1">
                  <Label>Salary Range</Label>
                  <Input value={overviewForm.salary_range} onChange={(e) => setOverviewForm((f) => ({ ...f, salary_range: e.target.value }))} placeholder="€60-75k" />
                </div>
                <div className="space-y-1">
                  <Label>Job URL</Label>
                  <Input value={overviewForm.job_url} onChange={(e) => setOverviewForm((f) => ({ ...f, job_url: e.target.value }))} placeholder="https://…" />
                </div>
                <div className="space-y-1">
                  <Label>Applied Date</Label>
                  <Input type="date" value={overviewForm.applied_date} onChange={(e) => setOverviewForm((f) => ({ ...f, applied_date: e.target.value }))} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Source</p>
                  <p>{app.source || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Salary Range</p>
                  <p>{app.salary_range || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Job URL</p>
                  {app.job_url ? (
                    <a href={app.job_url} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{app.job_url}</a>
                  ) : "—"}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Applied Date</p>
                  <p>{app.applied_date ? format(parseISO(app.applied_date), "d MMMM yyyy") : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Created</p>
                  <p>{format(parseISO(app.created_at), "d MMM yyyy")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Last Updated</p>
                  <p>{format(parseISO(app.updated_at), "d MMM yyyy")}</p>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Job Description */}
        <TabsContent value="jd" className="pt-4 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 items-start">
          <div className="space-y-3 lg:order-1">
            <div className="flex justify-end">
              {editingJD ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditingJD(false); setJd(app.job_description ?? ""); }}>Cancel</Button>
                  <Button size="sm" onClick={saveJD} disabled={saving}>Save</Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditingJD(true)}>Edit</Button>
              )}
            </div>
            {editingJD ? (
              <Textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                rows={20}
                className="font-mono text-sm"
                placeholder="Paste the job description here (markdown supported)…"
              />
            ) : (
              <MarkdownView content={app.job_description} />
            )}
          </div>
          <div className="space-y-2 lg:order-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Technologies{savingTech && " · saving…"}
            </p>
            <TechTagInput
              value={technologies.map((t) => t.name)}
              onChange={saveTechnologies}
            />
          </div>
        </TabsContent>

        {/* Interviews */}
        <TabsContent value="interviews" className="pt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Interview Rounds</h3>
            <Button size="sm" onClick={() => setInterviewDialogOpen(true)}>+ Add Interview</Button>
          </div>
          {interviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">No interviews added yet.</p>
          ) : (
            <div className="space-y-2">
              {interviews.map((i) => (
                <div key={i.id} className="border rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <Link href={`/applications/${id}/interviews/${i.id}`} className="font-medium hover:underline">
                      {i.round_name}
                    </Link>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {i.scheduled_at ? format(parseISO(i.scheduled_at), "d MMM yyyy HH:mm") : "Not scheduled"}
                      {i.format && ` · ${i.format}`}
                      {i.outcome && ` · ${i.outcome}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/applications/${id}/interviews/${i.id}`}>
                      <Button size="sm" variant="outline">Edit</Button>
                    </Link>
                    <Button size="sm" variant="destructive" onClick={() => setDeletingInterview(i.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Take-homes */}
        <TabsContent value="takehomes" className="pt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Take-home Assignments</h3>
            <Button size="sm" onClick={() => setTakeHomeDialogOpen(true)}>+ Add Take-home</Button>
          </div>
          {takeHomes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No take-homes added yet.</p>
          ) : (
            <div className="space-y-2">
              {takeHomes.map((t) => (
                <div key={t.id} className="border rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {t.deadline_at ? `Due ${format(parseISO(t.deadline_at), "d MMM yyyy")}` : "No deadline"}
                      {t.outcome && ` · ${t.outcome}`}
                      {t.submitted_at && ` · Submitted`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/applications/${id}/takehomes/${t.id}`}>
                      <Button size="sm" variant="outline">Edit</Button>
                    </Link>
                    <Button size="sm" variant="destructive" onClick={() => setDeletingTakeHome(t.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="pt-4 space-y-3">
          <div className="flex justify-end">
            {editingNotes ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditingNotes(false); setNotes(app.notes ?? ""); }}>Cancel</Button>
                <Button size="sm" onClick={saveNotes} disabled={saving}>Save</Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditingNotes(true)}>Edit</Button>
            )}
          </div>
          {editingNotes ? (
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              placeholder="Free-form notes about this application…"
            />
          ) : (
            <MarkdownView content={app.notes} />
          )}
        </TabsContent>

        {/* Status History */}
        <TabsContent value="history" className="pt-4">
          {app.status_history.length === 0 ? (
            <p className="text-muted-foreground text-sm">No history yet.</p>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
              {app.status_history.map((h, i) => (
                <div key={h.id} className="relative mb-4">
                  <div className="absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2 border-primary bg-background" />
                  <div className="text-sm">
                    <span className="font-medium">
                      {h.from_status ? `${h.from_status} → ${h.to_status}` : h.to_status}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {format(parseISO(h.changed_at), "d MMM yyyy, HH:mm")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NewInterviewDialog
        open={interviewDialogOpen}
        onOpenChange={setInterviewDialogOpen}
        applicationId={Number(id)}
        onCreated={load}
      />
      <NewTakeHomeDialog
        open={takeHomeDialogOpen}
        onOpenChange={setTakeHomeDialogOpen}
        applicationId={Number(id)}
        onCreated={load}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this application?"
        description="This will also delete all interviews and take-homes associated with it."
        onConfirm={deleteApp}
      />
      <DeleteConfirmDialog
        open={deletingInterview !== null}
        onOpenChange={(o) => !o && setDeletingInterview(null)}
        title="Delete this interview round?"
        onConfirm={() => deletingInterview && deleteInterview(deletingInterview)}
      />
      <DeleteConfirmDialog
        open={deletingTakeHome !== null}
        onOpenChange={(o) => !o && setDeletingTakeHome(null)}
        title="Delete this take-home?"
        onConfirm={() => deletingTakeHome && deleteTakeHome(deletingTakeHome)}
      />
    </div>
  );
}
