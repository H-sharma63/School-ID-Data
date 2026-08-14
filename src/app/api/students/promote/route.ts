// ── /api/students/promote ── //
// GET:  ?schoolId=  → { years: string[] }
//       ?schoolId=&year=  → { years: string[], classes: string[] }
// POST: Promote students in-place — updates class_name, section_name, academic_year directly.
//       toClass === "GRADUATE" marks is_active = 0 instead.
//
// Returns: { promoted, graduated }

import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";

interface PromoteRule {
  fromClass: string;
  toClass: string; // "GRADUATE" is a special value
}

export async function GET(request: NextRequest) {
  try {
    await initDb();

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const year = searchParams.get("year");

    if (!schoolId) {
      return NextResponse.json({ error: "schoolId is required." }, { status: 400 });
    }

    // Always return distinct academic years for this school
    const yearsResult = await db.execute({
      sql: `SELECT DISTINCT academic_year FROM students
            WHERE school_id = ? AND is_active = 1
            ORDER BY academic_year ASC`,
      args: [schoolId],
    });
    const years = yearsResult.rows.map((r: any) => r.academic_year as string);

    // If a year is also provided, return distinct classes for that year
    if (year) {
      const classesResult = await db.execute({
        sql: `SELECT DISTINCT class_name FROM students
              WHERE school_id = ? AND academic_year = ? AND is_active = 1
              ORDER BY class_name ASC`,
        args: [schoolId, year],
      });
      const classes = classesResult.rows.map((r: any) => r.class_name as string);
      return NextResponse.json({ years, classes });
    }

    return NextResponse.json({ years });
  } catch (error: any) {
    console.error("GET /api/students/promote error:", error);
    return NextResponse.json({ error: "Failed to fetch promotion data." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { schoolId, fromYear, toYear, rules } = body as {
      schoolId: string;
      fromYear: string;
      toYear: string;
      rules: PromoteRule[];
    };

    if (!schoolId || !fromYear || !toYear || !Array.isArray(rules) || rules.length === 0) {
      return NextResponse.json(
        { error: "schoolId, fromYear, toYear, and rules[] are required." },
        { status: 400 }
      );
    }

    if (fromYear === toYear) {
      return NextResponse.json({ error: "fromYear and toYear must be different." }, { status: 400 });
    }

    // Verify school exists
    const schoolCheck = await db.execute({
      sql: "SELECT id FROM schools WHERE id = ?",
      args: [schoolId],
    });
    if (schoolCheck.rows.length === 0) {
      return NextResponse.json({ error: "School not found." }, { status: 404 });
    }

    let promoted = 0;
    let graduated = 0;
    const now = new Date().toISOString();

    for (const rule of rules) {
      const { fromClass, toClass } = rule;
      if (!fromClass.trim() || !toClass.trim()) continue;

      if (toClass === "GRADUATE") {
        // Mark all students in this class as graduated (inactive)
        const result = await db.execute({
          sql: `UPDATE students
                SET is_active = 0, updated_at = ?
                WHERE school_id = ? AND academic_year = ? AND class_name = ? AND is_active = 1`,
          args: [now, schoolId, fromYear, fromClass],
        });
        graduated += result.rowsAffected ?? 0;
        continue;
      }

      // Get all distinct section names for this class so we can ensure sections exist
      const sectionsResult = await db.execute({
        sql: `SELECT DISTINCT section_name FROM students
              WHERE school_id = ? AND academic_year = ? AND class_name = ? AND is_active = 1`,
        args: [schoolId, fromYear, fromClass],
      });

      // Ensure target sections exist for each section_name in toClass + toYear
      for (const secRow of sectionsResult.rows as any[]) {
        const sectionName = secRow.section_name as string;

        const existing = await db.execute({
          sql: `SELECT id FROM sections
                WHERE school_id = ? AND class_name = ? AND section_name = ? AND academic_year = ?`,
          args: [schoolId, toClass, sectionName, toYear],
        });

        if (existing.rows.length === 0) {
          const secId = crypto.randomUUID();
          await db.execute({
            sql: `INSERT INTO sections (id, school_id, class_name, section_name, academic_year, created_at)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [secId, schoolId, toClass, sectionName, toYear, now],
          });
        }
      }

      // Update students in-place: new class, new year, new section_id
      // Do it section by section so we can point to the right section row
      for (const secRow of sectionsResult.rows as any[]) {
        const sectionName = secRow.section_name as string;

        // Look up the target section id
        const targetSec = await db.execute({
          sql: `SELECT id FROM sections
                WHERE school_id = ? AND class_name = ? AND section_name = ? AND academic_year = ?`,
          args: [schoolId, toClass, sectionName, toYear],
        });

        if (targetSec.rows.length === 0) continue;
        const targetSectionId = targetSec.rows[0].id as string;

        const updateResult = await db.execute({
          sql: `UPDATE students
                SET class_name = ?, section_name = ?, academic_year = ?,
                    section_id = ?, updated_at = ?
                WHERE school_id = ? AND academic_year = ? AND class_name = ?
                  AND section_name = ? AND is_active = 1`,
          args: [
            toClass, sectionName, toYear,
            targetSectionId, now,
            schoolId, fromYear, fromClass, sectionName,
          ],
        });
        promoted += updateResult.rowsAffected ?? 0;
      }
    }

    // Clean up sections that are now empty (no active students left)
    await db.execute({
      sql: `DELETE FROM sections
            WHERE id NOT IN (
              SELECT DISTINCT section_id FROM students WHERE is_active = 1
            )`,
      args: [],
    });

    return NextResponse.json({ success: true, promoted, graduated });
  } catch (error: any) {
    console.error("POST /api/students/promote error:", error);
    return NextResponse.json({ error: "Promotion failed: " + error.message }, { status: 500 });
  }
}
