"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isToday, parseISO, isSameDay, addMonths, subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import type { Interview, Deadline } from "@/lib/types";

interface CalData {
  interviews: Array<Interview & { company_name: string; role_title: string; application_id: number }>;
  deadlines: Array<Deadline & { company_name?: string; role_title?: string }>;
}

export default function CalendarPage() {
  const [data, setData] = useState<CalData | null>(null);
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const interviewsOnDay = (day: Date) =>
    data?.interviews.filter((i) => i.scheduled_at && isSameDay(parseISO(i.scheduled_at), day)) ?? [];
  const deadlinesOnDay = (day: Date) =>
    data?.deadlines.filter((d) => isSameDay(parseISO(d.due_at), day)) ?? [];

  const selectedInterviews = selectedDay ? interviewsOnDay(selectedDay) : [];
  const selectedDeadlines = selectedDay ? deadlinesOnDay(selectedDay) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setMonth(subMonths(month, 1))}>← Prev</Button>
          <span className="font-semibold w-36 text-center">{format(month, "MMMM yyyy")}</span>
          <Button variant="outline" size="sm" onClick={() => setMonth(addMonths(month, 1))}>Next →</Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date())}>Today</Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-muted">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center text-xs font-semibold py-2 text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        {/* Day grid */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const interviews = interviewsOnDay(day);
            const deadlines = deadlinesOnDay(day);
            const hasEvents = interviews.length > 0 || deadlines.length > 0;
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date(0)) ? null : day)}
                className={`min-h-[80px] border-b border-r p-2 text-left transition-colors hover:bg-muted/50 ${
                  !isSameMonth(day, month) ? "opacity-30" : ""
                } ${isToday(day) ? "bg-primary/5" : ""} ${isSelected ? "bg-primary/10 ring-2 ring-inset ring-primary" : ""}`}
              >
                <span
                  className={`text-sm font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    isToday(day) ? "bg-primary text-primary-foreground" : ""
                  }`}
                >
                  {format(day, "d")}
                </span>
                {hasEvents && (
                  <div className="mt-1 flex gap-1 flex-wrap">
                    {interviews.map((i) => (
                      <span key={`i-${i.id}`} className="block w-2 h-2 rounded-full bg-blue-500" title={i.round_name} />
                    ))}
                    {deadlines.map((d) => (
                      <span key={`d-${d.id}`} className="block w-2 h-2 rounded-full bg-orange-400" title={d.title} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Interview</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Deadline</span>
      </div>

      {/* Selected day panel */}
      {selectedDay && (selectedInterviews.length > 0 || selectedDeadlines.length > 0) && (
        <div className="border rounded-lg p-4 space-y-3">
          <h2 className="font-semibold">{format(selectedDay, "EEEE, d MMMM yyyy")}</h2>
          {selectedInterviews.map((i) => (
            <Link
              key={i.id}
              href={`/applications/${i.application_id}/interviews/${i.id}`}
              className="block border-l-4 border-blue-500 pl-3 py-1 hover:bg-muted rounded-r"
            >
              <p className="font-medium">{i.round_name}</p>
              <p className="text-sm text-muted-foreground">
                {i.company_name} · {i.role_title}
                {i.scheduled_at && ` · ${format(parseISO(i.scheduled_at), "HH:mm")}`}
                {i.format && ` · ${i.format}`}
              </p>
            </Link>
          ))}
          {selectedDeadlines.map((d) => (
            <div key={d.id} className="border-l-4 border-orange-400 pl-3 py-1">
              <p className="font-medium">{d.title}</p>
              {d.company_name && <p className="text-sm text-muted-foreground">{d.company_name}</p>}
            </div>
          ))}
        </div>
      )}

      {selectedDay && selectedInterviews.length === 0 && selectedDeadlines.length === 0 && (
        <div className="border rounded-lg p-4 text-muted-foreground text-sm">
          Nothing scheduled on {format(selectedDay, "d MMMM yyyy")}.
        </div>
      )}
    </div>
  );
}
