"use client";

import { useState, useCallback } from "react";
import { Plus, Upload, Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { useSession } from "next-auth/react";
import { canDeleteStudents } from "@/lib/rbac";

import { useStudentStore } from "@/store/useStudentStore";
import type { Student } from "@/types";

export default function Toolbar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isAdmin = canDeleteStudents(role);

  const {
    schoolId,
    schoolName,
    className,
    sectionName,
    academicYear,
    students,
    addStudent,
    clearAll
  } = useStudentStore();

  const [isExporting, setIsExporting] = useState(false);

  const handleAddRow = useCallback(async () => {
    if (!schoolId || !className || !sectionName) {
      toast.error("Select school, class, and section first");
      return;
    }

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          className,
          sectionName,
          academicYear,
          admissionNo: `M-${Date.now().toString().slice(-4)}`,
          studentName: "New Student",
        }),
      });

      if (!res.ok) throw new Error("Failed to add student to DB");
      const data = await res.json();

      const empty: Student = {
        id: data.student.id,
        admissionNo: data.student.admissionNo,
        studentName: "New Student",
        fatherName: "",
        motherName: "",
        dob: "",
        classSection: `${className}-${sectionName}`,
        mobileNumber: "",
        address: "",
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
        needsReview: true,
        createdAt: data.student.createdAt,
      };

      addStudent(empty);
      toast.info("Empty row added — click cells to fill in");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add row");
    }
  }, [schoolId, className, sectionName, academicYear, addStudent]);

  const handleClearAll = useCallback(() => {
    if (students.length === 0) return;
    if (
      !window.confirm(
        "Clear table view? Saved data in the database will not be affected."
      )
    )
      return;
    clearAll();
  }, [students.length, clearAll]);

  const handleExport = useCallback(async (format: "xlsx" | "csv") => {
    if (students.length === 0) {
      toast.error("No data to export");
      return;
    }

    setIsExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          className,
          sectionName,
          academicYear,
          format,
          fileName: `${schoolName.replace(/\s+/g, '_')}_Class_${className}-${sectionName}`
        }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${schoolName.replace(/\s+/g, '_')}_Class_${className}-${sectionName}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Downloaded ${format.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  }, [students.length, schoolId, className, sectionName, academicYear, schoolName]);

  const handleUploadMore = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="sticky bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-card border-t border-border shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleAddRow}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-[0.8125rem] font-medium
                     border border-border bg-background text-foreground hover:bg-muted
                     active:translate-y-px transition-all"
          title="Add a new empty row for manual data entry"
        >
          <Plus size={14} strokeWidth={1.75} />
          <span className="hidden md:inline">Add row</span>
      </button>

        <button
          onClick={handleUploadMore}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-[0.8125rem] font-medium
                     border border-border bg-background text-foreground hover:bg-muted
                     active:translate-y-px transition-all"
          title="Upload more form photos"
        >
          <Upload size={14} strokeWidth={1.75} />
          <span className="hidden md:inline">Upload more</span>
      </button>
    </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => handleExport("csv")}
          disabled={isExporting}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-[0.8125rem] font-medium
                     border border-border bg-background text-foreground hover:bg-muted
                     active:translate-y-px transition-all disabled:opacity-50"
          title="Download CSV for Photoshop"
        >
          <Download size={14} strokeWidth={1.75} />
          <span className="hidden md:inline">CSV</span>
      </button>

        <button
          onClick={() => handleExport("xlsx")}
          disabled={isExporting}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-[0.8125rem] font-semibold
                     bg-primary text-primary-fg hover:bg-primary-hover
                     active:translate-y-px transition-all disabled:opacity-50"
          title="Download Excel file for review"
        >
          {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} strokeWidth={1.75} />}
          <span>Excel</span>
      </button>

        {isAdmin && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 h-9 px-3 ml-1 rounded-lg text-[0.8125rem] font-medium
                       text-danger border border-border bg-background hover:bg-danger-bg hover:border-danger/30
                       active:translate-y-px transition-all"
            title="Clear table view (database is unaffected)"
          >
            <Trash2 size={14} strokeWidth={1.75} />
            <span className="hidden md:inline">Clear view</span>
        </button>
        )}
      </div>
    </div>
  );
}
