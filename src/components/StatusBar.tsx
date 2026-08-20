"use client";

import { useStudentStore } from "@/store/useStudentStore";

export default function StatusBar() {
  const { students } = useStudentStore();
  const total = students.length;
  const needsReview = students.filter((s) => s.needsReview).length;
  const ready = total - needsReview;

  if (total === 0) return null;

  const pill = (color: "success" | "warning" | "muted", label: string, count: number) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-xs uppercase tracking-wider font-semibold
      ${color === "success" ? "text-success bg-success-bg" : color === "warning" ? "text-warning bg-warning-bg" : "text-muted-fg bg-muted"}`}
    >
      <span className="tabular-nums">{count}</span> {label}
    </span>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="text-muted-fg text-[0.8125rem]">
        <span className="font-mono tabular-nums text-foreground font-semibold">{total}</span> student{total !== 1 ? "s" : ""} loaded
      </span>
      {pill("success", "ready", ready)}
      {needsReview > 0 && pill("warning", "review", needsReview)}
    </div>
  );
}