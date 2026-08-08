// ── POST /api/export ── //
// Generates CSV or XLSX file from student data and returns it for download

import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import type { StudentRow, SchoolRow } from "@/types/server";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    await initDb();

    let body: {
      schoolId?: string;
      className?: string;
      sectionName?: string;
      academicYear?: string;
      format?: "csv" | "xlsx";
      fileName?: string;
      students?: Array<Record<string, any>>;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const format = body.format || "xlsx";
    let studentsToExport: any[] = [];

    // If students are provided directly (e.g. from Quick Export mode), use them directly
    if (body.students && Array.isArray(body.students)) {
      studentsToExport = body.students.map((st) => ({
        schoolName: st.schoolName || body.schoolId || "",
        admissionNo: st.admissionNo || "",
        studentName: st.studentName || "",
        fatherName: st.fatherName || "",
        motherName: st.motherName || "",
        dob: st.dob || "",
        classSection: st.classSection || `${st.className || ""}-${st.sectionName || ""}`,
        className: st.className || "",
        sectionName: st.sectionName || "",
        mobileNumber: st.mobileNumber || "",
        address: st.address || "",
        academicYear: st.academicYear || body.academicYear || "",
      }));
    } else {
      // Otherwise, query from database
      await initDb();

      // Build query with optional filters
      const conditions: string[] = ["s.is_active = 1"];
      const args: string[] = [];

      if (body.schoolId) {
        conditions.push("s.school_id = ?");
        args.push(body.schoolId);
      }
      if (body.className) {
        conditions.push("s.class_name = ?");
        args.push(body.className);
      }
      if (body.sectionName) {
        conditions.push("s.section_name = ?");
        args.push(body.sectionName);
      }
      if (body.academicYear) {
        conditions.push("s.academic_year = ?");
        args.push(body.academicYear);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Fetch students + school name
      const result = await db.execute({
        sql: `
          SELECT s.*, sch.name as school_name
          FROM students s
          JOIN schools sch ON s.school_id = sch.id
          ${whereClause}
          ORDER BY sch.name, s.class_name, s.section_name, s.admission_no, s.student_name
        `,
        args,
      });

      studentsToExport = result.rows.map((row: any) => ({
        schoolName: row.school_name,
        admissionNo: row.admission_no,
        studentName: row.student_name,
        fatherName: row.father_name,
        motherName: row.mother_name,
        dob: row.dob,
        classSection: `${row.class_name}-${row.section_name}`,
        className: row.class_name,
        sectionName: row.section_name,
        mobileNumber: row.mobile_number,
        address: row.address,
        academicYear: row.academic_year,
      }));
    }

    if (studentsToExport.length === 0) {
      return NextResponse.json(
        { error: "No students found matching the filters." },
        { status: 404 }
      );
    }

    // Determine file name
    let fileName = body.fileName || "students";
    if (!body.fileName) {
      const schoolName = studentsToExport[0]?.schoolName || "";
      const classInfo = studentsToExport[0]?.classSection || "";
      if (schoolName && classInfo) {
        fileName = `${schoolName.replace(/[^a-zA-Z0-9]/g, "_")}_${classInfo}`;
      } else if (schoolName) {
        fileName = `${schoolName.replace(/[^a-zA-Z0-9]/g, "_")}_All`;
      }
    }

    // Generate file
    if (format === "csv") {
      const csvContent = generateCsv(studentsToExport);
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileName}.csv"`,
        },
      });
    }

    // Default: XLSX
    const xlsxBuffer = generateXlsx(studentsToExport);
    return new NextResponse(xlsxBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("/api/export error:", error);
    return NextResponse.json(
      { error: "Failed to generate export." },
      { status: 500 }
    );
  }
}

function generateCsv(
  students: Array<{ schoolName: string } & Record<string, string>>
): string {
  const headers = [
    "S.No",
    "School Name",
    "Admission No.",
    "Student Name",
    "Father's Name",
    "Mother's Name",
    "Date of Birth",
    "Class-Section",
    "Mobile Number",
    "Address",
    "Academic Year",
  ];

  const rows = students.map((st, idx) => {
    const values = [
      String(idx + 1),
      escapeField(st.schoolName),
      escapeField(st.admissionNo),
      escapeField(st.studentName),
      escapeField(st.fatherName),
      escapeField(st.motherName),
      escapeField(st.dob || "UNCLEAR"),
      escapeField(st.classSection),
      escapeField(st.mobileNumber),
      escapeField(st.address),
      escapeField(st.academicYear),
    ];
    return values.join(",");
  });

  // BOM for Excel compatibility with UTF-8
  return "﻿" + headers.join(",") + "\n" + rows.join("\n");
}

function escapeField(value: string): string {
  if (!value || value === "UNCLEAR") return `""`;
  // Escape quotes and wrap in double quotes if it contains comma, quote, or newline
  const escaped = value.replace(/"/g, '""');
  if (escaped.includes(",") || escaped.includes('"') || escaped.includes("\n")) {
    return `"${escaped}"`;
  }
  return escaped;
}

function generateXlsx(
  students: Array<Record<string, string>>
): Buffer {
  // Clean rows for XLSX (no DB metadata)
  const rows = students.map((st, idx) => ({
    "S.No": idx + 1,
    "School Name": st.schoolName || "",
    "Admission No.": st.admissionNo || "",
    "Student Name": st.studentName || "",
    "Father's Name": st.fatherName || "",
    "Mother's Name": st.motherName || "",
    "Date of Birth": st.dob || "",
    "Class-Section": st.classSection || "",
    "Mobile Number": fmtMobileForExcel(st.mobileNumber || ""),
    "Address": st.address || "",
    "Academic Year": st.academicYear || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-fit column widths
  const colWidths = [
    { wch: 5 },   // S.No
    { wch: 20 },  // School Name
    { wch: 15 },  // Admission No.
    { wch: 22 },  // Student Name
    { wch: 22 },  // Father's Name
    { wch: 22 },  // Mother's Name
    { wch: 14 },  // DOB
    { wch: 14 },  // Class-Section
    { wch: 20 },  // Mobile Number
    { wch: 40 },  // Address
    { wch: 14 },  // Academic Year
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

/** Store mobile as text in Excel to prevent Excel formatting issues */
function fmtMobileForExcel(value: string): string {
  if (!value || value === "UNCLEAR") return "";
  // Prefix with single quote to force text format in Excel
  // (xlsx library handles this, but we ensure it's a string)
  return String(value);
}