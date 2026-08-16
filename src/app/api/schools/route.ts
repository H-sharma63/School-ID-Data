// ── /api/schools ── //
// GET: List all schools with student counts
// POST: Create a new school (Admin only)
// PATCH: Update a school's name/details (Admin only)
// DELETE: Delete a school (and all its students) (Admin only)

import { NextRequest, NextResponse } from "next/server";
import { db, initDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

export async function GET() {
  try {
    await initDb();

    // Get schools with student counts per academic year
    const result = await db.execute(`
      SELECT
        sch.id,
        sch.name,
        sch.address,
        sch.contact,
        sch.created_at,
        COUNT(DISTINCT s.id) as total_students,
        COUNT(DISTINCT CASE WHEN s.is_active = 1 THEN s.id END) as active_students,
        COUNT(DISTINCT s.class_name || '-' || s.section_name) as total_sections
      FROM schools sch
      LEFT JOIN students s ON s.school_id = sch.id
      GROUP BY sch.id
      ORDER BY sch.name
    `);

    const schools = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      code: row.code || "",
      officialId: row.official_id || "",
      address: row.address || "",
      contact: row.contact || "",
      totalStudents: Number(row.total_students) || 0,
      activeStudents: Number(row.active_students) || 0,
      totalSections: Number(row.total_sections) || 0,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ schools });
  } catch (error: any) {
    console.error("GET /api/schools error:", error);
    return NextResponse.json({ error: "Failed to fetch schools." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck.error) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    await initDb();

    let body: { name?: string; code?: string; officialId?: string; address?: string; contact?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { name, code = "", officialId = "", address = "", contact = "" } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "School name is required." },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO schools (id, name, code, official_id, address, contact, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, name.trim(), code.trim(), officialId.trim(), address.trim(), contact.trim(), now, now],
    });

    return NextResponse.json({
      success: true,
      school: { id, name: name.trim(), code: code.trim(), officialId: officialId.trim(), address, contact, createdAt: now },
    });
  } catch (error: any) {
    console.error("POST /api/schools error:", error);
    return NextResponse.json({ error: "Failed to create school." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck.error) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    await initDb();

    let body: { id?: string; name?: string; code?: string; officialId?: string; address?: string; contact?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { id, name, code, officialId, address, contact } = body;

    if (!id) {
      return NextResponse.json({ error: "School ID is required." }, { status: 400 });
    }

    const updates: string[] = [];
    const args: any[] = [];

    if (name !== undefined) {
      if (name.trim().length === 0) return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
      updates.push("name = ?");
      args.push(name.trim());
    }
    if (code !== undefined) {
      updates.push("code = ?");
      args.push(code.trim());
    }
    if (officialId !== undefined) {
      updates.push("official_id = ?");
      args.push(officialId.trim());
    }
    if (address !== undefined) {
      updates.push("address = ?");
      args.push(address.trim());
    }
    if (contact !== undefined) {
      updates.push("contact = ?");
      args.push(contact.trim());
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    updates.push("updated_at = ?");
    args.push(new Date().toISOString());
    args.push(id);

    await db.execute({
      sql: `UPDATE schools SET ${updates.join(", ")} WHERE id = ?`,
      args,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH /api/schools error:", error);
    return NextResponse.json({ error: "Failed to update school." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck.error) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    await initDb();

    // We use URL params for DELETE usually, or body
    let body: { id?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "School ID is required." }, { status: 400 });
    }

    // Because of foreign keys (ON DELETE CASCADE in schema),
    // deleting the school will delete all its sections and students automatically.
    await db.execute({
      sql: `DELETE FROM schools WHERE id = ?`,
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/schools error:", error);
    return NextResponse.json({ error: "Failed to delete school." }, { status: 500 });
  }
}