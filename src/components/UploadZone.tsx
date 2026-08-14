"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, ImageIcon, AlertCircle } from "lucide-react";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadZone({
  onFilesSelected,
  disabled = false,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragReject, setIsDragReject] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback(
    (files: FileList | File[]): File[] => {
      const valid: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_SIZE) {
          valid.push(f);
        }
      }
      return valid;
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      setIsDragReject(false);
      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      const valid = validateFiles(droppedFiles);
      if (valid.length === 0 && droppedFiles.length > 0) {
        setIsDragReject(true);
        setTimeout(() => setIsDragReject(false), 2000);
        return;
      }
      if (valid.length > 0) {
        onFilesSelected(valid);
      }
    },
    [disabled, validateFiles, onFilesSelected]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleBrowse = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const valid = validateFiles(files);
      if (valid.length > 0) onFilesSelected(valid);
      e.target.value = "";
    },
    [disabled, validateFiles, onFilesSelected]
  );

  const active = isDragOver && !disabled;
  const reject = isDragReject;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={0}
        aria-label="Drop form photos here or click Browse Files"
        className={`
          relative border-2 border-dashed rounded-2xl px-8 py-12 sm:py-16
          flex flex-col items-center justify-center gap-5 text-center
          cursor-pointer transition-colors duration-150 outline-none
          ${
            active
              ? "border-primary bg-primary/[0.04]"
              : reject
                ? "border-danger bg-danger-bg"
                : "border-border hover:border-muted-fg/40 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          }
          ${disabled ? "opacity-40 cursor-not-allowed" : ""}
        `}
      >
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-150 ${
            active
              ? "bg-primary text-primary-fg"
              : reject
                ? "bg-danger-bg text-danger"
                : "bg-muted text-muted-fg"
          }`}
        >
          {reject ? (
            <AlertCircle size={26} strokeWidth={1.5} />
          ) : (
            <Upload size={26} strokeWidth={1.5} />
          )}
       </div>

        <div className="max-w-sm">
          {active ? (
            <p className="font-display text-[1.125rem] font-bold text-primary tracking-tight">
              Drop to upload
           </p>
          ) : reject ? (
            <div>
              <p className="font-display text-[1.125rem] font-bold text-danger tracking-tight">
                Unsupported file type
             </p>
              <p className="text-[0.875rem] text-muted-fg mt-1">
                Only JPG, PNG, or WebP images are accepted.
             </p>
           </div>
          ) : (
            <div>
              <p className="font-display text-[1.125rem] font-bold text-foreground tracking-tight">
                Drop form photos here
             </p>
              <p className="text-[0.875rem] text-muted-fg mt-1">
                or click to browse files
             </p>
           </div>
          )}
       </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleBrowse();
          }}
          disabled={disabled}
          className="px-5 h-10 rounded-lg bg-primary text-primary-fg text-[0.875rem] font-semibold
                     hover:bg-primary-hover active:translate-y-px transition-all duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Browse files
       </button>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.75rem] text-muted-fg font-mono">
          <span className="flex items-center gap-1">
            <ImageIcon size={12} strokeWidth={1.75} /> JPG
         </span>
          <span className="flex items-center gap-1">
            <ImageIcon size={12} strokeWidth={1.75} /> PNG
         </span>
          <span className="flex items-center gap-1">
            <ImageIcon size={12} strokeWidth={1.75} /> WebP
         </span>
          <span className="opacity-40">·</span>
          <span>Max 10MB per file</span>
          <span className="opacity-40">·</span>
          <span>Up to 100 files</span>
       </div>
     </div>
   </div>
  );
}
