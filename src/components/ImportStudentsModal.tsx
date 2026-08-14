"use client";

import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { Loader2, UploadCloud, FileSpreadsheet, Check, AlertTriangle, X, ArrowRight } from "lucide-react";
import { toast } from "@/lib/toast";

interface School {
  id: string;
  name: string;
  code?: string;
  officialId?: string;
}

// The fields we support importing. Keys map to import API body.
const FIELD_KEYS = [
  "admissionNo",
  "studentName",
  "fatherName",
  "motherName",
  "dob",
  "mobileNumber",
  "address",
] as const;

const FIELD_LABELS: Record<string, string> = {
  admissionNo: "Admission No",
  studentName: "Student Name",
  fatherName: "Father's Name",
  motherName: "Mother's Name",
  dob: "Date of Birth",
  mobileNumber: "Mobile",
  address: "Address",
};

// Header heuristics: lowercased substring → field key
const HEADER_HINTS: { contains: string; key: string }[] = [
  { contains: "admission", key: "admissionNo" },
  { contains: "admno", key: "admissionNo" },
  { contains: "adm no", key: "admissionNo" },
  { contains: "roll", key: "admissionNo" },
  { contains: "name", key: "studentName" }, // broad fallback, refined below
  { contains: "father", key: "fatherName" },
  { contains: "dad", key: "fatherName" },
  { contains: "mother", key: "motherName" },
  { contains: "mom", key: "motherName" },
  { contains: "parent", key: "fatherName" },
  { contains: "dob", key: "dob" },
  { contains: "birth", key: "dob" },
  { contains: "mobile", key: "mobileNumber" },
  { contains: "phone", key: "mobileNumber" },
  { contains: "contact", key: "mobileNumber" },
  { contains: "address", key: "address" },
];

type RowData = Record<string, string>;

interface ImportStudentsModalProps {
  open: boolean;
  onClose: () => void;
  schools: School[];
  defaultSchoolId?: string;
  onImported: () => void;
}

