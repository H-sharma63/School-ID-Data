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

  return (
    <div className="space-y-4">
      <RateLimitBar />

      <div className="flex items-center justify-between">
        <h3 className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-muted-fg">
          Queue <span className="font-mono ml-1.5 text-muted-fg/70">{queue.length}</span>
        </h3>
        <div className="flex items-center gap-3 text-[0.75rem] font-mono">
          {stats.pending > 0 && (
            <span className="text-muted-fg">{stats.pending} waiting</span>
          )}
          {stats.processing > 0 && (
            <span className="text-warning">{stats.processing} processing</span>
          )}
          {stats.done > 0 && (
            <span className="text-success">{stats.done} done</span>
          )}
          {stats.error > 0 && (
            <span className="text-danger">{stats.error} failed</span>
          )}
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
