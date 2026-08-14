"use client";

import { useState, useEffect } from "react";
import { Timer } from "lucide-react";
import { onRateLimitChange, getRateLimitState, type RateLimitState } from "@/lib/rate-limits";

export default function RateLimitBar() {
  const [state, setState] = useState<RateLimitState>(getRateLimitState());

  useEffect(() => {
    const unsub = onRateLimitChange(() => setState(getRateLimitState()));
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
    <div className="space-y-2.5">
      {state.isPaused && (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-warning-bg border border-warning/20 text-[0.8125rem]">
          <Timer size={14} strokeWidth={1.75} className="text-warning flex-shrink-0" />
          <span className="text-foreground font-medium">
            {state.pauseReason.replace(/in \d+s/, calcRemainingTime(state.pausedUntil))}
         </span>
       </div>
      )}

      <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-fg w-8">RPM</span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                rpmPct > 80 ? "bg-danger" : rpmPct > 50 ? "bg-warning" : "bg-success"
              }`}
              style={{ width: `${rpmPct}%` }}
            />
         </div>
          <span className="text-[0.75rem] tabular-nums text-muted-fg whitespace-nowrap font-mono w-12 text-right">
            {rpmRemaining}/{state.rpmLimit}
         </span>
       </div>

        <div className="flex items-center gap-2">
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-fg w-8">DAY</span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                rpdPct > 80 ? "bg-danger" : rpdPct > 50 ? "bg-warning" : "bg-success"
              }`}
              style={{ width: `${rpdPct}%` }}
            />
         </div>
          <span className="text-[0.75rem] tabular-nums text-muted-fg whitespace-nowrap font-mono w-12 text-right">
            {rpdRemaining}/{state.rpdLimit}
         </span>
       </div>
     </div>
   </div>
  );
}
