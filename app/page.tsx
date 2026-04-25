"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { StatusBadge } from "@/components/StatusBadge";
import type { ApplicationStatus, ApplicationWithCompany, Interview, Deadline } from "@/lib/types";

const STATUS_ORDER: ApplicationStatus[] = [
  "interested", "applied", "screening", "interviewing", "offer", "rejected", "withdrawn", "ghosted",
];

interface DashboardData {
  statusCounts: Record<string, number>;
  upcomingInterviews: Array<Interview & { company_name: string; role_title: string; application_id: number }>;
  upcomingDeadlines: Array<Deadline & { company_name?: string; role_title?: string }>;
  staleApplications: ApplicationWithCompany[];
  recentActivity: Array<{
    type: string;
    application_id: number;
    company_name: string;
    role_title: string;
    detail: string;
    timestamp: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (!data) return <p className="text-destructive">Failed to load dashboard.</p>;

  const totalActive = (data.statusCounts["applied"] ?? 0) +
    (data.statusCounts["screening"] ?? 0) +
    (data.statusCounts["interviewing"] ?? 0) +
    (data.statusCounts["offer"] ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          {totalActive} active application{totalActive !== 1 ? "s" : ""} in flight
        </p>
      </div>

      {/* Status counters */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          By Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATUS_ORDER.map((s) => {
            const count = data.statusCounts[s] ?? 0;
            return (
              <Link
                key={s}
                href={`/applications?status=${s}`}
                className="border rounded-lg p-4 hover:bg-muted transition-colors"
              >
                <div className="text-2xl font-bold">{count}</div>
                <div className="mt-1">
                  <StatusBadge status={s} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* This week */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          This Week
        </h2>
        {data.upcomingInterviews.length === 0 && data.upcomingDeadlines.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing scheduled in the next 7 days.</p>
        ) : (
          <div className="space-y-2">
            {data.upcomingInterviews.map((i) => (
              <Link
                key={`interview-${i.id}`}
                href={`/applications/${i.application_id}/interviews/${i.id}`}
                className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-muted transition-colors"
              >
                <div>
                  <span className="font-medium">{i.round_name}</span>
                  <span className="text-muted-foreground text-sm ml-2">
                    — {i.company_name} · {i.role_title}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {i.scheduled_at ? format(parseISO(i.scheduled_at), "EEE d MMM, HH:mm") : "—"}
                </div>
              </Link>
            ))}
            {data.upcomingDeadlines.map((d) => (
              <div
                key={`deadline-${d.id}`}
                className="flex items-center justify-between border rounded-lg px-4 py-3 border-dashed"
              >
                <div>
                  <span className="font-medium">{d.title}</span>
                  {d.company_name && (
                    <span className="text-muted-foreground text-sm ml-2">
                      — {d.company_name}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(parseISO(d.due_at), "EEE d MMM")}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Stale applications */}
      {data.staleApplications.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Stale Applications{" "}
            <span className="text-xs normal-case font-normal">(applied &gt;14 days ago, no update)</span>
          </h2>
          <div className="space-y-2">
            {data.staleApplications.map((app) => (
              <Link
                key={app.id}
                href={`/applications/${app.id}`}
                className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-muted transition-colors border-orange-200 dark:border-orange-900"
              >
                <div>
                  <span className="font-medium">{app.company_name}</span>
                  <span className="text-muted-foreground text-sm ml-2">· {app.role_title}</span>
                </div>
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  Applied {app.applied_date ? formatDistanceToNow(parseISO(app.applied_date), { addSuffix: true }) : "—"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent activity */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Recent Activity
        </h2>
        {data.recentActivity.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No activity yet.{" "}
            <Link href="/applications" className="underline">
              Add your first application.
            </Link>
          </p>
        ) : (
          <div className="space-y-1">
            {data.recentActivity.map((a, i) => (
              <Link
                key={i}
                href={`/applications/${a.application_id}`}
                className="flex items-center justify-between px-4 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
              >
                <span>
                  <span className="font-medium">{a.company_name}</span>{" "}
                  <span className="text-muted-foreground">· {a.role_title}</span>{" "}
                  <span className="text-muted-foreground">— {a.detail}</span>
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatDistanceToNow(parseISO(a.timestamp), { addSuffix: true })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
