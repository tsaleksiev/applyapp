"use client";
import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  interested: { label: "Interested", variant: "secondary" },
  applied: { label: "Applied", variant: "default" },
  screening: { label: "Screening", variant: "default" },
  interviewing: { label: "Interviewing", variant: "default" },
  offer: { label: "Offer", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  withdrawn: { label: "Withdrawn", variant: "outline" },
  ghosted: { label: "Ghosted", variant: "outline" },
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  interested: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  applied: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  screening: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  interviewing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  offer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  withdrawn: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  ghosted: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_CONFIG[status]?.label ?? status}
    </span>
  );
}
