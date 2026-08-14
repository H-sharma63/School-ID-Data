// ── /api/students/import ── //
// POST: Bulk-import students into one school/class/section/year context.
// Body: { schoolId, className, sectionName, academicYear, students: RawStudent[], perRow?: boolean }
//   RawStudent fields (all already string-mapped by the client):
//     admissionNo, studentName, fatherName, motherName, dob, mobileNumber, address
// Behavior:
//   - Ensures the target section exists (created once).
//   - Inserts students in a batch.
//   - Skips rows whose admissionNo already exists in this school (UNIQUE constraint) OR invalid rows.
//   - Returns { inserted, skipped: [{row, admissionNo, name, reason}] }.

import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";

interface RawStudent {
  admissionNo?: string;
  studentName?: string;
  fatherName?: string;
  motherName?: string;
  dob?: string;
  mobileNumber?: string;
  address?: string;
}

export async function POST(request: NextRequest) {
  try {
    await initDb();

    let body: {
      schoolId?: string;
      className?: string;
      sectionName?: string;
      academicYear?: string;
      students?: RawStudent[];
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { schoolId, className, sectionName, academicYear, students } = body;

    if (!schoolId || !className || !sectionName || !academicYear) {
      return NextResponse.json(
        { error: "schoolId, className, sectionName, and academicYear are required." },
        { status: 400 }
      );
    }
    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: "No students to import." }, { status: 400 });
    }

    // Validate school exists
    const schoolCheck = await db.execute({
      sql: `SELECT id FROM schools WHERE id = ?`,
      args: [schoolId],
    });
    if (schoolCheck.rows.length === 0) {
      return NextResponse.json({ error: "School not found." }, { status: 404 });
    }

    // Ensure the target section exists (created once)
    const sectionId = await ensureSection(schoolId, className, sectionName, academicYear);

    // Pre-fetch existing admission numbers for this school so we can skip dupes cheaply
    const admissionNos = students
      .map((s) => (s.admissionNo || "").trim())
      .filter(Boolean);
    const existingSet = new Set<string>();
    if (admissionNos.length > 0) {
      const placeholders = admissionNos.map(() => "?").join(", ");
      const existingRes = await db.execute({
        sql: `SELECT admission_no FROM students WHERE school_id = ? AND admission_no IN (${placeholders})`,
        args: [schoolId, ...admissionNos],
      });
      for (const row of existingRes.rows) {
        existingSet.add((row.admission_no as string) || "");
      }
    }

    const skipped: Array<{ row: number; admissionNo: string; name: string; reason: string }> = [];
    const toInsert: { id: string; args: any[] }[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < students.length; i++) {
      const raw = students[i];
      const rowNo = i + 2; // +2 to reflect spreadsheet row (header is row 1)

      const admissionNo = (raw.admissionNo || "").trim();
      const studentName = (raw.studentName || "").trim();

      if (!studentName) {
        skipped.push({ row: rowNo, admissionNo, name: studentName, reason: "Missing student name" });
        continue;
      }
      if (admissionNo && existingSet.has(admissionNo)) {
        skipped.push({ row: rowNo, admissionNo, name: studentName, reason: "Duplicate admission no (already exists)" });
        continue;
      }

      // Track this admission no so later duplicates within the same file are also skipped
      if (admissionNo) existingSet.add(admissionNo);

      const id = crypto.randomUUID();
      toInsert.push({
        id,
        args: [
          id,
          sectionId,
          schoolId,
          admissionNo,
          studentName,
          (raw.fatherName || "").trim(),
          (raw.motherName || "").trim(),
          (raw.dob || "").trim(),
          className,
          sectionName,
          (raw.mobileNumber || "").trim(),
          (raw.address || "").trim(),
          academicYear,
          now,
          now,
        ],
      });
    }

    // Insert in a single batch transaction for speed
    let inserted = 0;
    if (toInsert.length > 0) {
      const batchStatements = toInsert.map((s) => ({
        sql: `INSERT INTO students (id, section_id, school_id, admission_no, student_name, father_name, mother_name, dob, class_name, section_name, mobile_number, address, academic_year, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: s.args,
      }));
      await db.batch(batchStatements);
      inserted = toInsert.length;
    }

    return NextResponse.json({
      success: true,
      inserted,
      skipped: skipped.length,
      skippedRows: skipped,
      totalProcessed: students.length,
    });
  } catch (error: any) {
    console.error("POST /api/students/import error:", error);
    return NextResponse.json({ error: "Failed to import students." }, { status: 500 });
  }
}

// ── Helper: ensure a section exists ── //
async function ensureSection(
  schoolId: string,
  className: string,
  sectionName: string,
  academicYear: string
): Promise<string> {
  const existing = await db.execute({
    sql: `SELECT id FROM sections WHERE school_id = ? AND class_name = ? AND section_name = ? AND academic_year = ?`,
    args: [schoolId, className, sectionName, academicYear],
  });

  if (existing.rows.length > 0) {
    return existing.rows[0].id as string;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO sections (id, school_id, class_name, section_name, academic_year, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, schoolId, className, sectionName, academicYear, now],
  });

  return id;
}
