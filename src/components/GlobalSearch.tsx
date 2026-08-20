"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, User, Building2, Phone, Edit, X, Loader2 as LoaderIcon, Check } from "lucide-react";
import { toast } from "@/lib/toast";
import type { Student } from "@/types";

interface SearchResultStudent extends Student {
  schoolId: string;
  schoolName: string;
  className: string;
  sectionName: string;
  academicYear: string;
}

interface EditableFields {
  admissionNo: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  mobileNumber: string;
  address: string;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultStudent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  // Edit modal state
  const [editingStudent, setEditingStudent] = useState<SearchResultStudent | null>(null);
  const [formData, setFormData] = useState<EditableFields>({
    admissionNo: "",
    studentName: "",
    fatherName: "",
    motherName: "",
    dob: "",
    mobileNumber: "",
    address: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/students/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data.students || []);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const openEditModal = (s: SearchResultStudent) => {
    // Convert DD-MM-YYYY to YYYY-MM-DD for date input
    const convertToDateInput = (dateStr: string) => {
      if (!dateStr) return "";
      const parts = dateStr.split(/[-/]/);
      if (parts.length === 3) {
        // Assume DD-MM-YYYY or DD/MM/YYYY
        if (parts[0].length === 4) return dateStr; // Already YYYY-MM-DD
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return "";
    };

    setFormData({
      admissionNo: s.admissionNo || "",
      studentName: s.studentName || "",
      fatherName: s.fatherName || "",
      motherName: s.motherName || "",
      dob: convertToDateInput(s.dob || ""),
      mobileNumber: s.mobileNumber || "",
      address: s.address || "",
    });
    setEditingStudent(s);
  };

  const closeEditModal = () => {
    setEditingStudent(null);
    setFormData({
      admissionNo: "",
      studentName: "",
      fatherName: "",
      motherName: "",
      dob: "",
      mobileNumber: "",
      address: "",
    });
  };

  const handleInputChange = (field: keyof EditableFields, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveStudent = async () => {
    if (!editingStudent) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingStudent.id,
          ...formData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update student");
      toast.success("Student updated successfully");
      closeEditModal();
      // Optionally refresh results by re-searching
      // setResults(prev => prev.map(s => s.id === editingStudent?.id ? { ...s, ...formData } : s));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update student");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-fg">
          {isSearching ? <LoaderIcon size={16} className="animate-spin" /> : <Search size={16} strokeWidth={2} />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Global search by name, admission no, or phone..."
          className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-card text-[0.9375rem] text-foreground
                     focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors shadow-sm"
        />
      </div>

      {query.trim().length >= 2 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {results.length === 0 && !isSearching ? (
            <div className="px-5 py-6 text-center text-[0.875rem] text-muted-fg">
              No students found for "{query}".
            </div>
          ) : (
            <ul className="divide-y divide-border max-h-[50vh] overflow-y-auto thin-scrollbar">
              {results.map((s) => (
                <li key={s.id}>
                  <div className="w-full px-5 py-3 flex items-center justify-between hover:bg-muted/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-[0.9375rem] truncate">{s.studentName}</span>
                        {s.admissionNo && (
                          <span className="font-mono text-[0.6875rem] px-1.5 py-0.5 rounded border border-border bg-muted text-muted-fg">
                            {s.admissionNo}
                          </span>
                        )}
                      </div>

                      {/* Parents */}
                      {(s.fatherName || s.motherName) && (
                        <div className="mt-0.5 text-[0.8125rem] text-muted-fg flex items-center gap-1.5">
                          <User size={13} className="opacity-70" />
                          <span className="truncate">
                            {[s.fatherName && `F: ${s.fatherName}`, s.motherName && `M: ${s.motherName}`]
                              .filter(Boolean)
                              .join("  •  ")}
                          </span>
                        </div>
                      )}

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-muted-fg">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={13} />
                          <span>{s.schoolName} — Class {s.className} / {s.sectionName}</span>
                        </div>
                        {s.mobileNumber && (
                          <div className="flex items-center gap-1.5">
                            <Phone size={13} />
                            <span className="font-mono">{s.mobileNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action button - only edit */}
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-2 rounded-lg text-muted-fg hover:text-foreground hover:bg-muted transition-colors"
                        title="Edit student details"
                        aria-label="Edit student details"
                      >
                        <Edit size={16} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Edit size={18} strokeWidth={1.75} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-[1.125rem] font-bold text-foreground tracking-tight">
                    Edit Student
                  </h3>
                  <p className="text-[0.8125rem] text-muted-fg mt-0.5">
                    {editingStudent.studentName} ({editingStudent.admissionNo})
                  </p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-fg transition-colors"
                aria-label="Close"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto thin-scrollbar">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[0.8125rem] font-medium text-foreground">Admission No</label>
                  <input
                    type="text"
                    value={formData.admissionNo}
                    onChange={(e) => handleInputChange("admissionNo", e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-border bg-background text-[0.9375rem] text-foreground
                               focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[0.8125rem] font-medium text-foreground">Student Name</label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => handleInputChange("studentName", e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-border bg-background text-[0.9375rem] text-foreground
                               focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-fg">Father's Name</label>
                    <input
                      type="text"
                      value={formData.fatherName}
                      onChange={(e) => handleInputChange("fatherName", e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[0.875rem] text-foreground
                                 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-fg">Mother's Name</label>
                    <input
                      type="text"
                      value={formData.motherName}
                      onChange={(e) => handleInputChange("motherName", e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[0.875rem] text-foreground
                                 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-fg">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[0.875rem] text-foreground
                                 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-fg">Mobile</label>
                    <input
                      type="tel"
                      value={formData.mobileNumber}
                      onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[0.875rem] text-foreground
                                 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-fg">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[0.875rem] text-foreground
                               focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 pb-6 pt-2 border-t border-border shrink-0">
              <button
                onClick={closeEditModal}
                disabled={isSaving}
                className="h-10 px-4 text-[0.875rem] font-medium rounded-lg hover:bg-muted text-foreground transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveStudent}
                disabled={isSaving}
                className="flex items-center gap-1.5 h-10 px-4 text-[0.875rem] font-semibold rounded-lg bg-primary text-primary-fg
                           hover:bg-primary-hover active:translate-y-px disabled:opacity-50 transition-all"
              >
                {isSaving ? (
                  <>
                    <LoaderIcon size={15} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check size={15} strokeWidth={2.5} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
