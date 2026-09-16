"use client";
import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { APPLICATION_STATUSES } from "@/lib/types";
import type { Company, ApplicationStatus } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
  preselectedCompanyId?: number;
}

export function NewApplicationDialog({ open, onOpenChange, onCreated, preselectedCompanyId }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("interested");
  const [source, setSource] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/companies").then((r) => r.json()).then(setCompanies);
      if (preselectedCompanyId) setCompanyId(String(preselectedCompanyId));
    }
  }, [open, preselectedCompanyId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!companyId && !newCompanyName.trim()) e.company = "Select or create a company";
    if (!roleTitle.trim()) e.roleTitle = "Role title is required";
    return e;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    try {
      let cid = Number(companyId);
      if (!cid && newCompanyName.trim()) {
        const res = await fetch("/api/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newCompanyName.trim() }),
        });
        const c = await res.json();
        cid = c.id;
      }

      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: cid,
          role_title: roleTitle.trim(),
          status,
          source: source || null,
          job_url: jobUrl || null,
          salary_range: salaryRange || null,
          applied_date: appliedDate || null,
        }),
      });

      onCreated();
      onOpenChange(false);
      setRoleTitle(""); setStatus("interested"); setSource("");
      setJobUrl(""); setSalaryRange(""); setAppliedDate("");
      setNewCompanyName(""); setCompanyId(""); setErrors({});
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="contents">
        <div className="space-y-4 py-2">
          {!preselectedCompanyId && (
            <div className="space-y-2">
              <Label>Company</Label>
              <Select value={companyId} onValueChange={(v) => v && setCompanyId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select existing company…" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!companyId && (
                <Input
                  placeholder="…or type a new company name"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                />
              )}
              {errors.company && <p className="text-destructive text-xs">{errors.company}</p>}
            </div>
          )}

          <div className="space-y-1">
            <Label>Role Title *</Label>
            <Input
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
            />
            {errors.roleTitle && <p className="text-destructive text-xs">{errors.roleTitle}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => v && setStatus(v as ApplicationStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Applied Date</Label>
              <Input type="date" value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Source</Label>
              <Input placeholder="LinkedIn, Referral…" value={source} onChange={(e) => setSource(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Salary Range</Label>
              <Input placeholder="€60-75k" value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Job URL</Label>
            <Input placeholder="https://…" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} />
          </div>

        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
