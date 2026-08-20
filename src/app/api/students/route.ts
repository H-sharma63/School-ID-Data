// ── /api/students ── //
// GET: List students with optional filters (schoolId, className, sectionName, academicYear)
// POST: Add a new student row
// PATCH: Update a student (body includes id + fields to update)
// DELETE: Delete students by ids (body includes ids array) (Admin only)

import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const authCheck = await requireAuth();
  if (authCheck.error) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

  try {
    await initDb();

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const className = searchParams.get("className");
    const sectionName = searchParams.get("sectionName");
    const academicYear = searchParams.get("academicYear");

    const conditions: string[] = [];
    const args: string[] = [];

    if (schoolId) {
      conditions.push("s.school_id = ?");
      args.push(schoolId);
    }
    if (className) {
      conditions.push("s.class_name = ?");
      args.push(className);
    }
    if (sectionName) {
      conditions.push("s.section_name = ?");
      args.push(sectionName);
    }
    if (academicYear) {
      conditions.push("s.academic_year = ?");
      args.push(academicYear);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await db.execute({
      sql: `
        SELECT s.*, sch.name as school_name
        FROM students s
        JOIN schools sch ON s.school_id = sch.id
        ${where}
        ORDER BY s.class_name, s.section_name, s.admission_no, s.student_name
      `,
      args,
    });

    const students = result.rows.map((row: any) => ({
      id: row.id,
      sectionId: row.section_id,
      schoolId: row.school_id,
      schoolName: row.school_name,
      admissionNo: row.admission_no,
      studentName: row.student_name,
      fatherName: row.father_name || "",
      motherName: row.mother_name || "",
      dob: row.dob || "",
      classSection: `${row.class_name}-${row.section_name}`,
      className: row.class_name,
      sectionName: row.section_name,
      mobileNumber: row.mobile_number || "",
      address: row.address || "",
      academicYear: row.academic_year,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ students });
  } catch (error: any) {
    console.error("GET /api/students error:", error);
    return NextResponse.json({ error: "Failed to fetch students." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAuth();
  if (authCheck.error) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

  try {
    await initDb();

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const {
      schoolId,
      className,
      sectionName,
      academicYear,
      admissionNo = "",
      studentName,
      fatherName = "",
      motherName = "",
      dob = "",
      mobileNumber = "",
      address = "",
    } = body;

    if (!schoolId || !studentName || !className || !sectionName || !academicYear) {
      return NextResponse.json(
        { error: "schoolId, studentName, className, sectionName, and academicYear are required." },
        { status: 400 }
      );
    }

    // Ensure section exists
    let sectionId = await ensureSection(schoolId, className, sectionName, academicYear);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO students (id, section_id, school_id, admission_no, student_name, father_name, mother_name, dob, class_name, section_name, mobile_number, address, academic_year, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, sectionId, schoolId, admissionNo, studentName,
        fatherName, motherName, dob, className, sectionName,
        mobileNumber, address, academicYear, now, now,
      ],
    });

    return NextResponse.json({
      success: true,
      student: { id, admissionNo, studentName, className, sectionName, academicYear, createdAt: now },
    });
  } catch (error: any) {
    // Handle unique constraint violation (duplicate admission_no in same school)
    if (error?.message?.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { error: "A student with this admission number already exists in this school." },
        { status: 409 }
      );
    }
    console.error("POST /api/students error:", error);
    return NextResponse.json({ error: "Failed to add student." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authCheck = await requireAuth();
  if (authCheck.error) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

  try {
    await initDb();

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "Student id is required." }, { status: 400 });
    }

    const fields = [
      "admission_no", "student_name", "father_name", "mother_name",
      "dob", "class_name", "section_name", "mobile_number", "address",
      "academic_year",
    ];
    const updates: string[] = [];
    const args: any[] = [];

    const mapping: Record<string, string> = {
      admissionNo: "admission_no",
      studentName: "student_name",
      fatherName: "father_name",
      motherName: "mother_name",
      dob: "dob",
      className: "class_name",
      sectionName: "section_name",
      mobileNumber: "mobile_number",
      address: "address",
      academicYear: "academic_year",
    };

    for (const [key, dbField] of Object.entries(mapping)) {
      if (body[key] !== undefined) {
        updates.push(`${dbField} = ?`);
        args.push(body[key]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    updates.push("updated_at = ?");
    args.push(new Date().toISOString());
    args.push(id);

    await db.execute({
      sql: `UPDATE students SET ${updates.join(", ")} WHERE id = ?`,
      args,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/students error:", error);
    return NextResponse.json({ error: "Failed to update student." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authCheck = await requireAuth();
  if (authCheck.error) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

  try {
    await initDb();

    let body: { ids?: string[] };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { ids } = body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required." }, { status: 400 });
    }

    const placeholders = ids.map(() => "?").join(", ");
    await db.execute({
      sql: `DELETE FROM students WHERE id IN (${placeholders})`,
      args: ids,
    });

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error: any) {
    console.error("DELETE /api/students error:", error);
    return NextResponse.json({ error: "Failed to delete students." }, { status: 500 });
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