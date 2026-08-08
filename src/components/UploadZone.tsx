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
    <div className="w-full max-w-2xl mx-auto">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={0}
        aria-label="Drop form photos here or click Browse Files"
        className={`
          relative border-[3px] border-dashed rounded-2xl p-10 sm:p-16
          flex flex-col items-center justify-center gap-5
          cursor-pointer transition-all duration-300 select-none
          outline-none
          ${
            active
              ? "border-primary bg-primary/[0.06] scale-[1.01] shadow-lg shadow-primary/[0.1]"
              : reject
                ? "border-danger bg-danger-bg"
                : "border-border hover:border-muted-fg hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring"
          }
          ${disabled ? "opacity-40 cursor-not-allowed" : ""}
        `}
      >
        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            active
              ? "bg-primary text-primary-fg shadow-lg scale-110"
              : reject
                ? "bg-danger/10 text-danger"
                : "bg-muted text-muted-fg"
          }`}
        >
          {reject ? (
            <AlertCircle size={32} />
          ) : (
            <Upload size={32} strokeWidth={1.5} />
          )}
        </div>

        {/* Text */}
        <div className="text-center max-w-sm">
          {active ? (
            <p className="text-lg font-semibold text-primary">
              Drop your form photos here!
            </p>
          ) : reject ? (
            <div>
              <p className="text-lg font-semibold text-danger">
                Invalid file type
              </p>
              <p className="text-sm text-danger/70 mt-0.5">
                Only JPG, PNG, or WebP images are accepted
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold text-foreground">
                Drag &amp; drop form photos here
              </p>
              <p className="text-sm text-muted-fg mt-1">
                or click Browse Files below
              </p>
            </div>
          )}
        </div>

        {/* Supported formats tag */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-fg bg-muted/50 px-4 py-2 rounded-full">
          <span className="flex items-center gap-1">
            <ImageIcon size={13} /> JPG
          </span>
          <span className="flex items-center gap-1">
            <ImageIcon size={13} /> PNG
          </span>
          <span className="flex items-center gap-1">
            <ImageIcon size={13} /> WebP
          </span>
          <span className="opacity-40 hidden sm:inline">|</span>
          <span className="hidden sm:inline">Max 10MB per file</span>
          <span className="opacity-40 hidden sm:inline">|</span>
          <span className="hidden sm:inline">Up to 100 files</span>
        </div>

        {/* Browse button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleBrowse();
          }}
          disabled={disabled}
          className="mt-1 px-6 py-3 rounded-xl bg-primary text-primary-fg text-sm font-semibold
                     hover:bg-primary-hover active:scale-[0.98] transition-all duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          Browse Files
        </button>
      </div>
    </div>
  );
}