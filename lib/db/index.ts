import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "db");
const DB_PATH = path.join(DB_DIR, "applyapp.sqlite");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    runMigrations(_db);
  }
  return _db;
}

const ALL_TABLES = [
  "status_history",
  "deadlines",
  "takehomes",
  "interviews",
  "applications",
  "companies",
] as const;

/**
 * Permanently deletes every row from every table (children first, to
 * respect foreign keys) and resets the autoincrement counters. Irreversible.
 */
export function clearAllData(): void {
  const db = getDb();
  const clear = db.transaction(() => {
    for (const table of ALL_TABLES) {
      db.prepare(`DELETE FROM ${table}`).run();
    }
    const hasSequenceTable = db
      .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'sqlite_sequence'")
      .get();
    if (hasSequenceTable) {
      db.prepare(`DELETE FROM sqlite_sequence WHERE name IN (${ALL_TABLES.map(() => "?").join(",")})`).run(...ALL_TABLES);
    }
  });
  clear();
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      website TEXT,
      location TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      role_title TEXT NOT NULL,
      job_url TEXT,
      job_description TEXT,
      notes TEXT,
      source TEXT,
      status TEXT NOT NULL DEFAULT 'interested',
      applied_date TEXT,
      salary_range TEXT,
      excitement INTEGER CHECK (excitement BETWEEN 1 AND 5),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      round_name TEXT NOT NULL,
      scheduled_at TEXT,
      duration_minutes INTEGER,
      format TEXT,
      interviewer_names TEXT,
      interviewer_roles TEXT,
      preparation_notes TEXT,
      questions_asked TEXT,
      my_performance_notes TEXT,
      outcome TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS takehomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      assigned_at TEXT,
      deadline_at TEXT,
      submitted_at TEXT,
      estimated_hours INTEGER,
      actual_hours INTEGER,
      description TEXT,
      my_solution_url TEXT,
      reflection TEXT,
      outcome TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deadlines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      due_at TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      from_status TEXT,
      to_status TEXT NOT NULL,
      changed_at TEXT NOT NULL DEFAULT (datetime('now')),
      notes TEXT
    );
  `);
}
