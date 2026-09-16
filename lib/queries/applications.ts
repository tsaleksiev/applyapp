import { getDb } from "@/lib/db";
import type {
  Application,
  ApplicationStatus,
  ApplicationWithCompany,
  StatusHistory,
} from "@/lib/types";

export function getAllApplications(): ApplicationWithCompany[] {
  const db = getDb();
  const apps = db
    .prepare(
      `SELECT a.*, c.name as company_name, c.website as company_website, c.location as company_location
       FROM applications a
       JOIN companies c ON c.id = a.company_id
       ORDER BY a.updated_at DESC`
    )
    .all() as ApplicationWithCompany[];
  if (apps.length === 0) return apps;

  const techRows = db
    .prepare(
      `SELECT at.application_id, t.slug, t.name
       FROM application_technologies at
       JOIN technologies t ON t.id = at.technology_id
       ORDER BY t.name ASC`
    )
    .all() as { application_id: number; slug: string; name: string }[];
  const byApp = new Map<number, { slug: string; name: string }[]>();
  for (const row of techRows) {
    const list = byApp.get(row.application_id) ?? [];
    list.push({ slug: row.slug, name: row.name });
    byApp.set(row.application_id, list);
  }
  for (const app of apps) {
    app.technologies = byApp.get(app.id) ?? [];
  }
  return apps;
}

export function getApplicationById(
  id: number
): ApplicationWithCompany | undefined {
  return getDb()
    .prepare(
      `SELECT a.*, c.name as company_name, c.website as company_website, c.location as company_location
       FROM applications a
       JOIN companies c ON c.id = a.company_id
       WHERE a.id = ?`
    )
    .get(id) as ApplicationWithCompany | undefined;
}

export function getApplicationsByCompany(
  companyId: number
): ApplicationWithCompany[] {
  return getDb()
    .prepare(
      `SELECT a.*, c.name as company_name, c.website as company_website, c.location as company_location
       FROM applications a
       JOIN companies c ON c.id = a.company_id
       WHERE a.company_id = ?
       ORDER BY a.created_at DESC`
    )
    .all(companyId) as ApplicationWithCompany[];
}

export function createApplication(data: {
  company_id: number;
  role_title: string;
  job_url?: string | null;
  job_description?: string | null;
  source?: string | null;
  status?: ApplicationStatus;
  applied_date?: string | null;
  salary_range?: string | null;
  excitement?: number | null;
}): ApplicationWithCompany {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO applications
         (company_id, role_title, job_url, job_description, source, status, applied_date, salary_range, excitement)
       VALUES
         (@company_id, @role_title, @job_url, @job_description, @source, @status, @applied_date, @salary_range, @excitement)`
    )
    .run({
      company_id: data.company_id,
      role_title: data.role_title,
      job_url: data.job_url ?? null,
      job_description: data.job_description ?? null,
      source: data.source ?? null,
      status: data.status ?? "interested",
      applied_date: data.applied_date ?? null,
      salary_range: data.salary_range ?? null,
      excitement: data.excitement ?? null,
    });
  const id = result.lastInsertRowid as number;
  // record initial status
  db.prepare(
    `INSERT INTO status_history (application_id, from_status, to_status) VALUES (?, NULL, ?)`
  ).run(id, data.status ?? "interested");
  return getApplicationById(id)!;
}

export function updateApplication(
  id: number,
  data: Partial<Omit<Application, "id" | "created_at" | "updated_at">>
): ApplicationWithCompany {
  const db = getDb();
  const existing = getApplicationById(id)!;

  if (data.status && data.status !== existing.status) {
    db.prepare(
      `INSERT INTO status_history (application_id, from_status, to_status) VALUES (?, ?, ?)`
    ).run(id, existing.status, data.status);
  }

  db.prepare(
    `UPDATE applications SET
       company_id = @company_id,
       role_title = @role_title,
       job_url = @job_url,
       job_description = @job_description,
       notes = @notes,
       source = @source,
       status = @status,
       applied_date = @applied_date,
       salary_range = @salary_range,
       excitement = @excitement,
       updated_at = datetime('now')
     WHERE id = @id`
  ).run({
    id,
    company_id: data.company_id ?? existing.company_id,
    role_title: data.role_title ?? existing.role_title,
    job_url: "job_url" in data ? data.job_url : existing.job_url,
    job_description:
      "job_description" in data
        ? data.job_description
        : existing.job_description,
    notes: "notes" in data ? data.notes : existing.notes,
    source: "source" in data ? data.source : existing.source,
    status: data.status ?? existing.status,
    applied_date:
      "applied_date" in data ? data.applied_date : existing.applied_date,
    salary_range:
      "salary_range" in data ? data.salary_range : existing.salary_range,
    excitement: "excitement" in data ? data.excitement : existing.excitement,
  });

  return getApplicationById(id)!;
}

export function deleteApplication(id: number): void {
  getDb().prepare("DELETE FROM applications WHERE id = ?").run(id);
}

export function getStatusHistory(applicationId: number): StatusHistory[] {
  return getDb()
    .prepare(
      `SELECT * FROM status_history WHERE application_id = ? ORDER BY changed_at ASC`
    )
    .all(applicationId) as StatusHistory[];
}

export function getStatusCounts(): Record<string, number> {
  const rows = getDb()
    .prepare(`SELECT status, COUNT(*) as count FROM applications GROUP BY status`)
    .all() as { status: string; count: number }[];
  return Object.fromEntries(rows.map((r) => [r.status, r.count]));
}

export function getStaleApplications(): ApplicationWithCompany[] {
  return getDb()
    .prepare(
      `SELECT a.*, c.name as company_name, c.website as company_website, c.location as company_location
       FROM applications a
       JOIN companies c ON c.id = a.company_id
       WHERE a.status = 'applied'
         AND a.applied_date IS NOT NULL
         AND julianday('now') - julianday(a.applied_date) > 14
       ORDER BY a.applied_date ASC`
    )
    .all() as ApplicationWithCompany[];
}

export function getRecentActivity(limit = 10): Array<{
  type: string;
  application_id: number;
  company_name: string;
  role_title: string;
  detail: string;
  timestamp: string;
}> {
  return getDb()
    .prepare(
      `SELECT
         'status_change' as type,
         a.id as application_id,
         c.name as company_name,
         a.role_title,
         (sh.from_status || ' → ' || sh.to_status) as detail,
         sh.changed_at as timestamp
       FROM status_history sh
       JOIN applications a ON a.id = sh.application_id
       JOIN companies c ON c.id = a.company_id
       ORDER BY sh.changed_at DESC
       LIMIT ?`
    )
    .all(limit) as Array<{
    type: string;
    application_id: number;
    company_name: string;
    role_title: string;
    detail: string;
    timestamp: string;
  }>;
}
