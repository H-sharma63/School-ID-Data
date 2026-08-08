"use client";

import { useState, useRef, useEffect } from "react";
import type { ConfidenceLevel } from "@/types";

interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  confidence?: ConfidenceLevel;
}

export default function EditableCell({
  value,
  onChange,
  confidence = "high",
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

  // Conditional styling based on confidence
  let cellClasses = "px-2.5 py-1.5 text-sm rounded-lg cursor-pointer border border-transparent ";
  if (valueIsUnclear || valueIsEmpty) {
    cellClasses +=
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800 italic ";
  } else if (confidence === "low") {
    cellClasses +=
      "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/25 dark:text-amber-400 dark:border-amber-800 ";
  } else if (confidence === "medium") {
    cellClasses +=
      "bg-yellow-50 text-yellow-900 border-yellow-100 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800 ";
  } else {
    cellClasses +=
      "hover:border-ring hover:bg-muted/30 dark:hover:bg-muted/20 ";
  }
  cellClasses += "transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap min-w-[80px]";

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
        className="w-full px-2.5 py-1.5 text-sm border-2 border-primary rounded-lg
                   bg-card text-foreground outline-none ring-2 ring-primary/30
                   min-w-[80px]"
        autoFocus
      />
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setEditing(true);
      }}
      className={cellClasses}
      title={
        valueIsUnclear
          ? "Could not read — click to type manually"
          : valueIsEmpty
            ? "Empty — click to fill in"
            : confidence === "low"
              ? "AI unsure — click to verify"
              : confidence === "medium"
                ? "AI moderately confident — click to check"
                : "Click to edit"
      }
    >
      {valueIsUnclear ? (
        <span className="flex items-center gap-1 text-xs font-medium">
          ⚠️ UNCLEAR
        </span>
      ) : valueIsEmpty ? (
        <span className="text-xs italic opacity-50">(empty)</span>
      ) : (
        value
      )}
    </div>
  );
}