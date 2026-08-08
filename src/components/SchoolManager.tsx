"use client";

import { useState, useEffect } from "react";
import { useStudentStore } from "@/store/useStudentStore";
import { Building2, Plus, Loader2, Settings2, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";

interface School {
  id: string;
  name: string;
  address?: string;
  contact?: string;
}

export default function SchoolManager() {
  const {
    schoolId,
    className,
    sectionName,
    academicYear,
    setSchoolContext,
    setClassContext,
    isProcessing,
  } = useStudentStore();

  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  // Form state
  const [newSchoolName, setNewSchoolName] = useState("");
  const [editSchoolId, setEditSchoolId] = useState<string | null>(null);
  const [editSchoolName, setEditSchoolName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch schools on mount
  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    setLoading(true);
    try {
      async function fetchWithRetry(url: string, retries = 3, delay = 500): Promise<Response> {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            const res = await fetch(url);
            if (res.ok) return res;
            // Don't retry client errors
            if (res.status >= 400 && res.status < 500) throw new Error(`Server returned ${res.status}`);
          } catch (err: any) {
            console.warn(`[schools] Attempt ${attempt} failed: ${err.message}`);
            if (attempt === retries) throw err;
          }
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
        }
        throw new Error(`Failed after ${retries} retries`);
      }

      const res = await fetchWithRetry("/api/schools");
      const data = await res.json();
      setSchools(data.schools || []);

      // Auto-select first school if none selected
      if (!schoolId && data.schools?.length > 0) {
        setSchoolContext(data.schools[0].id, data.schools[0].name);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load schools from database.");
    } finally {
      setLoading(false);
    }
  }

  // ── Create ── //
  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSchoolName }),
      });

      if (!res.ok) throw new Error("Failed to create school");

      const data = await res.json();
      const newSchool = data.school;

      setSchools((prev) => [...prev, newSchool]);
      setSchoolContext(newSchool.id, newSchool.name);
      setShowAddModal(false);
      setNewSchoolName("");
      toast.success("School created successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create school. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit ── //
  const handleUpdateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSchoolId || !editSchoolName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/schools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editSchoolId, name: editSchoolName }),
      });

      if (!res.ok) throw new Error("Failed to update school");

      setSchools((prev) =>
        prev.map((s) => (s.id === editSchoolId ? { ...s, name: editSchoolName } : s))
      );

      if (schoolId === editSchoolId) {
        setSchoolContext(editSchoolId, editSchoolName);
      }

      setEditSchoolId(null);
      toast.success("School updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update school.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ── //
  const handleDeleteSchool = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Are you SURE you want to delete ${name}? This will permanently delete ALL classes and students in this school.`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/schools", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Failed to delete school");

      const newSchools = schools.filter((s) => s.id !== id);
      setSchools(newSchools);

      // If we deleted the currently selected school, select another one
      if (schoolId === id) {
        if (newSchools.length > 0) {
          setSchoolContext(newSchools[0].id, newSchools[0].name);
        } else {
          setSchoolContext("", "");
        }
      }

      toast.success(`${name} deleted.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete school.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 bg-surface p-5 rounded-2xl border border-border shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Select School &amp; Class Context
          </h2>
        </div>
        <button
          onClick={() => setShowManageModal(true)}
          className="text-xs font-medium text-muted-fg hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Settings2 size={14} />
          Manage Schools
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* School Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-fg">School</label>
          {loading ? (
            <div className="h-10 w-full flex items-center justify-center rounded-xl border border-border bg-card">
              <Loader2 size={16} className="animate-spin text-muted-fg" />
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={schoolId}
                onChange={(e) => {
                  const s = schools.find((x) => x.id === e.target.value);
                  if (s) setSchoolContext(s.id, s.name);
                }}
                disabled={isProcessing || schools.length === 0}
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground
                           focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
              >
                {schools.length === 0 && <option value="">No schools found</option>}
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowAddModal(true)}
                disabled={isProcessing}
                className="p-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted
                           active:scale-95 transition-all"
                title="Add new school"
              >
                <Plus size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Class/Section Group */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5 col-span-1">
            <label className="text-xs font-medium text-muted-fg">Class</label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassContext(e.target.value, sectionName, academicYear)}
              placeholder="e.g. V"
              disabled={isProcessing}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground
                         focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
          <div className="space-y-1.5 col-span-1">
            <label className="text-xs font-medium text-muted-fg">Section</label>
            <input
              type="text"
              value={sectionName}
              onChange={(e) => setClassContext(className, e.target.value, academicYear)}
              placeholder="e.g. A"
              disabled={isProcessing}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground
                         focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
          <div className="space-y-1.5 col-span-1">
            <label className="text-xs font-medium text-muted-fg">Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setClassContext(className, sectionName, e.target.value)}
              placeholder="2026-2027"
              disabled={isProcessing}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground
                         focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Add School Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Add New School</h3>
              <p className="text-sm text-muted-fg mt-1">Enter the school's name to create a new database folder for them.</p>
            </div>
            <form onSubmit={handleCreateSchool} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">School Name</label>
                <input
                  type="text"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  placeholder="e.g. DAV Public School"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground
                             focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-muted text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newSchoolName.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-fg
                             hover:bg-primary-hover active:scale-95 disabled:opacity-50 transition-all shadow-sm"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  Create School
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Manage Schools Modal ── */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-border flex items-center justify-between bg-surface">
              <div>
                <h3 className="text-lg font-bold text-foreground">Manage Schools</h3>
                <p className="text-sm text-muted-fg">Edit names or delete schools.</p>
              </div>
              <button
                onClick={() => {
                  setShowManageModal(false);
                  setEditSchoolId(null);
                }}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-muted text-foreground hover:bg-border transition-colors"
              >
                Done
              </button>
            </div>

            <div className="p-2 overflow-y-auto thin-scrollbar">
              {schools.length === 0 ? (
                <div className="p-8 text-center text-muted-fg text-sm">No schools added yet.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {schools.map((s) => (
                    <li key={s.id} className="p-3 hover:bg-muted/30 rounded-xl transition-colors">
                      {editSchoolId === s.id ? (
                        <form onSubmit={handleUpdateSchool} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editSchoolName}
                            onChange={(e) => setEditSchoolName(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-primary bg-background text-sm text-foreground
                                       focus:outline-none focus:ring-2 focus:ring-ring"
                            autoFocus
                          />
                          <button
                            type="submit"
                            disabled={isSubmitting || !editSchoolName.trim()}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-fg
                                       hover:bg-primary-hover disabled:opacity-50 transition-all"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditSchoolId(null)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{s.name}</span>
                          <div className="flex items-center gap-1 opacity-0 hover:opacity-100 focus-within:opacity-100 lg:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditSchoolId(s.id);
                                setEditSchoolName(s.name);
                              }}
                              className="p-1.5 text-muted-fg hover:text-primary rounded-md hover:bg-primary/10 transition-colors"
                              title="Edit name"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteSchool(s.id, s.name)}
                              disabled={isSubmitting}
                              className="p-1.5 text-muted-fg hover:text-danger rounded-md hover:bg-danger/10 transition-colors disabled:opacity-50"
                              title="Delete school"
                            >
                              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}