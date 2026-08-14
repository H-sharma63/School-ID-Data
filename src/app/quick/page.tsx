"use client";

import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Download, Trash2, Loader2, Zap } from "lucide-react";
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
  const [batchName, setBatchName] = useState("Quick_Export");

  const tableRef = useRef<HTMLDivElement>(null);

  const handleFilesSelected = useCallback(
    (files: File[]) => {
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
      toast.info(`Processing ${files.length} form photo${files.length !== 1 ? "s" : ""}`);
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
          toast.success("Extraction complete");
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

              for (const studentData of extractedStudents) {
                const confidence = studentData.confidence || {};
                const needsReview =
                  Object.values(confidence).some((c: any) => c === "low") ||
                  Object.values(studentData).some((v: any) => v === "UNCLEAR");

                const student: Student = {
                  id: uuidv4(),
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
          schoolId: "quick-export",
          className: "",
          sectionName: "",
          academicYear: "",
          format,
          fileName: batchName,
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

      toast.success(`Downloaded ${format.toUpperCase()}`);
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
    if (window.confirm("Clear all extracted data?")) {
      setStudents([]);
      setQueue([]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 sm:py-14 space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-warning">
          <Zap size={14} strokeWidth={1.75} />
          <span className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.08em]">
            Quick export · not saved
         </span>
       </div>
        <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold tracking-tight text-foreground">
          Extract and download
       </h1>
        <p className="text-[0.9375rem] text-muted-fg max-w-xl leading-relaxed">
          Upload forms, review, and download Excel instantly. Data is held in your browser and never saved to a database.
       </p>
     </header>

      <section className="bg-card border border-border rounded-2xl p-6">
        <UploadZone
          onFilesSelected={handleFilesSelected}
          disabled={isProcessing}
        />
        {queue.length > 0 && (
          <div className="mt-6">
            <ProcessingQueue
              queue={queue}
              onRemove={handleRemoveQueueItem}
            />
         </div>
        )}
     </section>

      {students.length > 0 && (
        <section ref={tableRef} className="space-y-4 pt-2 scroll-mt-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-[1.375rem] font-bold tracking-tight text-foreground">
                Review data
             </h2>
              <p className="text-[0.875rem] text-muted-fg mt-1">
                Data is only stored in your browser temporarily.
             </p>
           </div>

            <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-card border border-border">
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="File name"
                className="h-8 px-3 text-[0.8125rem] rounded-lg border border-border bg-background font-mono w-[10rem]"
              />
              <button
                onClick={() => handleExport("xlsx")}
                disabled={isExporting}
                className="flex items-center gap-1.5 h-8 px-3.5 text-[0.8125rem] font-semibold rounded-lg
                           bg-primary text-primary-fg hover:bg-primary-hover
                           active:translate-y-px transition-all disabled:opacity-50"
              >
                {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} strokeWidth={1.75} />}
                <span>Excel</span>
             </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 h-8 px-3 text-[0.8125rem] font-medium rounded-lg
                           text-danger hover:bg-danger-bg transition-colors ml-1"
              >
                <Trash2 size={13} strokeWidth={1.75} />
                <span>Clear</span>
             </button>
           </div>
         </div>

          <div className="border border-border rounded-2xl overflow-hidden bg-card">
            <div className="overflow-x-auto thin-scrollbar">
              <div className="overflow-y-auto max-h-[60vh] thin-scrollbar sticky-header">
                <table className="w-full min-w-[1000px] border-collapse">
                  <thead>
                    <tr>
                      <th className="w-10 px-3 py-3"></th>
                      <th className="w-10 px-3 py-3 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-fg">#</th>
                      {FIELD_ORDER.map((field) => (
                        <th key={field} className="px-3 py-3 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-fg">
                          {FIELD_LABELS[field]}
                       </th>
                      ))}
                   </tr>
                 </thead>
                  <tbody className="divide-y divide-border">
                    {students.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-muted/30">
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-fg hover:text-danger hover:bg-danger-bg transition-colors"
                            title="Remove row"
                            aria-label="Remove row"
                          >
                            <Trash2 size={13} strokeWidth={1.75} />
                         </button>
                       </td>
                        <td className="px-3 py-2 text-[0.8125rem] text-muted-fg font-mono tabular-nums">
                          {idx + 1}
                       </td>
                        {FIELD_ORDER.map((field) => (
                          <td key={field} className="px-1 py-1.5">
                            <EditableCell
                              value={String(student[field] ?? "")}
                              confidence={(student.confidence as any)[field]}
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
       </section>
      )}
   </div>
  );
}
