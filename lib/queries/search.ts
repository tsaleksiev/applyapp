import { getDb } from "@/lib/db";

export interface SearchResult {
  type: "application" | "company" | "interview";
  id: number;
  application_id?: number;
  company_name: string;
  role_title?: string;
  excerpt: string;
  url: string;
}

export function globalSearch(query: string): SearchResult[] {
  const db = getDb();
  const q = `%${query}%`;
  const results: SearchResult[] = [];

  // Search companies
  const companies = db
    .prepare(
      `SELECT id, name, notes FROM companies
       WHERE name LIKE ? OR notes LIKE ?`
    )
    .all(q, q) as { id: number; name: string; notes: string | null }[];
  for (const c of companies) {
    results.push({
      type: "company",
      id: c.id,
      company_name: c.name,
      excerpt: snippet(c.notes ?? c.name, query),
      url: `/companies/${c.id}`,
    });
  }

  // Search applications (role, description, source, or a tagged technology)
  const apps = db
    .prepare(
      `SELECT DISTINCT a.id, a.role_title, a.job_description, a.source, c.name as company_name
       FROM applications a
       JOIN companies c ON c.id = a.company_id
       LEFT JOIN application_technologies at ON at.application_id = a.id
       LEFT JOIN technologies t ON t.id = at.technology_id
       WHERE a.role_title LIKE ? OR a.job_description LIKE ? OR a.source LIKE ? OR t.name LIKE ?`
    )
    .all(q, q, q, q) as {
    id: number;
    role_title: string;
    job_description: string | null;
    source: string | null;
    company_name: string;
  }[];
  for (const a of apps) {
    const techs = db
      .prepare(
        `SELECT t.name FROM application_technologies at
         JOIN technologies t ON t.id = at.technology_id
         WHERE at.application_id = ? ORDER BY t.name ASC`
      )
      .all(a.id) as { name: string }[];
    const matchedByTech = techs.some((t) => t.name.toLowerCase().includes(query.toLowerCase()));
    results.push({
      type: "application",
      id: a.id,
      application_id: a.id,
      company_name: a.company_name,
      role_title: a.role_title,
      excerpt: matchedByTech
        ? `Tagged with: ${techs.map((t) => t.name).join(", ")}`
        : snippet(a.job_description ?? a.role_title, query),
      url: `/applications/${a.id}`,
    });
  }

  // Search interviews
  const interviews = db
    .prepare(
      `SELECT i.id, i.round_name, i.preparation_notes, i.questions_asked, i.my_performance_notes,
              a.id as application_id, a.role_title, c.name as company_name
       FROM interviews i
       JOIN applications a ON a.id = i.application_id
       JOIN companies c ON c.id = a.company_id
       WHERE i.round_name LIKE ? OR i.preparation_notes LIKE ? OR i.questions_asked LIKE ? OR i.my_performance_notes LIKE ?`
    )
    .all(q, q, q, q) as {
    id: number;
    round_name: string;
    preparation_notes: string | null;
    questions_asked: string | null;
    my_performance_notes: string | null;
    application_id: number;
    role_title: string;
    company_name: string;
  }[];
  for (const i of interviews) {
    const text =
      i.questions_asked ?? i.preparation_notes ?? i.my_performance_notes ?? i.round_name;
    results.push({
      type: "interview",
      id: i.id,
      application_id: i.application_id,
      company_name: i.company_name,
      role_title: i.role_title,
      excerpt: snippet(text, query),
      url: `/applications/${i.application_id}/interviews/${i.id}`,
    });
  }

  return results;
}

function snippet(text: string, query: string, radius = 80): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}
