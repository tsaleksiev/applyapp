import { getDb } from "@/lib/db";
import type { Interview } from "@/lib/types";

export function getInterviewsByApplication(applicationId: number): Interview[] {
  return getDb()
    .prepare(
      `SELECT * FROM interviews WHERE application_id = ? ORDER BY scheduled_at ASC NULLS LAST, created_at ASC`
    )
    .all(applicationId) as Interview[];
}

export function getInterviewById(id: number): Interview | undefined {
  return getDb()
    .prepare("SELECT * FROM interviews WHERE id = ?")
    .get(id) as Interview | undefined;
}

export function getUpcomingInterviews(days = 7): Array<Interview & { company_name: string; role_title: string; application_id: number }> {
  return getDb()
    .prepare(
      `SELECT i.*, c.name as company_name, a.role_title, a.id as application_id
       FROM interviews i
       JOIN applications a ON a.id = i.application_id
       JOIN companies c ON c.id = a.company_id
       WHERE i.scheduled_at >= datetime('now')
         AND i.scheduled_at <= datetime('now', '+' || ? || ' days')
       ORDER BY i.scheduled_at ASC`
    )
    .all(days) as Array<Interview & { company_name: string; role_title: string; application_id: number }>;
}

export function getAllInterviewsForCalendar(): Array<Interview & { company_name: string; role_title: string; application_id: number }> {
  return getDb()
    .prepare(
      `SELECT i.*, c.name as company_name, a.role_title, a.id as application_id
       FROM interviews i
       JOIN applications a ON a.id = i.application_id
       JOIN companies c ON c.id = a.company_id
       WHERE i.scheduled_at IS NOT NULL
       ORDER BY i.scheduled_at ASC`
    )
    .all() as Array<Interview & { company_name: string; role_title: string; application_id: number }>;
}

export function createInterview(data: {
  application_id: number;
  round_name: string;
  scheduled_at?: string | null;
  duration_minutes?: number | null;
  format?: string | null;
  interviewer_names?: string | null;
  interviewer_roles?: string | null;
  preparation_notes?: string | null;
  questions_asked?: string | null;
  my_performance_notes?: string | null;
  outcome?: string | null;
}): Interview {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO interviews
         (application_id, round_name, scheduled_at, duration_minutes, format,
          interviewer_names, interviewer_roles, preparation_notes, questions_asked,
          my_performance_notes, outcome)
       VALUES
         (@application_id, @round_name, @scheduled_at, @duration_minutes, @format,
          @interviewer_names, @interviewer_roles, @preparation_notes, @questions_asked,
          @my_performance_notes, @outcome)`
    )
    .run({
      application_id: data.application_id,
      round_name: data.round_name,
      scheduled_at: data.scheduled_at ?? null,
      duration_minutes: data.duration_minutes ?? null,
      format: data.format ?? null,
      interviewer_names: data.interviewer_names ?? null,
      interviewer_roles: data.interviewer_roles ?? null,
      preparation_notes: data.preparation_notes ?? null,
      questions_asked: data.questions_asked ?? null,
      my_performance_notes: data.my_performance_notes ?? null,
      outcome: data.outcome ?? null,
    });
  return getInterviewById(result.lastInsertRowid as number)!;
}

export function updateInterview(
  id: number,
  data: Partial<Omit<Interview, "id" | "created_at" | "updated_at">>
): Interview {
  const db = getDb();
  const existing = getInterviewById(id)!;
  db.prepare(
    `UPDATE interviews SET
       application_id = @application_id,
       round_name = @round_name,
       scheduled_at = @scheduled_at,
       duration_minutes = @duration_minutes,
       format = @format,
       interviewer_names = @interviewer_names,
       interviewer_roles = @interviewer_roles,
       preparation_notes = @preparation_notes,
       questions_asked = @questions_asked,
       my_performance_notes = @my_performance_notes,
       outcome = @outcome,
       updated_at = datetime('now')
     WHERE id = @id`
  ).run({
    id,
    application_id: data.application_id ?? existing.application_id,
    round_name: data.round_name ?? existing.round_name,
    scheduled_at: "scheduled_at" in data ? data.scheduled_at : existing.scheduled_at,
    duration_minutes: "duration_minutes" in data ? data.duration_minutes : existing.duration_minutes,
    format: "format" in data ? data.format : existing.format,
    interviewer_names: "interviewer_names" in data ? data.interviewer_names : existing.interviewer_names,
    interviewer_roles: "interviewer_roles" in data ? data.interviewer_roles : existing.interviewer_roles,
    preparation_notes: "preparation_notes" in data ? data.preparation_notes : existing.preparation_notes,
    questions_asked: "questions_asked" in data ? data.questions_asked : existing.questions_asked,
    my_performance_notes: "my_performance_notes" in data ? data.my_performance_notes : existing.my_performance_notes,
    outcome: "outcome" in data ? data.outcome : existing.outcome,
  });
  return getInterviewById(id)!;
}

export function deleteInterview(id: number): void {
  getDb().prepare("DELETE FROM interviews WHERE id = ?").run(id);
}
