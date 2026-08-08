"use client";

import { useMemo, useState, useCallback } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import EditableCell from "@/components/EditableCell";
import PhotoUploadCell from "@/components/PhotoUploadCell";
import { useStudentStore } from "@/store/useStudentStore";
import { FIELD_ORDER, FIELD_LABELS } from "@/types";
import type { StudentField } from "@/types";

export default function DataTable() {
  const { students, updateStudent, deleteStudents } = useStudentStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<StudentField | "">("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [isDeleting, setIsDeleting] = useState(false);

  // Sort
  const sorted = useMemo(() => {
    if (!sortField) return students;
    return [...students].sort((a, b) => {
      const aVal = String(a[sortField] ?? "").toLowerCase();
      const bVal = String(b[sortField] ?? "").toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [students, sortField, sortDir]);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === students.length ? new Set() : new Set(students.map((s) => s.id))
    );
  }, [students]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSort = useCallback(
    (field: StudentField) => {
      setSortField((prev) => (prev === field && sortDir === "asc" ? field : field));
      setSortDir((prev) => (sortField === field && prev === "asc" ? "desc" : "asc"));
    },
    [sortField, sortDir]
  );

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Permanently delete ${selectedIds.size} student(s) from the database? This cannot be undone.`)) return;

    setIsDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const res = await fetch("/api/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) throw new Error("Failed to delete from DB");

      deleteStudents(ids);
      setSelectedIds(new Set());
      toast.success(`Deleted ${ids.length} records`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete records");
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, deleteStudents]);

  const handleCellChange = useCallback(async (id: string, field: StudentField, newVal: string) => {
    // Optimistic UI update
    updateStudent(id, field, newVal);

    // Persist to DB
    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: newVal }),
      });
      if (!res.ok) {
        // We could revert the optimistic update here if it fails
        throw new Error("Failed to save edit");
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to save changes to database`);
    }
  }, [updateStudent]);

  if (students.length === 0) {
    return (
      <div className="text-center py-24 text-muted-fg bg-surface border border-border rounded-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
          <AlertTriangle size={28} className="text-muted-fg/50" />
        </div>
        <p className="text-lg font-medium text-foreground">No student data yet</p>
        <p className="text-sm mt-2">
          Select a school and class above, then upload photos to extract data
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-3 py-2.5 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
          <CheckCircle2 size={16} className="text-amber-700 dark:text-amber-400 flex-shrink-0" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {selectedIds.size} row{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex-1" />
          <button
            onClick={handleDeleteSelected}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-danger text-white
                       hover:bg-red-700 dark:hover:bg-red-600 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : null}
            Delete Selected
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-300 dark:border-amber-700
                       text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-2xl overflow-hidden shadow-sm bg-card">
        <div className="overflow-x-auto thin-scrollbar">
          <div className="overflow-y-auto max-h-[60vh] thin-scrollbar sticky-header">
            <table className="w-full min-w-[1200px] border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {/* Checkbox column */}
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === students.length && students.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                    />
                  </th>
                  {/* Photo column */}
                  <th className="w-12 px-3 py-3">
                    Photo
                  </th>
                  {/* S.No */}
                  <th className="w-12 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                    #
                  </th>
                  {FIELD_ORDER.map((field) => (
                    <th
                      key={field}
                      onClick={() => handleSort(field)}
                      className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-fg cursor-pointer hover:text-foreground transition-colors select-none whitespace-nowrap"
                    >
                      <span className="flex items-center gap-1">
                        {FIELD_LABELS[field]}
                        {sortField === field && (
                          <span className="text-primary text-xs">{sortDir === "asc" ? "▲" : "▼"}</span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {sorted.map((student, idx) => {
                  const selected = selectedIds.has(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={`transition-colors hover:bg-muted/20 ${
                        selected ? "bg-primary/[0.06] dark:bg-primary/[0.12]" : ""
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleOne(student.id)}
                          className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <PhotoUploadCell
                          photoUrl={student.photoUrl}
                          onUploadSuccess={(url: string) => {
                            updateStudent(student.id, "photoUrl", url);
                          }}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-muted-fg font-mono tabular-nums">
                        {idx + 1}
                      </td>
                      {FIELD_ORDER.map((field) => (
                        <td key={field} className="px-1 py-1.5">
                          <EditableCell
                            value={String(student[field] ?? "")}
                            confidence={student.confidence[field]}
                            onChange={(newVal: string) =>
                              handleCellChange(student.id, field, newVal)
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}