import { getDb } from "@/lib/db";
import type { Technology } from "@/lib/types";

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function listTechnologies(): Technology[] {
  return getDb()
    .prepare("SELECT * FROM technologies ORDER BY name ASC")
    .all() as Technology[];
}

/**
 * Resolves free-text input ("k8s", "AWS", "Amazon Web Services") to a
 * canonical technology row, checking the name, slug, and alias table
 * (case-insensitively) before creating a brand new one.
 */
export function findOrCreateTechnology(
  input: string,
  category: Technology["category"] = "other"
): Technology {
  const db = getDb();
  const normalized = input.trim();
  if (!normalized) throw new Error("Technology name is required");
  const slug = slugify(normalized);
  const lower = normalized.toLowerCase();

  const byNameOrSlug = db
    .prepare("SELECT * FROM technologies WHERE lower(name) = ? OR slug = ?")
    .get(lower, slug) as Technology | undefined;
  if (byNameOrSlug) return byNameOrSlug;

  const byAlias = db
    .prepare(
      `SELECT t.* FROM technologies t
       JOIN technology_aliases a ON a.technology_id = t.id
       WHERE lower(a.alias) = ?`
    )
    .get(lower) as Technology | undefined;
  if (byAlias) return byAlias;

  const result = db
    .prepare("INSERT INTO technologies (name, slug, category) VALUES (?, ?, ?)")
    .run(normalized, slug, category);
  return db
    .prepare("SELECT * FROM technologies WHERE id = ?")
    .get(result.lastInsertRowid) as Technology;
}

export function getApplicationTechnologies(applicationId: number): Technology[] {
  return getDb()
    .prepare(
      `SELECT t.* FROM technologies t
       JOIN application_technologies at ON at.technology_id = t.id
       WHERE at.application_id = ?
       ORDER BY t.name ASC`
    )
    .all(applicationId) as Technology[];
}

/** Replaces the full set of technologies tagged on an application. */
export function setApplicationTechnologies(
  applicationId: number,
  technologyInputs: string[]
): Technology[] {
  const db = getDb();
  const replace = db.transaction(() => {
    db.prepare("DELETE FROM application_technologies WHERE application_id = ?").run(applicationId);
    const link = db.prepare(
      "INSERT OR IGNORE INTO application_technologies (application_id, technology_id) VALUES (?, ?)"
    );
    for (const raw of technologyInputs) {
      const name = raw.trim();
      if (!name) continue;
      const tech = findOrCreateTechnology(name);
      link.run(applicationId, tech.id);
    }
  });
  replace();
  return getApplicationTechnologies(applicationId);
}

/** Application ids that are tagged with every one of the given technology slugs. */
export function findApplicationIdsByTechnologies(slugs: string[]): number[] {
  if (slugs.length === 0) return [];
  const db = getDb();
  const placeholders = slugs.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT at.application_id as id, COUNT(DISTINCT t.slug) as matched
       FROM application_technologies at
       JOIN technologies t ON t.id = at.technology_id
       WHERE t.slug IN (${placeholders})
       GROUP BY at.application_id
       HAVING matched = ?`
    )
    .all(...slugs, slugs.length) as { id: number; matched: number }[];
  return rows.map((r) => r.id);
}

export function getTechnologiesForApplications(
  applicationIds: number[]
): Record<number, Technology[]> {
  if (applicationIds.length === 0) return {};
  const db = getDb();
  const placeholders = applicationIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT at.application_id, t.* FROM application_technologies at
       JOIN technologies t ON t.id = at.technology_id
       WHERE at.application_id IN (${placeholders})
       ORDER BY t.name ASC`
    )
    .all(...applicationIds) as (Technology & { application_id: number })[];
  const map: Record<number, Technology[]> = {};
  for (const row of rows) {
    const { application_id, ...tech } = row;
    (map[application_id] ??= []).push(tech);
  }
  return map;
}

export function getTopTechnologies(limit = 10): Array<Technology & { count: number }> {
  return getDb()
    .prepare(
      `SELECT t.*, COUNT(*) as count
       FROM application_technologies at
       JOIN technologies t ON t.id = at.technology_id
       GROUP BY t.id
       ORDER BY count DESC, t.name ASC
       LIMIT ?`
    )
    .all(limit) as Array<Technology & { count: number }>;
}
