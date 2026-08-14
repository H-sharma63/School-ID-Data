// ── /api/students/search ── //
// GET: Global DB search for students matching a query.
// Searches admission_no, student_name, father_name, mobile_number across ALL schools.

import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initDb();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ students: [] });
    }

    const likeTerm = `%${query.trim()}%`;

    const result = await db.execute({
      sql: `
        SELECT s.*, sch.name as school_name
        FROM students s
        JOIN schools sch ON s.school_id = sch.id
        WHERE
          s.admission_no LIKE ? OR
          s.student_name LIKE ? OR
          s.father_name LIKE ? OR
          s.mobile_number LIKE ?
        ORDER BY s.student_name ASC
        LIMIT 50
      `,
      args: [likeTerm, likeTerm, likeTerm, likeTerm],
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
      confidence: {
        admissionNo: "high",
        studentName: "high",
        fatherName: "high",
        motherName: "high",
        dob: "high",
        classSection: "high",
        mobileNumber: "high",
        address: "high",
      },
      needsReview: false,
    }));

    return NextResponse.json({ students });
  } catch (error: any) {
    console.error("GET /api/students/search error:", error);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
