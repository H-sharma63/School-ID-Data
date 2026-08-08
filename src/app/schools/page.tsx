"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, Gauge, ChevronDown, ChevronUp } from "lucide-react";

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
  classes: Class[];
  totalStudents: number;
}

export default function SchoolsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [expanded, setExpanded] = useState<{
    [schoolId: string]: {
      [className: string]: boolean;
    };
  }>({});

  // Load all sections grouped by school → class
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

  // Toggle tree nodes
  function toggleNode(schoolId: string, className: string) {
    setExpanded((prev) => ({
      ...prev,
      [schoolId]: {
        ...prev[schoolId],
        [className]: !prev[schoolId]?.[className],
      },
    }));
  }

  // Navigate to review page with context set
  function goToSection(sectionId: string, schoolId: string, className: string, sectionName: string, academicYear: string) {
    // Use localStorage or a context transfer method
    // Store the section we want to load, then navigate to the main page
    if (typeof sessionStorage !== "undefined") {
      try {
        sessionStorage.setItem(
          "auto-load-section",
          JSON.stringify({ sectionId, schoolId, className, sectionName, academicYear })
        );
      } catch { /* ignore */ }
    }
    window.location.href = "/";
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="bg-surface border border-border rounded-2xl p-8">
          <div className="flex items-center justify-center gap-3 text-muted-fg">
            <Gauge size={20} className="animate-spin" />
            <span>Loading school hierarchy...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="bg-danger-bg text-danger border-2 border-danger rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <Building2 size={20} />
            <h2 className="font-semibold">Error loading schools</h2>
          </div>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
        <Building2 size={28} />
        School Hierarchy
      </h1>
      <p className="text-muted-fg mb-6 max-w-lg">
        Browse all schools, classes, and sections. Click any section to load its student data.
      </p>

      {schools.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-8">
          <div className="flex items-center gap-3 text-muted-fg">
            <Building2 size={20} />
            <span>No schools or sections created yet.</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {schools.map((school) => (
          <div
            key={school.id}
            className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden"
          >
            {/* School Header */}
            <button
              onClick={() => goToSection("", school.id, "", "", "")}
              className="w-full px-5 py-4 flex items-center justify-between bg-primary hover:bg-primary-hover transition-all"
            >
              <div className="flex items-center gap-3">
                <Building2 size={18} className="text-primary-fg" />
                <h2 className="text-xl font-bold text-primary-fg">
                  {school.name}
                </h2>
              </div>
              <div className="flex items-center gap-4 text-sm text-primary-fg">
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {school.totalStudents} students
                </span>
                <ChevronDown size={18} />
              </div>
            </button>

            {/* Classes */}
            {school.classes.map((cls) => (
              <div key={cls.name} className="border-t border-border">
                {/* Class Header */}
                <button
                  onClick={() => toggleNode(school.id, cls.name)}
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      Class {cls.name}
                    </h3>
                    <span className="text-xs bg-primary/10 dark:bg-primary/30 text-primary px-1.5 py-0.5 rounded-full font-medium">
                      {cls.totalStudents} students
                    </span>
                  </div>
                  <ChevronUp
                    size={18}
                    className={`text-muted-fg transition-transform ${!expanded[school.id]?.[cls.name] && "rotate-180"}`}
                  />
                </button>

                {/* Sections */}
                {expanded[school.id]?.[cls.name] && (
                  <div className="divide-y divide-muted border-t border-muted">
                    {cls.sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => goToSection(section.id, school.id, cls.name, section.name, section.academicYear)}
                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Section {section.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-medium tabular-nums">
                            {section.studentCount} students
                          </span>
                          <span className="text-muted-fg text-xs">(
                            {section.academicYear}
                          )</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}