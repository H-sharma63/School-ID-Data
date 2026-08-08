"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { Student, QueueItem } from "@/types";

// ── Store interface ── //
interface StudentStore {
  // Current batch state
  schoolId: string;
  schoolName: string;
  className: string;
  sectionName: string;
  academicYear: string;

  students: Student[];
  queue: QueueItem[];
  isProcessing: boolean;

  // Actions
  setSchoolContext: (schoolId: string, schoolName: string) => void;
  setClassContext: (className: string, sectionName: string, academicYear: string) => void;

  // Student actions
  setStudents: (students: Student[]) => void;
  addStudent: (student: Student) => void;
  updateStudent: (id: string, field: keyof Student, value: string) => void;
  deleteStudents: (ids: string[]) => void;
  clearAll: () => void;

  // Queue actions
  addToQueue: (items: QueueItem[]) => void;
  updateQueueItem: (id: string, updates: Partial<QueueItem>) => void;
  clearQueue: () => void;
  setIsProcessing: (v: boolean) => void;

  // Derived
  getStudentsForExport: () => Omit<Student, "id" | "confidence" | "needsReview" | "createdAt">[];
}

// ── Store creation ── //
export const useStudentStore = create<StudentStore>()(
  persist(
    (set, get) => ({
      schoolId: "",
      schoolName: "",
      className: "",
      sectionName: "",
      academicYear: "2026-2027", // Default current year

      students: [],
      queue: [],
      isProcessing: false,

      setSchoolContext: (schoolId, schoolName) => set({ schoolId, schoolName }),
      setClassContext: (className, sectionName, academicYear) =>
        set({ className, sectionName, academicYear }),

      setStudents: (students) => set({ students }),
      addStudent: (student) =>
        set((s) => ({ students: [...s.students, student] })),
      updateStudent: (id, field, value) =>
        set((s) => ({
          students: s.students.map((st) => {
            if (st.id !== id) return st;
            const updated = { ...st, [field]: value };

            // Recalculate needsReview
            const fieldsToCheck = [
              "admissionNo", "studentName", "fatherName", "motherName",
              "dob", "classSection", "mobileNumber", "address",
            ] as const;

            updated.needsReview = fieldsToCheck.some((f) => {
              const val = updated[f];
              if (typeof val === "string") {
                return val === "UNCLEAR" || val === "";
              }
              return false;
            }) || Object.values(updated.confidence).some((c) => c === "low");

            return updated;
          }),
        })),
      deleteStudents: (ids) =>
        set((s) => ({
          students: s.students.filter((st) => !ids.includes(st.id)),
        })),
      clearAll: () =>
        set({ students: [], queue: [], isProcessing: false }), // keep context but clear data

      addToQueue: (items) =>
        set((s) => ({ queue: [...s.queue, ...items] })),
      updateQueueItem: (id, updates) =>
        set((s) => ({
          queue: s.queue.map((q) =>
            q.id === id ? { ...q, ...updates } : q
          ),
        })),
      clearQueue: () => set({ queue: [] }),
      setIsProcessing: (v) => set({ isProcessing: v }),

      getStudentsForExport: () => {
        return get().students.map(
          ({ id, confidence, needsReview, createdAt, ...rest }) => rest
        );
      },
    }),
    {
      name: "school-id-extractor-storage", // localStorage key
    }
  )
);