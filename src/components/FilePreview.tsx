"use client";

import { Loader2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
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
      icon: <div className="w-2 h-2 rounded-full bg-muted-fg/40" />,
      label: "Waiting",
      textClass: "text-muted-fg",
    },
    processing: {
      icon: <Loader2 size={13} className="animate-spin" />,
      label: "Reading form",
      textClass: "text-warning",
    },
    done: {
      icon: <CheckCircle2 size={13} />,
      label: "Done",
      textClass: "text-success",
    },
    error: {
      icon: <XCircle size={13} />,
      label: item.error || "Failed",
      textClass: "text-danger",
    },
  };

  const config = statusConfig[item.status];

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card">
      {item.thumbnail ? (
        <div className="w-9 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.thumbnail}
            alt={item.fileName}
            className="w-full h-full object-cover"
          />
       </div>
      ) : (
        <div className="w-9 h-12 rounded-md bg-muted flex-shrink-0 flex items-center justify-center border border-border">
          <span className="text-[0.625rem] text-muted-fg font-mono uppercase">IMG</span>
       </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-[0.875rem] font-medium text-foreground truncate">{item.fileName}</p>
        <div className={`flex items-center gap-1.5 text-[0.75rem] ${config.textClass} mt-0.5 font-medium`}>
          {config.icon}
          <span>{config.label}</span>
       </div>
     </div>

      <div className="flex items-center gap-0.5 flex-shrink-0">
        {item.status === "error" && onRetry && (
          <button
            onClick={() => onRetry(item.id)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-fg hover:text-foreground hover:bg-muted transition-colors"
            title="Retry this form"
            aria-label="Retry"
          >
            <RotateCcw size={13} strokeWidth={1.75} />
         </button>
        )}
        {onRemove && (
          <button
            onClick={() => onRemove(item.id)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-fg hover:text-danger hover:bg-danger-bg transition-colors"
            title="Remove from queue"
            aria-label="Remove from queue"
          >
            <XCircle size={13} strokeWidth={1.75} />
         </button>
        )}
     </div>
   </div>
  );
}
