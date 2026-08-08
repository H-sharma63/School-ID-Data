"use client";

import { Loader2, CheckCircle2, AlertTriangle, XCircle, RotateCcw } from "lucide-react";
import type { QueueItem } from "@/types";

interface FilePreviewProps {
  item: QueueItem;
  onRetry?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export default function FilePreview({
  item,
  onRetry,
  onRemove,
}: FilePreviewProps) {
  const statusConfig = {
    pending: {
      icon: <div className="w-4 h-4 rounded-full border-2 border-muted-fg/50" />,
      bg: "bg-surface border-border",
      label: "Waiting...",
      textClass: "text-muted-fg",
      dot: "bg-muted-fg/30",
    },
    processing: {
      icon: <Loader2 size={16} className="animate-spin" />,
      bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
      label: "AI reading form...",
      textClass: "text-blue-700 dark:text-blue-400",
      dot: "bg-blue-500",
    },
    done: {
      icon: <CheckCircle2 size={16} />,
      bg: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
      label: "Done! Data extracted",
      textClass: "text-green-700 dark:text-green-400",
      dot: "bg-green-500",
    },
    error: {
      icon: <XCircle size={16} />,
      bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
      label: item.error || "Failed to process",
      textClass: "text-red-700 dark:text-red-400",
      dot: "bg-red-500",
    },
  };

  const config = statusConfig[item.status];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${config.bg} transition-all duration-300`}
    >
      {/* Thumbnail */}
      {item.thumbnail ? (
        <div className="w-10 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.thumbnail}
            alt={item.fileName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-10 h-14 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center border border-border">
          <span className="text-[10px] text-muted-fg font-mono">IMG</span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.fileName}</p>
        <div className={`flex items-center gap-1.5 text-xs ${config.textClass} mt-0.5`}>
          {config.icon}
          <span>{config.label}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {item.status === "error" && onRetry && (
          <button
            onClick={() => onRetry(item.id)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-muted-fg hover:text-primary transition-colors"
            title="Retry this form"
          >
            <RotateCcw size={15} />
          </button>
        )}
        {onRemove && (
          <button
            onClick={() => onRemove(item.id)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-muted-fg hover:text-danger transition-colors"
            title="Remove from queue"
          >
            <XCircle size={15} />
          </button>
        )}
      </div>
    </div>
  );
}