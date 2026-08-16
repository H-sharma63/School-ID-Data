"use client";

import { useState, useEffect } from "react";
import { useStudentStore } from "@/store/useStudentStore";
import { useSession } from "next-auth/react";
import { Building2, Plus, Loader2, Settings2, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { canManageSchools } from "@/lib/rbac";

interface School {
  id: string;
  name: string;
  code?: string;
  officialId?: string;
  address?: string;
  contact?: string;
}

export default function SchoolManager() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isAdmin = canManageSchools(role);

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

  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolCode, setNewSchoolCode] = useState("");
  const [newSchoolOfficialId, setNewSchoolOfficialId] = useState("");
  const [editSchoolId, setEditSchoolId] = useState<string | null>(null);
  const [editSchoolName, setEditSchoolName] = useState("");
  const [editSchoolCode, setEditSchoolCode] = useState("");
  const [editSchoolOfficialId, setEditSchoolOfficialId] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSchoolName,
          code: newSchoolCode,
          officialId: newSchoolOfficialId,
        }),
      });

      if (!res.ok) throw new Error("Failed to create school");

      const data = await res.json();
      const newSchool = data.school;

      setSchools((prev) => [...prev, newSchool]);
      setSchoolContext(newSchool.id, newSchool.name);
      setShowAddModal(false);
      setNewSchoolName("");
      setNewSchoolCode("");
      setNewSchoolOfficialId("");
      toast.success("School created");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create school");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSchoolId || !editSchoolName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/schools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editSchoolId,
          name: editSchoolName,
          code: editSchoolCode,
          officialId: editSchoolOfficialId,
        }),
      });

      if (!res.ok) throw new Error("Failed to update school");

      setSchools((prev) =>
        prev.map((s) => (s.id === editSchoolId ? {
          ...s,
          name: editSchoolName,
          code: editSchoolCode,
          officialId: editSchoolOfficialId,
        } : s))
      );

      if (schoolId === editSchoolId) {
        setSchoolContext(editSchoolId, editSchoolName);
      }

      setEditSchoolId(null);
      toast.success("School updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update school");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchool = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Delete ${name}? This will permanently delete all classes and students in this school.`
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

      if (schoolId === id) {
        if (newSchools.length > 0) {
          setSchoolContext(newSchools[0].id, newSchools[0].name);
        } else {
          setSchoolContext("", "");
        }
      }

      toast.success(`${name} deleted`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete school");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-card border border-border rounded-2xl p-6 sm:p-7">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Building2 size={17} strokeWidth={1.5} className="text-muted-fg" />
          <h2 className="font-display font-bold text-[0.9375rem] tracking-tight text-foreground">
            Context
        </h2>
       </div>
        {isAdmin && (
          <button
            onClick={() => setShowManageModal(true)}
            className="text-[0.8125rem] font-medium text-muted-fg hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Settings2 size={14} strokeWidth={1.75} />
            Manage schools
         </button>
        )}
     </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_1fr] gap-4">
        {/* School */}
        <div className="space-y-1.5">
          <label htmlFor="school-select" className="block text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-fg">
            School
         </label>
          {loading ? (
            <div className="h-11 w-full flex items-center justify-center rounded-lg border border-border bg-background">
              <Loader2 size={15} className="animate-spin text-muted-fg" />
           </div>
          ) : (
            <div className="flex gap-2">
              <select
                id="school-select"
                value={schoolId}
                onChange={(e) => {
                  const s = schools.find((x) => x.id === e.target.value);
                  if (s) setSchoolContext(s.id, s.name);
                }}
                disabled={isProcessing || schools.length === 0}
                className="flex-1 h-11 px-3 rounded-lg border border-border bg-background text-[0.9375rem] text-foreground
                           focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {schools.length === 0 && <option value="">No schools yet</option>}
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                 </option>
                ))}
             </select>
              {isAdmin && (
                <button
                  onClick={() => setShowAddModal(true)}
                  disabled={isProcessing}
                  className="flex items-center justify-center w-11 h-11 rounded-lg border border-border bg-background text-foreground hover:bg-muted
                             active:translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Add new school"
                  aria-label="Add new school"
                >
                  <Plus size={17} strokeWidth={1.75} />
               </button>
              )}
           </div>
          )}
       </div>

        {/* Class */}
        <div className="space-y-1.5">
          <label htmlFor="class-input" className="block text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-fg">
            Class
         </label>
          <input
            id="class-input"
            type="text"
            value={className}
            onChange={(e) => setClassContext(e.target.value, sectionName, academicYear)}
            placeholder="V"
            disabled={isProcessing}
            className="w-full h-11 px-3 rounded-lg border border-border bg-background text-[0.9375rem] text-foreground font-mono
                       focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
       </div>

        {/* Section */}
        <div className="space-y-1.5">
          <label htmlFor="section-input" className="block text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-fg">
            Section
         </label>
          <input
            id="section-input"
            type="text"
            value={sectionName}
            onChange={(e) => setClassContext(className, e.target.value, academicYear)}
            placeholder="B"
            disabled={isProcessing}
            className="w-full h-11 px-3 rounded-lg border border-border bg-background text-[0.9375rem] text-foreground font-mono
                       focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
       </div>

        {/* Year */}
        <div className="space-y-1.5">
          <label htmlFor="year-input" className="block text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-fg">
            Year
         </label>
          <input
            id="year-input"
            type="text"
            value={academicYear}
            onChange={(e) => setClassContext(className, sectionName, e.target.value)}
            placeholder="2026-2027"
            disabled={isProcessing}
            className="w-full h-11 px-3 rounded-lg border border-border bg-background text-[0.9375rem] text-foreground font-mono
                       focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
       </div>
     </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <h3 className="font-display text-[1.25rem] font-bold text-foreground tracking-tight">
                Add school
             </h3>
              <p className="text-[0.875rem] text-muted-fg mt-1.5 leading-relaxed">
                Create a new school folder. You can add classes and students after.
             </p>
           </div>
            <form onSubmit={handleCreateSchool} className="px-6 pb-6 pt-4 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="new-school-name" className="block text-[0.8125rem] font-medium text-foreground">
                  School name
               </label>
                <input
                  id="new-school-name"
                  type="text"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  placeholder="DAV Public School"
                  className="w-full h-11 px-3 rounded-lg border border-border bg-background text-[0.9375rem] text-foreground
                             focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                  autoFocus
                  required
                />
             </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="new-school-code" className="block text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-fg">
                    Short code
                </label>
                  <input
                    id="new-school-code"
                    type="text"
                    value={newSchoolCode}
                    onChange={(e) => setNewSchoolCode(e.target.value)}
                    placeholder="DAV01"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[0.875rem] text-foreground font-mono
                               focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="new-school-official-id" className="block text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-fg">
                    Official ID
                </label>
                  <input
                    id="new-school-official-id"
                    type="text"
                    value={newSchoolOfficialId}
                    onChange={(e) => setNewSchoolOfficialId(e.target.value)}
                    placeholder="UDISE+ code"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[0.875rem] text-foreground font-mono
                               focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                  />
                </div>
                </div>
              <p className="text-[0.75rem] text-muted-fg -mt-1">
                Both optional. Short code is your own label; official ID is the government-issued one.
                </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-10 px-4 text-[0.875rem] font-medium rounded-lg hover:bg-muted text-foreground transition-colors"
                >
                  Cancel
               </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newSchoolName.trim()}
                  className="flex items-center gap-1.5 h-10 px-4 text-[0.875rem] font-semibold rounded-lg bg-primary text-primary-fg
                             hover:bg-primary-hover active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : null}
                  Create school
               </button>
             </div>
           </form>
         </div>
       </div>
      )}

      {/* Manage Modal */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-display text-[1.25rem] font-bold text-foreground tracking-tight">
                  Manage schools
               </h3>
                <p className="text-[0.8125rem] text-muted-fg mt-0.5">
                  Edit names or delete schools.
               </p>
             </div>
              <button
                onClick={() => {
                  setShowManageModal(false);
                  setEditSchoolId(null);
                }}
                className="h-9 px-3.5 text-[0.8125rem] font-medium rounded-lg bg-muted text-foreground hover:bg-border transition-colors"
              >
                Done
             </button>
           </div>

            <div className="p-2 overflow-y-auto thin-scrollbar">
              {schools.length === 0 ? (
                <div className="px-6 py-12 text-center text-[0.875rem] text-muted-fg">
                  No schools added yet.
               </div>
              ) : (
                <ul className="divide-y divide-border">
                  {schools.map((s) => (
                    <li key={s.id} className="px-4 py-3 hover:bg-muted/40 rounded-xl transition-colors">
                      {editSchoolId === s.id ? (
                        <form onSubmit={handleUpdateSchool} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editSchoolName}
                            onChange={(e) => setEditSchoolName(e.target.value)}
                            placeholder="School name"
                            className="flex-1 min-w-0 h-9 px-3 rounded-lg border border-primary bg-background text-[0.9375rem] text-foreground
                                       focus:outline-none focus:ring-2 focus:ring-ring"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={editSchoolCode}
                            onChange={(e) => setEditSchoolCode(e.target.value)}
                            placeholder="Code"
                            className="w-20 h-9 px-2 rounded-lg border border-border bg-background text-[0.875rem] text-foreground font-mono
                                       focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <input
                            type="text"
                            value={editSchoolOfficialId}
                            onChange={(e) => setEditSchoolOfficialId(e.target.value)}
                            placeholder="Official ID"
                            className="w-28 h-9 px-2 rounded-lg border border-border bg-background text-[0.875rem] text-foreground font-mono
                                       focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <button
                            type="submit"
                            disabled={isSubmitting || !editSchoolName.trim()}
                            className="h-9 px-3 text-[0.8125rem] font-semibold rounded-lg bg-primary text-primary-fg
                                       hover:bg-primary-hover disabled:opacity-50 transition-colors"
                          >
                            Save
                         </button>
                          <button
                            type="button"
                            onClick={() => setEditSchoolId(null)}
                            className="h-9 px-3 text-[0.8125rem] font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                          >
                            Cancel
                         </button>
                       </form>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[0.9375rem] font-medium text-foreground truncate">{s.name}</span>
                            {s.code && (
                              <span
                                className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md border border-border bg-muted text-[0.6875rem] font-mono font-medium text-muted-fg"
                                title="Short code"
                              >
                                {s.code}
                              </span>
                            )}
                            {s.officialId && (
                              <span
                                className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md border border-border bg-background text-[0.6875rem] font-mono text-muted-fg"
                                title="Official ID"
                              >
                                {s.officialId}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => {
                                setEditSchoolId(s.id);
                                setEditSchoolName(s.name);
                                setEditSchoolCode(s.code || '');
                                setEditSchoolOfficialId(s.officialId || '');
                              }}
                              className="p-1.5 text-muted-fg hover:text-foreground rounded-md hover:bg-muted transition-colors"
                              title="Edit name"
                              aria-label="Edit school name"
                            >
                              <Pencil size={14} strokeWidth={1.75} />
                           </button>
                            <button
                              onClick={() => handleDeleteSchool(s.id, s.name)}
                              disabled={isSubmitting}
                              className="p-1.5 text-muted-fg hover:text-danger rounded-md hover:bg-danger-bg transition-colors disabled:opacity-50"
                              title="Delete school"
                              aria-label="Delete school"
                            >
                              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} strokeWidth={1.75} />}
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
   </section>
  );
}
