"use client";

import FilePreview from "@/components/FilePreview";
import RateLimitBar from "@/components/RateLimitBar";
import type { QueueItem } from "@/types";

interface ProcessingQueueProps {
  queue: QueueItem[];
  onRetry?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export default function ProcessingQueue({
  queue,
  onRetry,
  onRemove,
}: ProcessingQueueProps) {
  if (queue.length === 0) return null;

  const stats = {
    pending: queue.filter((q) => q.status === "pending").length,
    processing: queue.filter((q) => q.status === "processing").length,
    done: queue.filter((q) => q.status === "done").length,
    error: queue.filter((q) => q.status === "error").length,
  };

  const pill = (color: "success" | "warning" | "muted" | "danger", label: string, count: number) => (
    count > 0 ? (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-xs uppercase tracking-wider font-semibold
        ${color === "success" ? "text-success bg-success-bg"
          : color === "warning" ? "text-warning bg-warning-bg"
          : color === "danger" ? "text-danger bg-danger-bg"
          : "text-muted-fg bg-muted"}`}
      >
        <span className="tabular-nums">{count}</span> {label}
      </span>
    ) : null
  );

  return (
    <div className="space-y-4">
      <RateLimitBar />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-muted-fg">
          Queue <span className="font-mono ml-1.5 text-muted-fg/70">{queue.length}</span>
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {pill("muted", "waiting", stats.pending)}
          {pill("warning", "processing", stats.processing)}
          {pill("success", "done", stats.done)}
          {pill("danger", "failed", stats.error)}
        </div>
     </div>

      <div className="space-y-2 max-h-80 overflow-y-auto thin-scrollbar">
        {queue.map((item) => (
          <FilePreview
            key={item.id}
            item={item}
            onRetry={onRetry}
            onRemove={onRemove}
          />
        ))}
     </div>
   </div>
  );
}
