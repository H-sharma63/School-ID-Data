"use client";

import { useStudentStore } from "@/store/useStudentStore";
import { Users, CheckCircle2, AlertTriangle } from "lucide-react";

export default function StatusBar() {
  const { students, batchName } = useStudentStore();
  const total = students.length;
  const needsReview = students.filter((s) => s.needsReview).length;
  const ready = total - needsReview;

  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-surface border border-border text-sm shadow-sm">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        {/* Total */}
        <div className="flex items-center gap-1.5 text-muted-fg">
          <Users size={15} />
          <span>
            <strong className="text-foreground font-semibold">{total}</strong>{" "}
            student{total !== 1 ? "s" : ""} loaded
          </span>
        </div>

        {/* Ready */}
        <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
          <CheckCircle2 size={15} />
          <span>
            <strong className="font-semibold">{ready}</strong> ready for export
          </span>
        </div>

        {/* Needs review */}
        {needsReview > 0 && (
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
            <AlertTriangle size={15} />
            <span>
              <strong className="font-semibold">{needsReview}</strong> need
              {needsReview === 1 ? "s" : ""} review
            </span>
          </div>
        )}
      </div>

      {/* Batch tag */}
      {batchName && (
        <span className="px-2.5 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-fg">
          {batchName}
        </span>
      )}
    </div>
  );
}