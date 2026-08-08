"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/lib/toast";

import SchoolManager from "@/components/SchoolManager";
import UploadZone from "@/components/UploadZone";
import ProcessingQueue from "@/components/ProcessingQueue";
import DataTable from "@/components/DataTable";
import Toolbar from "@/components/Toolbar";
import StatusBar from "@/components/StatusBar";
import { useStudentStore } from "@/store/useStudentStore";
import { optimizeImage } from "@/lib/image";
import { waitForSlot, recordRequest, handleRateLimited } from "@/lib/rate-limits";
import type { QueueItem, Student } from "@/types";

export default function HomePage() {
  const {
    schoolId,
    className,
    sectionName,
    academicYear,
    students,
    queue,
    isProcessing,
    setStudents,
    addToQueue,
    updateQueueItem,
    addStudent,
    setIsProcessing,
  } = useStudentStore();

  const [showUpload, setShowUpload] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  // Auto-collapse upload zone if we have a lot of students
  useEffect(() => {
    if (students.length > 5 && !isProcessing) {
      setShowUpload(false);
    }
  }, [students.length, isProcessing]);

  // Load students when context changes
  useEffect(() => {
    if (!schoolId) return;

    async function loadStudents() {
      async function fetchWithRetry(url: string, retries = 3, delay = 500): Promise<Response> {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            const res = await fetch(url);
            if (res.ok) return res;
            // Don't retry on 4xx client errors
            if (res.status >= 400 && res.status < 500) throw new Error(`Server returned ${res.status}`);
          } catch (err: any) {
            console.warn(`[students] Attempt ${attempt} failed: ${err.message}`);
            if (attempt === retries) throw err;
          }
          await new Promise((r) => setTimeout(r, delay)); // exponential delay: 500ms → 1s → 2s
          delay *= 2;
        }
        throw new Error("Failed after ${retries} retries");
      }

      try {
        const query = new URLSearchParams({
        schoolId,
        ...(className && { className }),
        ...(sectionName && { sectionName }),
        ...(academicYear && { academicYear }),
      });

      const res = await fetchWithRetry(`/api/students?${query.toString()}`);
      const data = await res.json();
      // Convert to local state format
        const localStudents = (data.students || []).map((s: any) => ({
          id: s.id,
          admissionNo: s.admissionNo,
          studentName: s.studentName,
          fatherName: s.fatherName,
          motherName: s.motherName,
          dob: s.dob,
          classSection: `${s.className}-${s.sectionName}`,
          mobileNumber: s.mobileNumber,
          address: s.address,
          confidence: {
            admissionNo: "high",
            studentName: "high",
            fatherName: "high",
            motherName: "high",
            dob: "high",
            classSection: "high",
            mobileNumber: "high",
            address: "high",
          }, // we assume saved data is high confidence
          needsReview: s.admissionNo === "UNCLEAR" || s.studentName === "UNCLEAR",
          createdAt: s.createdAt,
        }));

        setStudents(localStudents);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load existing student records.");
      }
    }

    loadStudents();
  }, [schoolId, className, sectionName, academicYear, setStudents]);

  // ── File Selection & Real Processing ── //
  const handleFilesSelected = useCallback(
    (files: File[]) => {
      if (!schoolId || !className || !sectionName) {
        toast.error("Please select a school, class, and section first.");
        return;
      }

      setShowUpload(true);

      // Initialize queue items
      const newItems: QueueItem[] = files.map((file) => ({
        id: uuidv4(),
        fileName: file.name,
        status: "pending" as const,
      }));

      addToQueue(newItems);

      // Keep a reference to the actual files to process
      const filesToProcess = files.map((file, i) => ({
        file,
        queueId: newItems[i].id
      }));

      processFiles(filesToProcess);
      toast.info(`Processing ${files.length} form photo${files.length !== 1 ? "s" : ""}...`);
    },
    [schoolId, className, sectionName, addToQueue]
  );

  // ── Actual API call processing with queue ── //
  const processFiles = useCallback(
    (itemsToProcess: { file: File; queueId: string }[]) => {
      setIsProcessing(true);
      let index = 0;

      // Process ONE at a time — free tier rate limit is very low (~5 RPM)
      const BATCH_SIZE = 1;

      const processNextBatch = async () => {
        if (index >= itemsToProcess.length) {
          setIsProcessing(false);
          toast.success("Extraction batch complete!", { duration: 4000 });
          if (itemsToProcess.length > 0) {
            setTimeout(() => {
              tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 500);
          }
          return;
        }

        // Wait for rate-limit slot before proceeding
        await waitForSlot();

        const batch = itemsToProcess.slice(index, index + BATCH_SIZE);
        index += BATCH_SIZE;

        // Process current batch concurrently
        await Promise.all(
          batch.map(async ({ file, queueId }) => {
            updateQueueItem(queueId, { status: "processing" });

            try {
              // 1. Optimize image client-side (resize + compress to base64)
              const { base64, thumbnail } = await optimizeImage(file);
              updateQueueItem(queueId, { thumbnail });

              // 2. Wait again right before the API call (batch members may race)
              await waitForSlot();

              // 3. Send to API for Gemini extraction
              const res = await fetch("/api/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64: base64 }),
              });

              // Handle rate-limiting (429) from the API
              if (res.status === 429) {
                // Read Retry-After header first (authoritative), fallback to body
                const headerRetry = res.headers.get("Retry-After");
                const errorData = await res.json().catch(() => ({}));
                const retryAfter = headerRetry
                  ? parseInt(headerRetry, 10)
                  : (errorData.retryAfter || 60);
                handleRateLimited(retryAfter);
                throw new Error(`Rate limited — will retry after ${retryAfter}s`);
              }

              const extractData = await res.json();

              if (!res.ok || !extractData.success) {
                throw new Error(extractData.error || "Failed to extract data");
              }

              // Record successful API call
              recordRequest();

              // data.data is now an array of students (one per form in the image)
              const extractedStudents = Array.isArray(extractData.data)
                ? extractData.data
                : [extractData.data]; // backward compat for single-object responses

              // 4. Save each extracted student to Database (one image can have multiple forms)
              for (const studentData of extractedStudents) {
                const dbRes = await fetch("/api/students", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    schoolId,
                    className: studentData.className,
                    sectionName: studentData.sectionName,
                    academicYear,
                    admissionNo: studentData.admissionNo,
                    studentName: studentData.studentName,
                    fatherName: studentData.fatherName,
                    motherName: studentData.motherName,
                    dob: studentData.dob,
                    mobileNumber: studentData.mobileNumber,
                    address: studentData.address,
                  }),
                });

                const dbData = await dbRes.json();
                if (!dbRes.ok) {
                  console.error("Failed to save student to DB:", dbData.error);
                  continue;
                }

                // 5. Update UI state for each saved student
                const confidence = studentData.confidence || {};
                const needsReview =
                  Object.values(confidence).some((c: any) => c === "low") ||
                  Object.values(studentData).some((v: any) => v === "UNCLEAR");

                const student: Student = {
                  id: dbData.student.id,
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
                  createdAt: dbData.student.createdAt,
                };

                addStudent(student);
              }

              updateQueueItem(queueId, {
                status: "done",
                result: `${extractedStudents.length} extracted`,
              } as any);

            } catch (err: any) {
              updateQueueItem(queueId, {
                status: "error",
                error: err.message || "Failed to process form",
              });
            }
          })
        );

        // Small delay between items to avoid rate limits
        if (index < itemsToProcess.length) {
          await new Promise((r) => setTimeout(r, 2000));
        }

        processNextBatch();
      };

      processNextBatch();
    },
    [schoolId, className, sectionName, academicYear, addStudent, updateQueueItem, setIsProcessing]
  );

  const handleRemove = useCallback(
    (id: string) => {
      useStudentStore.setState((s) => ({
        queue: s.queue.filter((q) => q.id !== id),
      }));
    },
    []
  );

  const hasStudents = students.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 space-y-8">
      {/* ── Top Section: Upload & Queue ── */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 mb-6">
          {!hasStudents && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/[0.08] text-primary text-sm font-medium">
              <Sparkles size={15} />
              AI-powered handwriting reading
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {hasStudents ? "School ID Data" : "Handwritten Forms → Excel"}
          </h1>
          {!hasStudents && (
            <p className="text-muted-fg text-lg max-w-xl mx-auto leading-relaxed">
              Upload photos of student enrollment forms. AI reads the handwriting
              so you can review and export to Excel in minutes.
            </p>
          )}
        </div>

        {/* Context Selector */}
        <SchoolManager />

        {/* Collapsible Upload Section */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="w-full px-5 py-4 flex items-center justify-between bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground">
                Upload Forms
              </span>
              {isProcessing && (
                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium animate-pulse">
                  Processing...
                </span>
              )}
            </div>
            {showUpload ? (
              <ChevronUp size={20} className="text-muted-fg" />
            ) : (
              <ChevronDown size={20} className="text-muted-fg" />
            )}
          </button>

          {showUpload && (
            <div className="p-5 sm:p-8 border-t border-border space-y-8 bg-background">
              <UploadZone
                onFilesSelected={handleFilesSelected}
                disabled={isProcessing || !schoolId || !className || !sectionName}
              />

              {queue.length > 0 && (
                <ProcessingQueue
                  queue={queue}
                  onRemove={handleRemove}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Section: Data Table ── */}
      {hasStudents && (
        <div ref={tableRef} className="space-y-4 pt-4 scroll-mt-20">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Review &amp; Edit
              </h2>
              <p className="text-sm text-muted-fg mt-1">
                Click any cell to edit. Edits save to the database automatically.
              </p>
            </div>
            <StatusBar />
          </div>

          <Toolbar />
          <DataTable />
        </div>
      )}
    </div>
  );
}