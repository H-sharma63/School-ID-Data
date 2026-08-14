// ── Turso/LibSQL Database Client ── //

import { createClient } from "@libsql/client";

function getDbUrl(): string {
  // In production, set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel env vars
  if (process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }
  // Fallback for development: local SQLite file
  return "file:./school-data.db";
}

function getAuthToken(): string | undefined {
  // Only needed for remote Turso databases
  if (process.env.TURSO_DATABASE_URL?.startsWith("libsql://")) {
    return process.env.TURSO_AUTH_TOKEN;
  }
  return undefined;
}

export const db = createClient({
  url: getDbUrl(),
  authToken: getAuthToken(),
});

// ── Initialize database tables ── //
let initialized = false;

export async function initDb(): Promise<void> {
  if (initialized) return;

  // Turso uses batch for multiple statements
  await db.batch([
    `CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT DEFAULT '',
      official_id TEXT DEFAULT '',
      address TEXT DEFAULT '',
      contact TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,

    `CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      class_name TEXT NOT NULL,
      section_name TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(school_id, class_name, section_name, academic_year)
    )`,

    `CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      admission_no TEXT NOT NULL DEFAULT '',
      student_name TEXT NOT NULL,
      father_name TEXT DEFAULT '',
      mother_name TEXT DEFAULT '',
      dob TEXT DEFAULT '',
      class_name TEXT NOT NULL,
      section_name TEXT NOT NULL,
      mobile_number TEXT DEFAULT '',
      address TEXT DEFAULT '',
      academic_year TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(school_id, admission_no)
    )`,
  ]);

  // Handle migration if columns are missing (in case DB was already created)
  const migrations = [
    "ALTER TABLE schools ADD COLUMN code TEXT DEFAULT ''",
    "ALTER TABLE schools ADD COLUMN official_id TEXT DEFAULT ''",
  ];
  for (const sql of migrations) {
    try {
      await db.execute(sql);
    } catch (e: any) {
      // Ignore error if column already exists
      if (!e.message.includes("duplicate column name")) {
        console.error("Migration error:", e.message);
      }
    }
  }

  initialized = true;
  console.log("Database initialized successfully");
}