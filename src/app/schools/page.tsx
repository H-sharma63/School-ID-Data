"use client";

import { useState, useEffect } from "react";
import { Building2, Users, Loader2, ChevronDown, ChevronRight, Plus, UploadCloud, ArrowUpCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import ImportStudentsModal from "@/components/ImportStudentsModal";
import GlobalSearch from "@/components/GlobalSearch";
import PromoteModal from "@/components/PromoteModal";

interface Section {
  id: string;
  name: string;
  academicYear: string;
  studentCount: number;
}

interface Class {
  name: string;
  sections: Section[];
  totalStudents: number;
}

interface School {
  id: string;
  name: string;
  code?: string;
  officialId?: string;
  classes: Class[];
  totalStudents: number;
}

export default function SchoolsPage() {
  const { data: session } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [expanded, setExpanded] = useState<{
    [schoolId: string]: { [className: string]: boolean };
  }>({});

  // Add-school modal
  const [showAddModal, setShowAddModal] = useState(false);
  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  // Promote modal
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolCode, setNewSchoolCode] = useState("");
  const [newSchoolOfficialId, setNewSchoolOfficialId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/sections");
        if (!res.ok) throw new Error("Failed to load schools");
        const data = await res.json();
        setSchools(data.schools || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function reloadSchools() {
    try {
      const res = await fetch("/api/sections");
      if (!res.ok) return;
      const data = await res.json();
      setSchools(data.schools || []);
    } catch (err) {
      console.error(err);
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
      const created = data.school;

      setSchools((prev) => [
        ...prev,
        {
          id: created.id,
          name: created.name,
          code: created.code,
          officialId: created.officialId,
          classes: [],
          totalStudents: 0,
        },
      ]);

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

  function toggleNode(schoolId: string, className: string) {
    setExpanded((prev) => ({
      ...prev,
      [schoolId]: {
        ...prev[schoolId],
        [className]: !prev[schoolId]?.[className],
      },
    }));
  }

  function goToSection(sectionId: string, schoolId: string, className: string, sectionName: string, academicYear: string) {
    const sp = new URLSearchParams();
    if (schoolId) sp.set("school", schoolId);
    if (className) sp.set("class", className);
    if (sectionName) sp.set("section", sectionName);
    if (academicYear) sp.set("year", academicYear);
    window.location.href = `/?${sp.toString()}`;
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-14 space-y-6">
        <div className="bg-card border border-border rounded-2xl p-12">
          <div className="flex items-center justify-center gap-3 text-muted-fg">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-[0.875rem]">Loading school hierarchy</span>
        </div>
      </div>
    </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-14 space-y-6">
        <div className="bg-danger-bg text-danger border border-danger/30 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Building2 size={17} strokeWidth={1.5} />
            <h2 className="font-display font-bold text-[1rem] tracking-tight">
              Couldn't load schools
          </h2>
        </div>
          <p className="mt-2 text-[0.875rem]">{error}</p>
      </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-10 sm:py-14 space-y-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold tracking-tight text-foreground flex items-center gap-3">
            <Building2 size={24} strokeWidth={1.5} className="text-muted-fg" />
            School hierarchy
      </h1>
          <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPromoteModal(true)}
                disabled={schools.length === 0}
                className="flex items-center gap-1.5 h-10 px-4 text-[0.875rem] font-medium rounded-lg border border-border bg-background text-foreground
                           hover:bg-muted active:translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title={schools.length === 0 ? "Add a school first" : "Promote students to next academic year"}
              >
                <ArrowUpCircle size={16} strokeWidth={1.75} />
                Promote
              </button>
            
              <button
                onClick={() => setShowImportModal(true)}
                disabled={schools.length === 0}
                className="flex items-center gap-1.5 h-10 px-4 text-[0.875rem] font-medium rounded-lg border border-border bg-background text-foreground
                           hover:bg-muted active:translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title={schools.length === 0 ? "Add a school first" : "Import students from Excel/CSV"}
              >
                <UploadCloud size={16} strokeWidth={1.75} />
                Import
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 h-10 px-4 text-[0.875rem] font-semibold rounded-lg bg-primary text-primary-fg
                           hover:bg-primary-hover active:translate-y-px transition-all"
              >
                <Plus size={16} strokeWidth={2} />
                Add school
              </button>
          </div>
       </div>
        <p className="text-[0.9375rem] text-muted-fg max-w-xl leading-relaxed">
          Browse every school, class, and section. Click any section to load its student roster.
      </p>
    </header>

      <div className="py-2">
        <GlobalSearch />
      </div>

      {schools.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Building2 size={20} strokeWidth={1.5} className="text-muted-fg mx-auto mb-3" />
          <p className="text-[0.9375rem] text-muted-fg">No schools or sections yet</p>
      </div>
      )}

      <div className="space-y-4">
        {schools.map((school) => (
          <article
            key={school.id}
            className="border border-border rounded-2xl bg-card overflow-hidden"
          >
            {/* School header */}
            <button
              onClick={() => goToSection("", school.id, "", "", "")}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/40 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Building2 size={17} strokeWidth={1.5} className="text-muted-fg" />
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="font-display font-bold text-[1.0625rem] tracking-tight text-foreground truncate">
                    {school.name}
                </h2>
                  {school.code && (
                    <span
                      className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md border border-border bg-muted text-[0.6875rem] font-mono font-medium text-muted-fg"
                      title="Short code"
                    >
                      {school.code}
                  </span>
                  )}
                  {school.officialId && (
                    <span
                      className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md border border-border bg-background text-[0.6875rem] font-mono text-muted-fg"
                      title="Official ID"
                    >
                      {school.officialId}
                  </span>
                  )}
              </div>
            </div>
              <div className="flex items-center gap-3 text-[0.8125rem] text-muted-fg">
                <span className="flex items-center gap-1.5">
                  <Users size={13} strokeWidth={1.5} />
                  <span className="font-mono tabular-nums">{school.totalStudents}</span>
              </span>
                <ChevronDown size={15} strokeWidth={1.75} />
            </div>
          </button>

            {/* Classes */}
            <div className="border-t border-border">
              {school.classes.map((cls) => (
                <div key={cls.name} className="border-b border-border last:border-b-0">
                  <button
                    onClick={() => toggleNode(school.id, cls.name)}
                    className="w-full px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {expanded[school.id]?.[cls.name] ? (
                        <ChevronDown size={14} strokeWidth={1.75} className="text-muted-fg" />
                      ) : (
                        <ChevronRight size={14} strokeWidth={1.75} className="text-muted-fg" />
                      )}
                      <h3 className="font-display font-semibold text-[0.9375rem] tracking-tight text-foreground">
                        Class {cls.name}
                    </h3>
                  </div>
                    <span className="font-mono text-[0.75rem] tabular-nums text-muted-fg">
                      {cls.totalStudents} student{cls.totalStudents !== 1 ? "s" : ""}
                  </span>
                </button>

                  {expanded[school.id]?.[cls.name] && (
                    <div className="border-t border-border bg-background">
                      {cls.sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => goToSection(section.id, school.id, cls.name, section.name, section.academicYear)}
                          className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors text-left border-b border-border last:border-b-0"
                        >
                          <span className="text-[0.9375rem] font-medium text-foreground">
                            Section {section.name}
                        </span>
                          <div className="flex items-center gap-3 text-[0.75rem]">
                            <span className="font-mono tabular-nums text-muted-fg">
                              {section.studentCount} student{section.studentCount !== 1 ? "s" : ""}
                          </span>
                            <span className="font-mono text-muted-fg/70">{section.academicYear}</span>
                        </div>
                      </button>
                      ))}
                  </div>
                  )}
              </div>
              ))}
          </div>
        </article>
        ))}
    </div>

      {/* Add School Modal */}
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
                <label htmlFor="new-school-name-schools" className="block text-[0.8125rem] font-medium text-foreground">
                  School name
          </label>
                <input
                  id="new-school-name-schools"
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
                  <label htmlFor="new-school-code-schools" className="block text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-fg">
                    Short code
            </label>
                  <input
                    id="new-school-code-schools"
                    type="text"
                    value={newSchoolCode}
                    onChange={(e) => setNewSchoolCode(e.target.value)}
                    placeholder="DAV01"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[0.875rem] text-foreground font-mono
                               focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                  />
          </div>
                <div className="space-y-1.5">
                  <label htmlFor="new-school-official-id-schools" className="block text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-fg">
                    Official ID
            </label>
                  <input
                    id="new-school-official-id-schools"
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

      {/* Import Students Modal */}
      <ImportStudentsModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        schools={schools}
        defaultSchoolId={schools[0]?.id}
        onImported={reloadSchools}
      />

      {/* Promote Modal */}
      <PromoteModal
        open={showPromoteModal}
        onClose={() => setShowPromoteModal(false)}
        schools={schools}
      />
        </div>
      </main>
    </div>
  );
}
