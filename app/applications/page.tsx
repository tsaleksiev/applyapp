"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { NewApplicationDialog } from "@/components/NewApplicationDialog";
import type { ApplicationStatus, ApplicationWithCompany } from "@/lib/types";
import { APPLICATION_STATUSES } from "@/lib/types";

type SortField = "company_name" | "role_title" | "status" | "applied_date";
type SortDir = "asc" | "desc";

function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });
  const set = useCallback((v: T) => {
    setVal(v);
    localStorage.setItem(key, JSON.stringify(v));
  }, [key]);
  return [val, set];
}

export default function ApplicationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [apps, setApps] = useState<ApplicationWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useLocalStorage<ApplicationStatus[]>("app-status-filter", []);
  const [sortField, setSortField] = useLocalStorage<SortField>("app-sort-field", "company_name");
  const [sortDir, setSortDir] = useLocalStorage<SortDir>("app-sort-dir", "asc");
  const [dialogOpen, setDialogOpen] = useState(false);

  // pre-populate filter from URL param (from dashboard click)
  useEffect(() => {
    const s = searchParams.get("status") as ApplicationStatus | null;
    if (s && APPLICATION_STATUSES.includes(s)) setStatusFilter([s]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then(setApps)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = apps;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.company_name.toLowerCase().includes(q) ||
          a.role_title.toLowerCase().includes(q)
      );
    }
    if (statusFilter.length) {
      list = list.filter((a) => statusFilter.includes(a.status));
    }
    list = [...list].sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [apps, search, statusFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const toggleStatus = (s: ApplicationStatus) => {
    setStatusFilter(
      statusFilter.includes(s) ? statusFilter.filter((x) => x !== s) : [...statusFilter, s]
    );
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Applications</h1>
        <Button onClick={() => setDialogOpen(true)}>+ New Application</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search company or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-1 flex-wrap">
          {APPLICATION_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter.includes(s)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-foreground"
              }`}
            >
              {s}
            </button>
          ))}
          {statusFilter.length > 0 && (
            <button
              onClick={() => setStatusFilter([])}
              className="px-2.5 py-1 rounded-full text-xs border border-dashed text-muted-foreground hover:text-foreground"
            >
              clear
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {apps.length === 0 ? (
            <>
              <p className="text-lg mb-2">No applications yet.</p>
              <p>Click <strong>+ New Application</strong> to add your first one.</p>
            </>
          ) : (
            <p>No applications match your filters.</p>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {(
                  [
                    ["company_name", "Company"],
                    ["role_title", "Role"],
                    ["status", "Status"],
                    ["applied_date", "Applied"],
                  ] as [SortField, string][]
                ).map(([field, label]) => (
                  <th
                    key={field}
                    onClick={() => toggleSort(field)}
                    className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  >
                    {label}
                    <SortIcon field={field} />
                  </th>
                ))}
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Next Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app, i) => (
                <tr
                  key={app.id}
                  onClick={() => router.push(`/applications/${app.id}`)}
                  className={`cursor-pointer hover:bg-muted transition-colors ${
                    i % 2 === 0 ? "" : "bg-muted/30"
                  }`}
                >
                  <td className="px-4 py-3 font-medium">{app.company_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{app.role_title}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {app.applied_date ? format(parseISO(app.applied_date), "d MMM yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {app.status === "applied" ? "Follow up?" :
                     app.status === "interviewing" ? "Prep interviews" :
                     app.status === "offer" ? "Review offer" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewApplicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={load}
      />
    </div>
  );
}
