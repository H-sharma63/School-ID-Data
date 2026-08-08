"use client";

import { useState, useEffect } from "react";
import { Gauge, Timer } from "lucide-react";
import { onRateLimitChange, getRateLimitState, type RateLimitState } from "@/lib/rate-limits";

export default function RateLimitBar() {
  const [state, setState] = useState<RateLimitState>(getRateLimitState());

  useEffect(() => {
    const unsub = onRateLimitChange(() => setState(getRateLimitState()));
    // Also refresh every 5s so countdown timers update
    const interval = setInterval(() => setState(getRateLimitState()), 5000);
    return () => { unsub(); clearInterval(interval); };
  }, []);

  const rpmPct = Math.min((state.rpmUsed / state.rpmLimit) * 100, 100);
  const rpdPct = Math.min((state.rpdUsed / state.rpdLimit) * 100, 100);
  const rpmRemaining = Math.max(state.rpmLimit - state.rpmUsed, 0);
  const rpdRemaining = Math.max(state.rpdLimit - state.rpdUsed, 0);

  function calcRemainingTime(pausedUntil: number): string {
  const remainingMs = Math.max(pausedUntil - Date.now(), 0);
  const remainingS = Math.ceil(remainingMs / 1000);
  return `${remainingS}s`;
}

return (
    <div className="w-full space-y-2">
      {/* Paused / Cooldown Banner */}
      {state.isPaused && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm">
          <Timer size={16} className="text-amber-600 dark:text-amber-400 animate-pulse flex-shrink-0" />
          <span className="text-amber-800 dark:text-amber-300 font-medium">
            {state.pauseReason.replace(/in \d+s/, calcRemainingTime(state.pausedUntil))}
          </span>
        </div>
      )}

      {/* RPM Bar */}
      <div className="flex items-center gap-2">
        <Gauge size={14} className="text-muted-fg flex-shrink-0" />
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              rpmPct > 80 ? "bg-danger" : rpmPct > 50 ? "bg-amber-500" : "bg-success"
            }`}
            style={{ width: `${rpmPct}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-muted-fg whitespace-nowrap min-w-[60px] text-right">
          {rpmRemaining}/{state.rpmLimit} rpm
        </span>
      </div>

      {/* RPD Bar */}
      <div className="flex items-center gap-2">
        <Gauge size={14} className="text-muted-fg/60 flex-shrink-0" />
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              rpdPct > 80 ? "bg-danger" : rpdPct > 50 ? "bg-amber-500" : "bg-success"
            }`}
            style={{ width: `${rpdPct}%` }}
          />
        </div>
        <span className="text-[10px] tabular-nums text-muted-fg/70 whitespace-nowrap min-w-[65px] text-right">
          {rpdRemaining}/{state.rpdLimit} daily
        </span>
      </div>
    </div>
  );
}