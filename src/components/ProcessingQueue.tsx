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
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* Rate Limit Bar */}
      <RateLimitBar />

      {/* Queue Summary */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-foreground">
          Processing Queue ({queue.length} photo{queue.length !== 1 ? "s" : ""})
        </h3>
        <div className="flex items-center gap-3 text-xs">
          {stats.pending > 0 && (
            <span className="text-muted-fg">{stats.pending} waiting</span>
          )}
          {stats.processing > 0 && (
            <span className="text-primary font-semibold">
              {stats.processing} processing
            </span>
          )}
          {stats.done > 0 && (
            <span className="text-success font-semibold">
              {stats.done} done
            </span>
          )}
          {stats.error > 0 && (
            <span className="text-danger font-semibold">
              {stats.error} failed
            </span>
          )}
        </div>
      </div>

      {/* File List */}
      <div className="space-y-2 max-h-80 overflow-y-auto thin-scrollbar pr-1">
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