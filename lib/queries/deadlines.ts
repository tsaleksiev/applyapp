import { getDb } from "@/lib/db";
import type { Deadline } from "@/lib/types";

export function getDeadlinesByApplication(applicationId: number): Deadline[] {
  return getDb()
    .prepare("SELECT * FROM deadlines WHERE application_id = ? ORDER BY due_at ASC")
    .all(applicationId) as Deadline[];
}

export function getUpcomingDeadlines(days = 7): Array<Deadline & { company_name?: string; role_title?: string }> {
  return getDb()
    .prepare(
      `SELECT d.*, c.name as company_name, a.role_title
       FROM deadlines d
       LEFT JOIN applications a ON a.id = d.application_id
       LEFT JOIN companies c ON c.id = a.company_id
       WHERE d.completed = 0
         AND d.due_at >= datetime('now')
         AND d.due_at <= datetime('now', '+' || ? || ' days')
       ORDER BY d.due_at ASC`
    )
    .all(days) as Array<Deadline & { company_name?: string; role_title?: string }>;
}

export function getAllDeadlinesForCalendar(): Array<Deadline & { company_name?: string; role_title?: string }> {
  return getDb()
    .prepare(
      `SELECT d.*, c.name as company_name, a.role_title
       FROM deadlines d
       LEFT JOIN applications a ON a.id = d.application_id
       LEFT JOIN companies c ON c.id = a.company_id
       WHERE d.completed = 0
       ORDER BY d.due_at ASC`
    )
    .all() as Array<Deadline & { company_name?: string; role_title?: string }>;
}

export function createDeadline(data: {
  application_id?: number | null;
  title: string;
  due_at: string;
  notes?: string | null;
}): Deadline {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO deadlines (application_id, title, due_at, notes)
       VALUES (@application_id, @title, @due_at, @notes)`
    )
    .run({
      application_id: data.application_id ?? null,
      title: data.title,
      due_at: data.due_at,
      notes: data.notes ?? null,
    });
  return getDeadlineById(result.lastInsertRowid as number)!;
}

export function getDeadlineById(id: number): Deadline | undefined {
  return getDb()
    .prepare("SELECT * FROM deadlines WHERE id = ?")
    .get(id) as Deadline | undefined;
}

export function updateDeadline(
  id: number,
  data: Partial<Omit<Deadline, "id">>
): Deadline {
  const db = getDb();
  const existing = getDeadlineById(id)!;
  db.prepare(
    `UPDATE deadlines SET
       application_id = @application_id,
       title = @title,
       due_at = @due_at,
       completed = @completed,
       completed_at = @completed_at,
       notes = @notes
     WHERE id = @id`
  ).run({
    id,
    application_id: "application_id" in data ? data.application_id : existing.application_id,
    title: data.title ?? existing.title,
    due_at: data.due_at ?? existing.due_at,
    completed: "completed" in data ? (data.completed ? 1 : 0) : existing.completed,
    completed_at: "completed_at" in data ? data.completed_at : existing.completed_at,
    notes: "notes" in data ? data.notes : existing.notes,
  });
  return getDeadlineById(id)!;
}

export function deleteDeadline(id: number): void {
  getDb().prepare("DELETE FROM deadlines WHERE id = ?").run(id);
}
