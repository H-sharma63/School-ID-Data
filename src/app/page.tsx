"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { ChevronDown, ChevronUp } from "lucide-react";
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
import { readContextFromUrl, writeContextToUrl } from "@/lib/url-state";
import type { QueueItem, Student } from "@/types";

export default function HomePage() {
  const {
    schoolId,
    schoolName,
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
    setSchoolContext,
    setClassContext,
  } = useStudentStore();

  const [showUpload, setShowUpload] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (students.length > 5 && !isProcessing) {
      setShowUpload(false);
    }
  }, [students.length, isProcessing]);

  // ── URL ↔ store sync ── //
  // 1. On mount: if URL has a school param, validate it exists. If invalid,
  //    strip URL params and stay on landing. Otherwise apply to store.
  //    Also clear stale students/class context when no valid school.
  useEffect(() => {
    const fromUrl = readContextFromUrl();
    const store = useStudentStore.getState();

    // If URL is completely empty but we have a persisted school, redirect to persisted context
    if (!window.location.search && store.schoolId) {
      writeContextToUrl({
        schoolId: store.schoolId,
        className: store.className,
        sectionName: store.sectionName,
        academicYear: store.academicYear,
      });
      // the second useEffect below will pick this up on next render, but
      // we already have the state loaded from persist so we just continue validation.
      fromUrl.schoolId = store.schoolId;
      fromUrl.className = store.className;
      fromUrl.sectionName = store.sectionName;
      fromUrl.academicYear = store.academicYear;
    }

    if (!fromUrl.schoolId) {
      // Still no school in URL (or store) — clear any stale students + class context
      if (store.students.length > 0 || store.className || store.sectionName) {
        useStudentStore.setState({ students: [], queue: [], className: "", sectionName: "" });
      }
      return;
    }

    async function validateAndApply() {
      try {
        const res = await fetch("/api/schools");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const exists = (data.schools || []).some(
          (s: { id: string }) => s.id === fromUrl.schoolId
        );
        if (!exists) {
          // URL has a bogus school id — strip params, clear stale state
          window.history.replaceState(null, "", window.location.pathname);
          useStudentStore.setState({ students: [], queue: [], className: "", sectionName: "" });
          toast.error("That school no longer exists");
          return;
        }
        const store = useStudentStore.getState();
        const needsApply =
          fromUrl.schoolId !== store.schoolId ||
          (fromUrl.className ?? "") !== store.className ||
          (fromUrl.sectionName ?? "") !== store.sectionName ||
          (fromUrl.academicYear ?? "") !== store.academicYear;
        if (needsApply) {
          setSchoolContext(fromUrl.schoolId ?? "", store.schoolName || "");
          setClassContext(
            fromUrl.className ?? "",
            fromUrl.sectionName ?? "",
            fromUrl.academicYear ?? ""
          );
        }
      } catch {
        // Network error — don't block the page, just leave the store as-is.
      }
    }

    validateAndApply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. On context change: write to URL (replaceState, no history entry).
  useEffect(() => {
    writeContextToUrl({ schoolId, className, sectionName, academicYear });
  }, [schoolId, className, sectionName, academicYear]);

  // 3. On browser back/forward: read URL → store. If the URL references a
  //    school that no longer exists, strip the params and stay on landing.
  useEffect(() => {
    const onPop = async () => {
      const fromUrl = readContextFromUrl();
      const store = useStudentStore.getState();

      if (!fromUrl.schoolId) {
        // No school in URL — clear stale data
        useStudentStore.setState({ students: [], queue: [], className: "", sectionName: "" });
        return;
      }

      try {
        const res = await fetch("/api/schools");
        if (res.ok) {
          const data = await res.json();
          const exists = (data.schools || []).some(
            (s: { id: string }) => s.id === fromUrl.schoolId
          );
          if (!exists) {
            window.history.replaceState(null, "", window.location.pathname);
            useStudentStore.setState({ students: [], queue: [], className: "", sectionName: "" });
            toast.error("That school no longer exists");
            return;
          }
        }
      } catch {
        // ignore network errors — leave state as-is
      }

      const changed =
        fromUrl.schoolId !== store.schoolId ||
        (fromUrl.className ?? "") !== store.className ||
        (fromUrl.sectionName ?? "") !== store.sectionName ||
        (fromUrl.academicYear ?? "") !== store.academicYear;
      if (!changed) return;
      setSchoolContext(fromUrl.schoolId ?? "", store.schoolName || "");
      setClassContext(
        fromUrl.className ?? "",
        fromUrl.sectionName ?? "",
        fromUrl.academicYear ?? ""
      );
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!schoolId) return;

    async function loadStudents() {
      async function fetchWithRetry(url: string, retries = 3, delay = 500): Promise<Response> {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            const res = await fetch(url);
            if (res.ok) return res;
            if (res.status >= 400 && res.status < 500) throw new Error(`Server returned ${res.status}`);
          } catch (err: any) {
            console.warn(`[students] Attempt ${attempt} failed: ${err.message}`);
            if (attempt === retries) throw err;
          }
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
        }
        throw new Error(`Failed after ${retries} retries`);
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
          },
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

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      if (!schoolId || !className || !sectionName) {
        toast.error("Select school, class, and section first");
        return;
      }

      setShowUpload(true);

      const newItems: QueueItem[] = files.map((file) => ({
        id: uuidv4(),
        fileName: file.name,
        status: "pending" as const,
      }));

      addToQueue(newItems);

      const filesToProcess = files.map((file, i) => ({
        file,
        queueId: newItems[i].id
      }));

      processFiles(filesToProcess);
      toast.info(`Processing ${files.length} form photo${files.length !== 1 ? "s" : ""}`);
    },
    [schoolId, className, sectionName, addToQueue]
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
            updateQueueItem(queueId, { status: "processing" });

            try {
              const { base64, thumbnail } = await optimizeImage(file);
              updateQueueItem(queueId, { thumbnail });

              await waitForSlot();

              const res = await fetch("/api/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageBase64: base64 }),
              });

              if (res.status === 429) {
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

              recordRequest();

              const extractedStudents = Array.isArray(extractData.data)
                ? extractData.data
                : [extractData.data];

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

  const hasStudents = students.length > 0 && !!schoolId;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 sm:py-14 space-y-8">
      {/* Page header */}
      <header className="space-y-2">
        <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold tracking-tight text-foreground">
          {hasStudents ? "Student roster" : "Read handwritten enrollment forms"}
       </h1>
        {!hasStudents && (
          <p className="text-[0.9375rem] text-muted-fg max-w-xl leading-relaxed">
            Upload photos of student enrollment forms. The system reads the handwriting so you can review and export to Excel in minutes.
         </p>
        )}
     </header>

      <SchoolManager />

      {/* Upload card (collapsible) */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/40 transition-colors"
          aria-expanded={showUpload}
        >
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-[0.9375rem] tracking-tight text-foreground">
              Upload forms
           </span>
            {queue.length > 0 && (
              <span className="font-mono text-[0.75rem] text-muted-fg">
                {queue.length} in queue
             </span>
            )}
            {isProcessing && (
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.06em] font-semibold text-warning">
                Processing
             </span>
            )}
         </div>
          {showUpload ? (
            <ChevronUp size={17} strokeWidth={1.75} className="text-muted-fg" />
          ) : (
            <ChevronDown size={17} strokeWidth={1.75} className="text-muted-fg" />
          )}
       </button>

        {showUpload && (
          <div className="px-6 pb-6 pt-2 space-y-6 border-t border-border">
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
     </section>

      {/* Review */}
      {hasStudents && (
        <section ref={tableRef} className="space-y-4 pt-2 scroll-mt-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-[1.375rem] font-bold tracking-tight text-foreground">
                Review and edit
             </h2>
              <p className="text-[0.875rem] text-muted-fg mt-1">
                Click any cell to edit. Changes save to the database automatically.
             </p>
           </div>
            <StatusBar />
         </div>

          <Toolbar /> {/* Sticky export bar — stays pinned to viewport bottom while scrolling */}
          <DataTable />
       </section>
      )}
   </div>
  );
}
