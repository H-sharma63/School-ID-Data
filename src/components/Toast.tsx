"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { subscribe, type ToastItem } from "@/lib/toast";

const MAX_VISIBLE = 5;
const EXIT_ANIM_MS = 300;

const TYPE_STYLES: Record<
  ToastItem["type"],
  { iconBg: string; iconFg: string; Icon: typeof CheckCircle2 }
> = {
  success: {
    iconBg: "bg-success-bg",
    iconFg: "text-success",
    Icon: CheckCircle2,
  },
  error: {
    iconBg: "bg-danger-bg",
    iconFg: "text-danger",
    Icon: AlertTriangle,
  },
  info: {
    iconBg: "bg-primary/[0.08]",
    iconFg: "text-primary",
    Icon: Info,
  },
};

interface VisibleToast extends ToastItem {
  leaving: boolean;
}

export default function Toast() {
  const [toasts, setToasts] = useState<VisibleToast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [mounted, setMounted] = useState(false);

  // Only render portal after mount (SSR safety)
  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: string) => {
    // Mark as leaving for exit animation, then remove after animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_ANIM_MS);
    // Clear any pending auto-dismiss timer
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const unsub = subscribe((item) => {
      setToasts((prev) => {
        // Cap at max visible — remove oldest first
        const trimmed = prev.length >= MAX_VISIBLE ? prev.slice(prev.length - MAX_VISIBLE + 1) : prev;
        // Also dismiss the oldest if exceeding
        if (prev.length >= MAX_VISIBLE) {
          const oldest = prev[0];
          const timer = timersRef.current.get(oldest.id);
          if (timer) clearTimeout(timer);
          timersRef.current.delete(oldest.id);
        }
        return [...trimmed, { ...item, leaving: false }];
      });

      // Auto-dismiss timer (0 = sticky)
      if (item.duration > 0) {
        const timer = setTimeout(() => {
          dismiss(item.id);
          timersRef.current.delete(item.id);
        }, item.duration);
        timersRef.current.set(item.id, timer);
      }
    });

    // Cleanup all timers on unmount
    return () => {
      unsub();
      for (const timer of timersRef.current.values()) clearTimeout(timer);
      timersRef.current.clear();
    };
  }, [dismiss]);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full"
    >
      {toasts.map((t) => {
        const { iconBg, iconFg, Icon } = TYPE_STYLES[t.type];
        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg bg-card border-border
              ${t.leaving ? "animate-toast-exit" : "animate-toast-enter"}`}
          >
            <span
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}
            >
              <Icon size={16} className={iconFg} />
            </span>
            <p className="flex-1 text-sm font-medium text-foreground leading-snug pt-0.5">
              {t.message}
            </p>
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 p-1 rounded-lg text-muted-fg hover:text-foreground hover:bg-muted transition-colors -mr-1"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}