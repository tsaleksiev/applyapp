import { getDb } from "@/lib/db";
import type { TakeHome } from "@/lib/types";

export function getTakeHomesByApplication(applicationId: number): TakeHome[] {
  return getDb()
    .prepare("SELECT * FROM takehomes WHERE application_id = ? ORDER BY created_at ASC")
    .all(applicationId) as TakeHome[];
}

export function getTakeHomeById(id: number): TakeHome | undefined {
  return getDb()
    .prepare("SELECT * FROM takehomes WHERE id = ?")
    .get(id) as TakeHome | undefined;
}

export function createTakeHome(data: {
  application_id: number;
  title: string;
  assigned_at?: string | null;
  deadline_at?: string | null;
  submitted_at?: string | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  description?: string | null;
  my_solution_url?: string | null;
  reflection?: string | null;
  outcome?: string | null;
}): TakeHome {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO takehomes
         (application_id, title, assigned_at, deadline_at, submitted_at,
          estimated_hours, actual_hours, description, my_solution_url, reflection, outcome)
       VALUES
         (@application_id, @title, @assigned_at, @deadline_at, @submitted_at,
          @estimated_hours, @actual_hours, @description, @my_solution_url, @reflection, @outcome)`
    )
    .run({
      application_id: data.application_id,
      title: data.title,
      assigned_at: data.assigned_at ?? null,
      deadline_at: data.deadline_at ?? null,
      submitted_at: data.submitted_at ?? null,
      estimated_hours: data.estimated_hours ?? null,
      actual_hours: data.actual_hours ?? null,
      description: data.description ?? null,
      my_solution_url: data.my_solution_url ?? null,
      reflection: data.reflection ?? null,
      outcome: data.outcome ?? null,
    });
  return getTakeHomeById(result.lastInsertRowid as number)!;
}

export function updateTakeHome(
  id: number,
  data: Partial<Omit<TakeHome, "id" | "created_at" | "updated_at">>
): TakeHome {
  const db = getDb();
  const existing = getTakeHomeById(id)!;
  db.prepare(
    `UPDATE takehomes SET
       application_id = @application_id,
       title = @title,
       assigned_at = @assigned_at,
       deadline_at = @deadline_at,
       submitted_at = @submitted_at,
       estimated_hours = @estimated_hours,
       actual_hours = @actual_hours,
       description = @description,
       my_solution_url = @my_solution_url,
       reflection = @reflection,
       outcome = @outcome,
       updated_at = datetime('now')
     WHERE id = @id`
  ).run({
    id,
    application_id: data.application_id ?? existing.application_id,
    title: data.title ?? existing.title,
    assigned_at: "assigned_at" in data ? data.assigned_at : existing.assigned_at,
    deadline_at: "deadline_at" in data ? data.deadline_at : existing.deadline_at,
    submitted_at: "submitted_at" in data ? data.submitted_at : existing.submitted_at,
    estimated_hours: "estimated_hours" in data ? data.estimated_hours : existing.estimated_hours,
    actual_hours: "actual_hours" in data ? data.actual_hours : existing.actual_hours,
    description: "description" in data ? data.description : existing.description,
    my_solution_url: "my_solution_url" in data ? data.my_solution_url : existing.my_solution_url,
    reflection: "reflection" in data ? data.reflection : existing.reflection,
    outcome: "outcome" in data ? data.outcome : existing.outcome,
  });
  return getTakeHomeById(id)!;
}

export function deleteTakeHome(id: number): void {
  getDb().prepare("DELETE FROM takehomes WHERE id = ?").run(id);
}
