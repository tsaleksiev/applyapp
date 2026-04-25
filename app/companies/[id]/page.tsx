"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { NewApplicationDialog } from "@/components/NewApplicationDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { MarkdownView } from "@/components/MarkdownEditor";
import type { Company, ApplicationWithCompany } from "@/lib/types";

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [applications, setApplications] = useState<ApplicationWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", website: "", location: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    const [cRes, appsRes] = await Promise.all([
      fetch(`/api/companies/${id}`),
      fetch(`/api/applications`),
    ]);
    const c = await cRes.json();
    const allApps = await appsRes.json();
    setCompany(c);
    setApplications(allApps.filter((a: ApplicationWithCompany) => a.company_id === Number(id)));
    setForm({ name: c.name, website: c.website ?? "", location: c.location ?? "", notes: c.notes ?? "" });
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          website: form.website || null,
          location: form.location || null,
          notes: form.notes || null,
        }),
      });
      const updated = await res.json();
      setCompany(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const deleteCompany = async () => {
    await fetch(`/api/companies/${id}`, { method: "DELETE" });
    router.push("/companies");
  };

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (!company) return <p className="text-destructive">Company not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/companies" className="hover:underline">Companies</Link>
            <span>/</span>
            <span>{company.name}</span>
          </div>
          <h1 className="text-2xl font-bold">{company.name}</h1>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>Edit</Button>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Delete</Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-4 border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="space-y-1">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Sofia / Remote-EU" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Notes (markdown)</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={6}
              className="font-mono text-sm"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {company.website && (
              <div>
                <p className="text-muted-foreground mb-0.5">Website</p>
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary underline">{company.website}</a>
              </div>
            )}
            {company.location && (
              <div>
                <p className="text-muted-foreground mb-0.5">Location</p>
                <p>{company.location}</p>
              </div>
            )}
          </div>
          {company.notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <MarkdownView content={company.notes} />
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Applications ({applications.length})</h2>
          <Button size="sm" onClick={() => setAppDialogOpen(true)}>+ Add Application</Button>
        </div>
        {applications.length === 0 ? (
          <p className="text-muted-foreground text-sm">No applications to this company yet.</p>
        ) : (
          <div className="space-y-2">
            {applications.map((a) => (
              <Link
                key={a.id}
                href={`/applications/${a.id}`}
                className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-muted transition-colors"
              >
                <div>
                  <p className="font-medium">{a.role_title}</p>
                  {a.source && <p className="text-sm text-muted-foreground">via {a.source}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={a.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <NewApplicationDialog
        open={appDialogOpen}
        onOpenChange={setAppDialogOpen}
        onCreated={load}
        preselectedCompanyId={Number(id)}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this company?"
        description="This will also delete all applications, interviews, and take-homes linked to this company."
        onConfirm={deleteCompany}
      />
    </div>
  );
}
