"use client";

import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Sparkles, Download, Trash2, Loader2, Play } from "lucide-react";
import { toast } from "@/lib/toast";

import UploadZone from "@/components/UploadZone";
import ProcessingQueue from "@/components/ProcessingQueue";
import { optimizeImage } from "@/lib/image";
import { waitForSlot, recordRequest, handleRateLimited } from "@/lib/rate-limits";
import type { QueueItem, Student } from "@/types";
import EditableCell from "@/components/EditableCell";
import { FIELD_ORDER, FIELD_LABELS, type StudentField } from "@/types";

export default function QuickExportPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Custom batch name for export
  const [batchName, setBatchName] = useState("Quick_Export");

  const tableRef = useRef<HTMLDivElement>(null);

  // ── File Selection & Real Processing ── //
  const handleFilesSelected = useCallback(
    (files: File[]) => {
      // Initialize queue items
      const newItems: QueueItem[] = files.map((file) => ({
        id: uuidv4(),
        fileName: file.name,
        status: "pending" as const,
      }));

      setQueue((prev) => [...prev, ...newItems]);

      const filesToProcess = files.map((file, i) => ({
        file,
        queueId: newItems[i].id
      }));

      processFiles(filesToProcess);
      toast.info(`Processing ${files.length} form photo${files.length !== 1 ? "s" : ""}...`);
    },
    []
  );

  const processFiles = useCallback(
    (itemsToProcess: { file: File; queueId: string }[]) => {
      setIsProcessing(true);
      let index = 0;
      const BATCH_SIZE = 1;

      const processNextBatch = async () => {
        if (index >= itemsToProcess.length) {
          setIsProcessing(false);
          toast.success("Extraction complete!", { duration: 4000 });
          if (itemsToProcess.length > 0) {
            setTimeout(() => {
              tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 500);
          }
          return;
        }

        await waitForSlot();

        const batch = itemsToProcess.slice(index, index + BATCH_SIZE);
        index += BATCH_SIZE;

        await Promise.all(
          batch.map(async ({ file, queueId }) => {
            setQueue(q => q.map(item => item.id === queueId ? { ...item, status: "processing" } : item));

            try {
              const { base64, thumbnail } = await optimizeImage(file);
              setQueue(q => q.map(item => item.id === queueId ? { ...item, thumbnail } : item));

              await waitForSlot();

              const res = await fetch("/api/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64: base64 }),
              });

              if (res.status === 429) {
                const headerRetry = res.headers.get("Retry-After");
                const errorData = await res.json().catch(() => ({}));
                const retryAfter = headerRetry ? parseInt(headerRetry, 10) : (errorData.retryAfter || 60);
                handleRateLimited(retryAfter);
                throw new Error(`Rate limited — will retry after ${retryAfter}s`);
              }

              const extractData = await res.json();

              if (!res.ok || !extractData.success) {
                throw new Error(extractData.error || "Failed to extract data");
              }

              recordRequest();

              const extractedStudents = Array.isArray(extractData.data)
                ? extractData.data
                : [extractData.data];

              // Add to local state (NO DATABASE)
              for (const studentData of extractedStudents) {
                const confidence = studentData.confidence || {};
                const needsReview =
                  Object.values(confidence).some((c: any) => c === "low") ||
                  Object.values(studentData).some((v: any) => v === "UNCLEAR");

                const student: Student = {
                  id: uuidv4(), // Generate local ID
                  admissionNo: studentData.admissionNo,
                  studentName: studentData.studentName,
                  fatherName: studentData.fatherName,
                  motherName: studentData.motherName,
                  dob: studentData.dob,
                  classSection: `${studentData.className}-${studentData.sectionName}`,
                  mobileNumber: studentData.mobileNumber,
                  address: studentData.address,
                  confidence: {
                    admissionNo: confidence.admissionNo || "high",
                    studentName: confidence.studentName || "high",
                    fatherName: confidence.fatherName || "high",
                    motherName: confidence.motherName || "high",
                    dob: confidence.dob || "high",
                    classSection: confidence.classSection || "high",
                    mobileNumber: confidence.mobileNumber || "high",
                    address: confidence.address || "high",
                  },
                  needsReview,
                  createdAt: new Date().toISOString(),
                };

                setStudents((prev) => [...prev, student]);
              }

              setQueue(q => q.map(item => item.id === queueId ? {
                ...item,
                status: "done",
                result: `${extractedStudents.length} extracted` as any
              } : item));

            } catch (err: any) {
              setQueue(q => q.map(item => item.id === queueId ? {
                ...item,
                status: "error",
                error: err.message || "Failed to process form"
              } : item));
            }
          })
        );

        if (index < itemsToProcess.length) {
          await new Promise((r) => setTimeout(r, 2000));
        }

        processNextBatch();
      };

      processNextBatch();
    },
    []
  );

  const handleRemoveQueueItem = useCallback((id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const handleCellChange = (id: string, field: StudentField, newVal: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== id) return s;
      return { ...s, [field]: newVal };
    }));
  };

  const handleExport = async (format: "xlsx" | "csv") => {
    if (students.length === 0) {
      toast.error("No data to export");
      return;
    }

    setIsExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Send empty strings for school context since we don't have it
          schoolId: "quick-export",
          className: "",
          sectionName: "",
          academicYear: "",
          format,
          fileName: batchName,
          // Pass the actual students directly to the export endpoint
          students: students.map(({ id, confidence, needsReview, createdAt, ...rest }) => rest)
        }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${batchName}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const clearAll = () => {
    if (window.confirm("Are you sure? This will clear all extracted data.")) {
      setStudents([]);
      setQueue([]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium">
          <Play size={15} />
          Quick Export Mode (No Database)
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Extract & Download
        </h1>
        <p className="text-muted-fg text-lg max-w-xl mx-auto leading-relaxed">
          Upload forms, review, and download Excel instantly.
          Data is never saved to the database.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="p-5 sm:p-8 border border-border rounded-2xl bg-card shadow-sm space-y-8">
          <UploadZone
            onFilesSelected={handleFilesSelected}
            disabled={isProcessing}
          />

          {queue.length > 0 && (
            <ProcessingQueue
              queue={queue}
              onRemove={handleRemoveQueueItem}
            />
          )}
        </div>
      </div>

      {/* Review Table */}
      {students.length > 0 && (
        <div ref={tableRef} className="space-y-4 pt-4 scroll-mt-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Review Data
              </h2>
              <p className="text-sm text-muted-fg mt-1">
                Data is only stored in your browser temporarily.
              </p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 bg-surface p-2 rounded-xl border border-border">
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="File name"
                className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background max-w-[150px]"
              />
              <button
                onClick={() => handleExport("xlsx")}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold
                           bg-primary text-primary-fg hover:bg-primary-hover
                           transition-all shadow-sm disabled:opacity-50"
              >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                <span>Export XLSX</span>
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                           text-danger hover:bg-danger-bg transition-all ml-1"
              >
                <Trash2 size={16} />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Simple Table */}
          <div className="border border-border rounded-2xl overflow-hidden shadow-sm bg-card">
            <div className="overflow-x-auto thin-scrollbar">
              <div className="overflow-y-auto max-h-[60vh] thin-scrollbar sticky-header">
                <table className="w-full min-w-[1000px] border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="w-10 px-3 py-3"></th>
                      <th className="w-10 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-fg">#</th>
                      {FIELD_ORDER.map((field) => (
                        <th key={field} className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
                          {FIELD_LABELS[field]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-muted-fg hover:text-danger p-1 rounded hover:bg-danger-bg"
                            title="Remove row"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                        <td className="px-3 py-2 text-sm text-muted-fg font-mono tabular-nums">
                          {idx + 1}
                        </td>
                        {FIELD_ORDER.map((field) => (
                          <td key={field} className="px-1 py-1.5">
                            <EditableCell
                              value={String(student[field] ?? "")}
                              confidence={student.confidence[field]}
                              onChange={(newVal) => handleCellChange(student.id, field, newVal)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}