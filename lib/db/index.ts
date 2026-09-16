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
    // Default SQLite behavior lets the WAL file grow to ~1000 pages
    // (several MB, easily months of this app's usage) before folding
    // back into the main .sqlite file. That's what let April-to-September
    // of data live only in the WAL and get lost when that file was
    // deleted. Checkpointing after every single page keeps the main
    // file caught up to within one write, almost all the time.
    _db.pragma("wal_autocheckpoint = 1");
    runMigrations(_db);
    registerShutdownCheckpoint(_db);
  }
  return _db;
}

// Belt-and-suspenders for the case above: on any clean shutdown (dev
// server restart, Ctrl+C, etc.) force a full checkpoint that flushes the
// WAL into the main file and truncates it back to empty. Auto-checkpoint
// can skip a checkpoint if another connection still has a read lock open;
// this runs once more on the way out to catch anything left behind.
function registerShutdownCheckpoint(db: Database.Database): void {
  const flush = () => {
    try {
      db.pragma("wal_checkpoint(TRUNCATE)");
    } catch {
      // best-effort; process is exiting either way
    }
  };
  process.on("exit", flush);
  process.on("SIGINT", () => { flush(); process.exit(0); });
  process.on("SIGTERM", () => { flush(); process.exit(0); });
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

    -- Canonical, categorized technologies (AWS, Kafka, Terraform, ...) that
    -- can be attached to applications, so "which jobs wanted Kafka" is a
    -- real query instead of grepping free-text job descriptions.
    CREATE TABLE IF NOT EXISTS technologies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL DEFAULT 'other',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Alternate spellings ("k8s", "amazon web services") that resolve to a
    -- canonical technology, so tagging doesn't fragment into duplicates.
    CREATE TABLE IF NOT EXISTS technology_aliases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      technology_id INTEGER NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
      alias TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS application_technologies (
      application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      technology_id INTEGER NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
      PRIMARY KEY (application_id, technology_id)
    );
    CREATE INDEX IF NOT EXISTS idx_application_technologies_tech
      ON application_technologies(technology_id);
  `);

  seedTechnologies(db);
}

export const TECH_CATEGORIES = [
  "language",
  "cloud",
  "infra_devops",
  "data_messaging",
  "framework",
  "practice",
  "other",
] as const;

// A starter catalog so search/filter is useful immediately, before the
// user has tagged anything themselves. Tagging a new technology (not in
// this list) is still just a matter of typing it — see findOrCreateTechnology.
const SEED_TECHNOLOGIES: Array<{ name: string; category: (typeof TECH_CATEGORIES)[number]; aliases?: string[] }> = [
  { name: "AWS", category: "cloud", aliases: ["amazon web services"] },
  { name: "GCP", category: "cloud", aliases: ["google cloud", "google cloud platform"] },
  { name: "Azure", category: "cloud" },
  { name: "Kubernetes", category: "infra_devops", aliases: ["k8s"] },
  { name: "Docker", category: "infra_devops" },
  { name: "Terraform", category: "infra_devops" },
  { name: "Ansible", category: "infra_devops" },
  { name: "Kafka", category: "data_messaging" },
  { name: "RabbitMQ", category: "data_messaging" },
  { name: "PostgreSQL", category: "data_messaging", aliases: ["postgres"] },
  { name: "MySQL", category: "data_messaging" },
  { name: "Redis", category: "data_messaging" },
  { name: "Go", category: "language", aliases: ["golang"] },
  { name: "Python", category: "language" },
  { name: "TypeScript", category: "language" },
  { name: "JavaScript", category: "language" },
  { name: "Java", category: "language" },
  { name: "React", category: "framework" },
  { name: "Node.js", category: "framework", aliases: ["nodejs", "node"] },
  { name: "Microservices", category: "practice" },
  { name: "CI/CD", category: "practice", aliases: ["cicd"] },
];

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function seedTechnologies(db: Database.Database): void {
  const count = (db.prepare("SELECT COUNT(*) as c FROM technologies").get() as { c: number }).c;
  if (count > 0) return;

  const insertTech = db.prepare(
    "INSERT INTO technologies (name, slug, category) VALUES (?, ?, ?)"
  );
  const insertAlias = db.prepare(
    "INSERT OR IGNORE INTO technology_aliases (technology_id, alias) VALUES (?, ?)"
  );
  const seed = db.transaction(() => {
    for (const t of SEED_TECHNOLOGIES) {
      const { lastInsertRowid } = insertTech.run(t.name, slugify(t.name), t.category);
      for (const alias of t.aliases ?? []) {
        insertAlias.run(lastInsertRowid, alias.toLowerCase().trim());
      }
    }
  });
  seed();
}
