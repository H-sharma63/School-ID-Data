// ── /api/sections ── //
// GET: List sections grouped by school → class → section
// Used by the /schools hierarchy browser page

import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await initDb();

    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get("academicYear") || "";

    // Fetch all sections with student counts
    const result = await db.execute({
      sql: `
        SELECT
          s.id as section_id,
          s.school_id,
          s.class_name,
          s.section_name,
          s.academic_year,
          sch.name as school_name,
          (
            SELECT COUNT(*)
            FROM students st
            WHERE st.section_id = s.id AND st.is_active = 1
          ) as student_count
        FROM sections s
        JOIN schools sch ON s.school_id = sch.id
        ${academicYear ? "WHERE s.academic_year = ?" : ""}
        ORDER BY sch.name, s.class_name, s.section_name
      `,
      args: academicYear ? [academicYear] : [],
    });

    // Group: school → class → section
    const schoolsMap = new Map<string, {
      id: string;
      name: string;
      classes: Map<string, {
        name: string;
        sections: Array<{
          id: string;
          name: string;
          academicYear: string;
          studentCount: number;
        }>;
      }>;
    }>();

    for (const row of result.rows as any[]) {
      const schoolId = row.school_id as string;

      if (!schoolsMap.has(schoolId)) {
        schoolsMap.set(schoolId, {
          id: schoolId,
          name: row.school_name as string,
          classes: new Map(),
        });
      }

      const school = schoolsMap.get(schoolId)!;
      const className = row.class_name as string;

      if (!school.classes.has(className)) {
        school.classes.set(className, { name: className, sections: [] });
      }

      school.classes.get(className)!.sections.push({
        id: row.section_id as string,
        name: row.section_name as string,
        academicYear: row.academic_year as string,
        studentCount: Number(row.student_count) || 0,
      });
    }

    // Convert Maps to plain arrays for JSON
    const schools = Array.from(schoolsMap.values()).map((school) => ({
      id: school.id,
      name: school.name,
      classes: Array.from(school.classes.values()).map((cls) => ({
        name: cls.name,
        sections: cls.sections,
        totalStudents: cls.sections.reduce((sum, sec) => sum + sec.studentCount, 0),
      })),
      totalStudents: Array.from(school.classes.values()).reduce(
        (sum, cls) => sum + cls.sections.reduce((s, sec) => s + sec.studentCount, 0), 0
      ),
    }));

    return NextResponse.json({
      schools,
      totalSchools: schools.length,
      totalStudents: schools.reduce((s, sch) => s + sch.totalStudents, 0),
    });
  } catch (error: any) {
    console.error("GET /api/sections error:", error);
    return NextResponse.json({ error: "Failed to fetch sections." }, { status: 500 });
  }
}