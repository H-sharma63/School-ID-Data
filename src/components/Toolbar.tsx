"use client";

import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Plus, Upload, Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";

import { useStudentStore } from "@/store/useStudentStore";
import type { Student } from "@/types";

export default function Toolbar() {
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
          admissionNo: `M-${Date.now().toString().slice(-4)}`, // placeholder
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
      toast.info("Empty row added — click cells to fill in data");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add row");
    }
  }, [schoolId, className, sectionName, academicYear, addStudent]);

  const handleClearAll = useCallback(() => {
    if (students.length === 0) return;
    if (
      !window.confirm(
        `Clear table view? (This does NOT delete data from the database, it just clears the current view)`
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

      // Handle file download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${schoolName.replace(/\s+/g, '_')}_Class_${className}-${sectionName}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Downloaded as ${format.toUpperCase()}`);
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
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-surface border border-border shadow-sm">
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleAddRow}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                     bg-card border border-border text-foreground hover:bg-muted
                     active:scale-[0.97] transition-all"
          title="Add a new empty row for manual data entry"
        >
          <Plus size={16} />
          <span className="hidden md:inline">Add Row</span>
        </button>

        <button
          onClick={handleUploadMore}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                     bg-card border border-border text-foreground hover:bg-muted
                     active:scale-[0.97] transition-all"
          title="Upload more form photos"
        >
          <Upload size={16} />
          <span className="hidden md:inline">Upload More</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => handleExport("csv")}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                     bg-card border border-border text-foreground hover:bg-muted
                     active:scale-[0.97] transition-all disabled:opacity-50"
          title="Download CSV for Photoshop"
        >
          <Download size={16} />
          <span className="hidden md:inline">Export CSV</span>
        </button>

        <button
          onClick={() => handleExport("xlsx")}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                     bg-primary text-primary-fg hover:bg-primary-hover
                     active:scale-[0.97] transition-all shadow-sm disabled:opacity-50"
          title="Download Excel file for review"
        >
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          <span>Export XLSX</span>
        </button>

        <button
          onClick={handleClearAll}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                     text-danger bg-card border border-danger/25 hover:bg-danger-bg
                     active:scale-[0.97] transition-all ml-2"
          title="Clear table view"
        >
          <Trash2 size={16} />
          <span className="hidden md:inline">Clear View</span>
        </button>
      </div>
    </div>
  );
}