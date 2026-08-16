"use client";

import { useMemo, useState, useCallback } from "react";
import { AlertTriangle, Loader2, Search } from "lucide-react";
import { toast } from "@/lib/toast";
import EditableCell, { SaveStatus } from "@/components/EditableCell";
import { useStudentStore } from "@/store/useStudentStore";
import { useSession } from "next-auth/react";
import { FIELD_ORDER, FIELD_LABELS } from "@/types";
import { canDeleteStudents } from "@/lib/rbac";
import type { StudentField } from "@/types";

export default function DataTable() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isAdmin = canDeleteStudents(role);

  const { students, updateStudent, deleteStudents } = useStudentStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<StudentField | "">("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Per-cell save status: key = `${studentId}:${field}`
  const [saveStatuses, setSaveStatuses] = useState<Record<string, SaveStatus>>({});

  const sorted = useMemo(() => {
    let filtered = students;
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      filtered = students.filter(s =>
        (s.admissionNo?.toLowerCase().includes(lowerQ)) ||
        (s.studentName?.toLowerCase().includes(lowerQ)) ||
        (s.fatherName?.toLowerCase().includes(lowerQ)) ||
        (s.mobileNumber?.toLowerCase().includes(lowerQ))
      );
    }

    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = String(a[sortField] ?? "").toLowerCase();
      const bVal = String(b[sortField] ?? "").toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [students, sortField, sortDir, searchQuery]);

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
      if (sortField === field) {
        setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
    },
    [sortField]
  );

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Permanently delete ${selectedIds.size} student record(s) from the database?`)) return;

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
      toast.success(`Deleted ${ids.length} record${ids.length !== 1 ? "s" : ""}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete records");
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, deleteStudents]);

  const handleCellChange = useCallback(async (id: string, field: StudentField, newVal: string) => {
    const key = `${id}:${field}`;
    updateStudent(id, field, newVal);
    setSaveStatuses(prev => ({ ...prev, [key]: "saving" }));

    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: newVal }),
      });
      if (!res.ok) throw new Error("Failed to save edit");
      setSaveStatuses(prev => ({ ...prev, [key]: "saved" }));
      // Clear "saved" after 2 seconds
      setTimeout(() => {
        setSaveStatuses(prev => {
          if (prev[key] === "saved") {
            const next = { ...prev };
            delete next[key];
            return next;
          }
          return prev;
        });
      }, 2000);
    } catch (err) {
      console.error(err);
      setSaveStatuses(prev => ({ ...prev, [key]: "failed" }));
      toast.error("Failed to save changes");
      // Clear "failed" after 4 seconds
      setTimeout(() => {
        setSaveStatuses(prev => {
          if (prev[key] === "failed") {
            const next = { ...prev };
            delete next[key];
            return next;
          }
          return prev;
        });
      }, 4000);
    }
  }, [updateStudent]);

  if (students.length === 0) {
    return (
      <div className="px-6 py-20 text-center bg-card border border-border rounded-2xl">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted flex items-center justify-center">
          <AlertTriangle size={20} strokeWidth={1.5} className="text-muted-fg" />
        </div>
        <p className="font-display font-bold text-[1rem] text-foreground tracking-tight">
          No student data yet
        </p>
        <p className="text-[0.875rem] text-muted-fg mt-1.5 max-w-sm mx-auto">
          Select a school, class, and section above, then upload photos to extract student data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-fg">
            <Search size={15} strokeWidth={2} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search this section..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-card text-[0.875rem] text-foreground
                       focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
          />
        </div>
      </div>

      <div className="space-y-3">
        {/* Bulk action bar - Admin only */}
        {isAdmin && selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-warning/30 bg-warning-bg">
            <span className="text-[0.8125rem] font-medium text-foreground">
              <span className="font-mono tabular-nums">{selectedIds.size}</span> row{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex-1" />
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-1.5 h-8 px-3 text-[0.8125rem] font-semibold rounded-md bg-danger text-primary-fg
                       hover:bg-danger/90 active:translate-y-px disabled:opacity-50 transition-all"
            >
              {isDeleting ? <Loader2 size={13} className="animate-spin" /> : null}
              Delete selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="h-8 px-3 text-[0.8125rem] font-medium rounded-md border border-border hover:bg-muted transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Table */}
        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          <div className="overflow-x-auto thin-scrollbar">
            <div className="overflow-y-auto max-h-[60vh] thin-scrollbar sticky-header">
              <table className="w-full min-w-[1200px] border-collapse">
                <thead>
                  <tr>
                    {isAdmin && (
                      <th className="w-10 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === students.length && students.length > 0}
                          onChange={toggleAll}
                          className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                          aria-label="Select all"
                        />
                      </th>
                    )}
                    <th className={`w-12 px-3 py-3 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-fg ${isAdmin ? '' : 'pl-3'}`}>
                      #
                    </th>
                    {FIELD_ORDER.map((field) => (
                      <th
                        key={field}
                        onClick={() => handleSort(field)}
                        className="px-3 py-3 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-fg cursor-pointer hover:text-foreground transition-colors select-none whitespace-nowrap"
                      >
                        <span className="flex items-center gap-1">
                          {FIELD_LABELS[field]}
                          {sortField === field && (
                            <span className="text-primary text-[0.625rem]">{sortDir === "asc" ? "▲" : "▼"}</span>
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
                        className={`transition-colors ${selected
                            ? "bg-primary/[0.05]"
                            : "hover:bg-muted/30"
                          }`}
                      >
                        {isAdmin && (
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleOne(student.id)}
                              className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                              aria-label="Select row"
                            />
                          </td>
                        )}
                        <td className={`px-3 py-2 text-[0.8125rem] text-muted-fg font-mono tabular-nums ${isAdmin ? '' : 'pl-3'}`}>
                          {idx + 1}
                        </td>
                        {FIELD_ORDER.map((field) => (
                          <td key={field} className="px-1 py-1.5">
                            <EditableCell
                              value={String(student[field] ?? "")}
                              confidence={(student.confidence as any)[field]}
                              saveStatus={saveStatuses[`${student.id}:${field}`] || "idle"}
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
    </div>
  );
}