export default function ImportStudentsModal({
  open,
  onClose,
  schools,
  defaultSchoolId,
  onImported,
}: ImportStudentsModalProps) {
  const [step, setStep] = useState<"pick" | "map" | "commit" | "done">("pick");
  const [fileName, setFileName] = useState("");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RowData[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // mapping: rawHeader → fieldKey | ""
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const [schoolId, setSchoolId] = useState(defaultSchoolId || "");
  const [className, setClassName] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    inserted: number;
    skipped: number;
    skippedRows: Array<{ row: number; admissionNo: string; name: string; reason: string }>;
    totalProcessed: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep("pick");
    setFileName("");
    setRawHeaders([]);
    setRawRows([]);
    setMapping({});
    setParseError(null);
    setSchoolId(defaultSchoolId || "");
    setClassName("");
    setSectionName("");
    setAcademicYear("");
    setImporting(false);
    setResult(null);
  }, [defaultSchoolId]);

  // Early return AFTER all hooks above (reset/useRef/useCallback must all run every render).
  // The remaining useCallback hooks are declared before this return below.
  // NOTE: keep this return statement positioned AFTER every hook in the component.
  const handleFile = useCallback(async (file: File) => {
    setParsing(true);
    setParseError(null);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) throw new Error("Sheet is empty.");

      // header:1 → array of arrays; first row = headers
      const aoa = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "", blankrows: false });
      if (aoa.length < 2) throw new Error("No data rows found (need a header row + at least one data row).");

      const headers = (aoa[0] as any[]).map((h) => String(h ?? "").trim());
      const rows: RowData[] = [];
      for (let r = 1; r < aoa.length; r++) {
        const arr = aoa[r] as any[];
        // skip fully empty rows
        if (!arr || arr.every((c) => c === "" || c == null)) continue;
        const obj: RowData = {};
        headers.forEach((h, i) => {
          const val = arr[i];
          obj[h] = val == null ? "" : String(val).trim();
        });
        rows.push(obj);
      }

      setRawHeaders(headers);
      setRawRows(rows);

      // Auto-map headers
      const autoMapping: Record<string, string> = {};
      const usedKeys = new Set<string>();
      for (const h of headers) {
        const lower = h.toLowerCase();
        let matched = "";
        for (const hint of HEADER_HINTS) {
          if (matched) break;
          if (lower.includes(hint.contains)) {
            // "name" should not gobble "father/mother" — those have earlier hints.
            // Also avoid double-assigned keys for non-name fields.
            if (hint.key === "studentName") {
              // only assign studentName to a header that is exactly "name" or "student name"/"student_name"
              if (lower === "name" || lower.includes("student") || lower === "full name" || lower.includes("pupil")) {
                matched = hint.key;
              }
            } else if (!usedKeys.has(hint.key)) {
              matched = hint.key;
            }
          }
        }
        if (matched) {
          autoMapping[h] = matched;
          usedKeys.add(matched);
        } else {
          autoMapping[h] = "";
        }
      }
      setMapping(autoMapping);
      setStep("map");
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || "Failed to parse file.");
    } finally {
      setParsing(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const previewRows = rawRows.slice(0, 5);

  // Build the mapped students array for commit
  const buildStudents = useCallback((): RowData[] => {
    return rawRows.map((row) => {
      const obj: RowData = {};
      for (const field of FIELD_KEYS) {
        // find which raw header maps to this field
        const headerForField = Object.entries(mapping).find(([, k]) => k === field)?.[0];
        obj[field] = headerForField ? row[headerForField] || "" : "";
      }
      return obj;
    });
  }, [rawRows, mapping]);

  const mappedStudentNameHeader = Object.entries(mapping).find(([, k]) => k === "studentName")?.[0];
  const canCommit =
    !!schoolId &&
    !!className.trim() &&
    !!sectionName.trim() &&
    !!academicYear.trim() &&
    !!mappedStudentNameHeader;

  const handleCommit = async () => {
    if (!canCommit) return;
    setImporting(true);
    setResult(null);
    setStep("commit");
    try {
      const students = buildStudents();
      const res = await fetch("/api/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          className: className.trim(),
          sectionName: sectionName.trim(),
          academicYear: academicYear.trim(),
          students,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult({
        inserted: data.inserted ?? 0,
        skipped: data.skipped ?? 0,
        skippedRows: data.skippedRows ?? [],
        totalProcessed: data.totalProcessed ?? students.length,
      });
      setStep("done");
      onImported();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Import failed");
      setStep("map");
    } finally {
      setImporting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-2xl rounded-2xl border border-border overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-display text-[1.25rem] font-bold text-foreground tracking-tight">
              Import students
          </h3>
            <p className="text-[0.8125rem] text-muted-fg mt-0.5">
              {step === "pick" && "Drop an Excel or CSV file with student details."}
              {step === "map" && "Match your columns, pick context, then import."}
              {step === "commit" && "Importing…"}
              {step === "done" && "Done."}
        </p>
      </div>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="p-1.5 text-muted-fg hover:text-foreground rounded-md hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X size={16} strokeWidth={1.75} />
      </button>
    </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto thin-scrollbar">
          {/* STEP: pick */}
          {step === "pick" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed transition-colors px-6 py-12 text-center
                ${dragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {parsing ? (
                <div className="flex flex-col items-center gap-3 text-muted-fg">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-[0.875rem]">Parsing {fileName}…</span>
            </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-fg">
                    <UploadCloud size={22} strokeWidth={1.5} />
              </div>
                  <div className="text-[0.9375rem] font-medium text-foreground">
                    Drop .xlsx / .xls / .csv here, or click to browse
              </div>
                  <div className="text-[0.8125rem] text-muted-fg">
                    First row must be a header. Max a few thousand rows.
              </div>
                  {parseError && (
                    <div className="mt-2 flex items-center gap-2 text-danger text-[0.8125rem]">
                      <AlertTriangle size={14} /> {parseError}
                </div>
                  )}
            </div>
              )}
            </div>
          )}

          {/* STEP: map */}
          {step === "map" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[0.875rem] text-muted-fg">
                <FileSpreadsheet size={15} strokeWidth={1.5} />
                <span className="font-medium text-foreground">{fileName}</span>
                <ArrowRight size={13} />
                <span>{rawRows.length} rows</span>
              </div>

              {/* Column mapping */}
              <div>
                <div className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-fg mb-2">
                  Map columns
            </div>
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="grid grid-cols-2 bg-muted/50 text-[0.75rem] font-medium text-muted-fg px-4 py-2">
                    <div>From your file</div>
                    <div>Becomes</div>
              </div>
                  {rawHeaders.map((h) => (
                    <div key={h} className="grid grid-cols-2 items-center px-4 py-2 border-t border-border first:border-t-0">
                      <div className="text-[0.875rem] font-mono text-foreground truncate">{h}</div>
                      <select
                        value={mapping[h] || ""}
                        onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value }))}
                        className="h-9 px-2 rounded-lg border border-border bg-background text-[0.8125rem] text-foreground
                                   focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                      >
                        <option value="">— ignore —</option>
                        {FIELD_KEYS.map((k) => (
                          <option key={k} value={k}>
                            {FIELD_LABELS[k]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Context selectors */}
              <div>
                <div className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-fg mb-2">
                  Import into
            </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="block text-[0.8125rem] font-medium text-foreground">School</label>
                    <select
                      value={schoolId}
                      onChange={(e) => setSchoolId(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border border-border bg-background text-[0.9375rem] text-foreground
                                 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                    >
                      <option value="">Select school…</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
              </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="block text-[0.8125rem] font-medium text-foreground">Class</label>
                      <input
                        type="text"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        placeholder="V"
                        className="w-full h-11 px-3 rounded-lg border border-border bg-background text-[0.9375rem] text-foreground font-mono
                                   focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                      />
                </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="block text-[0.8125rem] font-medium text-foreground">Section</label>
                      <input
                        type="text"
                        value={sectionName}
                        onChange={(e) => setSectionName(e.target.value)}
                        placeholder="B"
                        className="w-full h-11 px-3 rounded-lg border border-border bg-background text-[0.9375rem] text-foreground font-mono
                                   focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                      />
                </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-2">
                      <label className="block text-[0.8125rem] font-medium text-foreground">Academic year</label>
                      <input
                        type="text"
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        placeholder="2026-2027"
                        className="w-full h-11 px-3 rounded-lg border border-border bg-background text-[0.9375rem] text-foreground font-mono
                                   focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                      />
                </div>
            </div>
              </div>

              {/* Preview */}
              <div>
                <div className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-fg mb-2">
                  Preview ({mappedStudentNameHeader ? "first 5 rows" : "no name column mapped"})
            </div>
                <div className="rounded-xl border border-border overflow-x-auto">
                  <table className="w-full text-[0.8125rem]">
                    <thead className="bg-muted/50 text-muted-fg">
                      <tr>
                        {FIELD_KEYS.filter((k) => Object.values(mapping).includes(k)).map((k) => (
                          <th key={k} className="text-left font-medium px-3 py-2 whitespace-nowrap">
                            {FIELD_LABELS[k]}
                      </th>
                        ))}
                  </tr>
                </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i} className="border-t border-border">
                          {FIELD_KEYS.filter((k) => Object.values(mapping).includes(k)).map((k) => {
                            const headerForField = Object.entries(mapping).find(([, mk]) => mk === k)?.[0];
                            return (
                              <td key={k} className="px-3 py-2 align-top text-foreground">
                                {headerForField ? row[headerForField] : ""}
                              </td>
                            );
                          })}
                    </tr>
                      ))}
                </tbody>
              </table>
            </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("pick")}
                  className="h-10 px-4 text-[0.875rem] font-medium rounded-lg hover:bg-muted text-foreground transition-colors"
                >
                  Back
            </button>
                <button
                  onClick={handleCommit}
                  disabled={!canCommit || importing}
                  className="flex items-center gap-1.5 h-10 px-4 text-[0.875rem] font-semibold rounded-lg bg-primary text-primary-fg
                             hover:bg-primary-hover active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {importing ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
                  Import {rawRows.length} students
            </button>
          </div>
        </div>
      )}

          {/* STEP: commit */}
          {step === "commit" && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-fg">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-[0.9375rem]">Importing students…</span>
        </div>
      )}

          {/* STEP: done */}
          {step === "done" && result && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-5">
                <div className="mt-0.5 w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Check size={18} strokeWidth={2} />
            </div>
                <div>
                  <div className="text-[0.9375rem] font-semibold text-foreground">
                    Import complete
              </div>
                  <div className="text-[0.875rem] text-muted-fg mt-1">
                    {result.inserted} student{result.inserted !== 1 ? "s" : ""} added to{" "}
                    <span className="font-medium text-foreground">
                      {schools.find((s) => s.id === schoolId)?.name} — Class {className} / {sectionName}
                    </span>
                    .
              </div>
                </div>
          </div>

              {result.skipped > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-[0.8125rem] font-medium text-[#b45309] mb-2">
                    <AlertTriangle size={14} /> {result.skipped} skipped
              </div>
                  <div className="rounded-xl border border-border overflow-hidden max-h-48 overflow-y-auto thin-scrollbar">
                    <table className="w-full text-[0.8125rem]">
                      <thead className="bg-muted/50 text-muted-fg sticky top-0">
                        <tr>
                          <th className="text-left font-medium px-3 py-2">Row</th>
                          <th className="text-left font-medium px-3 py-2">Adm No</th>
                          <th className="text-left font-medium px-3 py-2">Name</th>
                          <th className="text-left font-medium px-3 py-2">Reason</th>
                    </tr>
                  </thead>
                      <tbody>
                        {result.skippedRows.map((r, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-3 py-1.5 font-mono text-muted-fg">{r.row}</td>
                            <td className="px-3 py-1.5 font-mono text-foreground">{r.admissionNo || "—"}</td>
                            <td className="px-3 py-1.5 text-foreground">{r.name || "—"}</td>
                            <td className="px-3 py-1.5 text-muted-fg">{r.reason}</td>
                      </tr>
                        ))}
                </tbody>
              </table>
            </div>
          </div>
      )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    reset();
                    onClose();
                  }}
                  className="h-10 px-4 text-[0.875rem] font-semibold rounded-lg bg-primary text-primary-fg
                             hover:bg-primary-hover active:translate-y-px transition-all"
                >
                  Done
            </button>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
