"use client";

import { useState, useRef, useEffect } from "react";
import { AlertTriangle, Loader2, Check, X } from "lucide-react";
import type { ConfidenceLevel } from "@/types";

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  confidence?: ConfidenceLevel;
  saveStatus?: SaveStatus;
}

export default function EditableCell({
  value,
  onChange,
  confidence = "high",
  saveStatus = "idle",
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    onChange(draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const valueIsUnclear = value === "UNCLEAR";
  const valueIsEmpty = value === "";
  const needsReview = valueIsUnclear || valueIsEmpty || confidence === "low" || confidence === "medium";

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className="w-full px-3 py-2 text-[0.875rem] bg-card border-2 border-primary rounded-lg
                   text-foreground outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background font-mono tabular-nums
                   min-w-[5rem]"
        autoFocus
      />
    );
  }

  let cellClasses =
    "px-3 py-2 text-[0.875rem] cursor-pointer transition-colors duration-150 relative group ";

  if (valueIsUnclear || valueIsEmpty) {
    cellClasses += "text-danger ";
  } else if (confidence === "low" || confidence === "medium") {
    cellClasses += "text-warning ";
  } else {
    cellClasses += "text-foreground hover:bg-muted/50 ";
  }

  cellClasses +=
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background whitespace-nowrap min-w-[5rem] font-mono tabular-nums";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setEditing(true);
        }
      }}
      className={cellClasses}
      title={
        valueIsUnclear
          ? "Could not read — click to type"
          : valueIsEmpty
            ? "Empty — click to fill"
            : confidence === "low"
              ? "Low confidence — please verify"
              : confidence === "medium"
                ? "Medium confidence — please verify"
                : "Click to edit"
      }
    >
      {/* Subtle bottom border for status instead of full pill background */}
      {needsReview && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-[2px] opacity-60
            ${(valueIsUnclear || valueIsEmpty) ? 'bg-danger' : 'bg-warning'}
          `}
        />
      )}

      <div className="relative z-10 flex items-center gap-1.5">
        {valueIsUnclear ? (
          <>
            <AlertTriangle size={12} strokeWidth={2} />
            <span className="text-[0.75rem] font-bold">UNCLEAR</span>
          </>
        ) : valueIsEmpty ? (
          <span className="text-[0.75rem] opacity-50">(empty)</span>
        ) : (
          value
        )}
     </div>

      {/* Per-cell autosave status */}
      {saveStatus !== "idle" && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[0.625rem] font-medium uppercase tracking-[0.04em] pointer-events-none whitespace-nowrap">
          {saveStatus === "saving" && (
            <>
              <Loader2 size={9} strokeWidth={2} className="animate-spin text-muted-fg" />
              <span className="text-muted-fg">saving</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check size={9} strokeWidth={2.5} className="text-success" />
              <span className="text-success">saved</span>
            </>
          )}
          {saveStatus === "failed" && (
            <>
              <X size={9} strokeWidth={2.5} className="text-danger" />
              <span className="text-danger">failed</span>
            </>
          )}
       </div>
      )}
 </div>
  );
}
