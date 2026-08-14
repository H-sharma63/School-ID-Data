"use client";

import { useStudentStore } from "@/store/useStudentStore";
import { Users, CheckCircle2, AlertTriangle } from "lucide-react";

export default function StatusBar() {
  const { students } = useStudentStore();
  const total = students.length;
  const needsReview = students.filter((s) => s.needsReview).length;
  const ready = total - needsReview;

  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 px-4 py-2.5 rounded-xl bg-card border border-border text-[0.8125rem]">
      <div className="flex items-center gap-1.5 text-muted-fg">
        <Users size={14} strokeWidth={1.5} />
        <span>
          <span className="font-mono tabular-nums text-foreground font-semibold">{total}</span> student{total !== 1 ? "s" : ""} loaded
      </span>
    </div>

      <div className="flex items-center gap-1.5 text-success">
        <CheckCircle2 size={14} strokeWidth={1.5} />
        <span>
          <span className="font-mono tabular-nums font-semibold">{ready}</span> ready to export
      </span>
    </div>

      {needsReview > 0 && (
        <div className="flex items-center gap-1.5 text-warning">
          <AlertTriangle size={14} strokeWidth={1.5} />
          <span>
            <span className="font-mono tabular-nums font-semibold">{needsReview}</span> need{needsReview === 1 ? "s" : ""} review
        </span>
      </div>
      )}
  </div>
  );
}
