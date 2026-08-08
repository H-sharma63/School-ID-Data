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
      photo_url TEXT DEFAULT '',
      academic_year TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(school_id, admission_no)
    )`,
  ]);

  // Handle migration if photo_url is missing (in case DB was already created)
  try {
    await db.execute("ALTER TABLE students ADD COLUMN photo_url TEXT DEFAULT ''");
  } catch (e: any) {
    // Ignore error if column already exists
    if (!e.message.includes("duplicate column name")) {
      console.error("Migration error:", e.message);
    }
  }

  initialized = true;
  console.log("Database initialized successfully");
}