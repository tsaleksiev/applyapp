import { getDb } from "@/lib/db";
import type { Company } from "@/lib/types";

export function getAllCompanies(): Company[] {
  return getDb()
    .prepare("SELECT * FROM companies ORDER BY name ASC")
    .all() as Company[];
}

export function getCompanyById(id: number): Company | undefined {
  return getDb()
    .prepare("SELECT * FROM companies WHERE id = ?")
    .get(id) as Company | undefined;
}

export function createCompany(data: {
  name: string;
  website?: string | null;
  location?: string | null;
  notes?: string | null;
}): Company {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO companies (name, website, location, notes)
       VALUES (@name, @website, @location, @notes)`
    )
    .run({
      name: data.name,
      website: data.website ?? null,
      location: data.location ?? null,
      notes: data.notes ?? null,
    });
  return getCompanyById(result.lastInsertRowid as number)!;
}

export function updateCompany(
  id: number,
  data: {
    name?: string;
    website?: string | null;
    location?: string | null;
    notes?: string | null;
  }
): Company {
  const db = getDb();
  const existing = getCompanyById(id)!;
  db.prepare(
    `UPDATE companies SET name=@name, website=@website, location=@location,
     notes=@notes, updated_at=datetime('now') WHERE id=@id`
  ).run({
    id,
    name: data.name ?? existing.name,
    website: "website" in data ? data.website : existing.website,
    location: "location" in data ? data.location : existing.location,
    notes: "notes" in data ? data.notes : existing.notes,
  });
  return getCompanyById(id)!;
}

export function deleteCompany(id: number): void {
  getDb().prepare("DELETE FROM companies WHERE id = ?").run(id);
}
