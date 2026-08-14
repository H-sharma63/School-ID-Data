"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, GraduationCap, ArrowRight, Plus, Trash2, Check, AlertTriangle } from "lucide-react";
import { toast } from "@/lib/toast";

interface School {
  id: string;
  name: string;
  classes: { name: string }[];
}

interface PromoteRule {
  fromClass: string;
  toClass: string; // "GRADUATE" is a special sentinel
}

interface Props {
  open: boolean;
  onClose: () => void;
  schools: School[];
}

function buildDefaultRules(classNames: string[]): PromoteRule[] {
  return classNames.map((cls) => {
    const num = parseInt(cls, 10);
    if (!isNaN(num)) {
      return { fromClass: cls, toClass: num >= 12 ? "GRADUATE" : String(num + 1) };
    }
    return { fromClass: cls, toClass: "" };
  });
}

function guessNextYear(year: string): string {
  const short = year.match(/^(\d{4})-(\d{2})$/);
  if (short) {
    const start = parseInt(short[1], 10) + 1;
    const end = (start + 1) % 100;
    return `${start}-${end < 10 ? "0" + end : end}`;
  }
  const long = year.match(/^(\d{4})-(\d{4})$/);
  if (long) {
    const start = parseInt(long[1], 10) + 1;
    return `${start}-${start + 1}`;
  }
  return "";
}

type Step = "configure" | "confirm" | "done";

export default function PromoteModal({ open, onClose, schools }: Props) {
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [rules, setRules] = useState<PromoteRule[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<Step>("configure");
  const [result, setResult] = useState<{ promoted: number; graduated: number } | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedSchoolId(schools[0]?.id || "");
      setFromYear("");
      setToYear("");
      setRules([]);
      setAvailableYears([]);
      setResult(null);
      setStep("configure");
    }
  }, [open, schools]);

  // Fetch distinct academic years for the selected school
  useEffect(() => {
    if (!selectedSchoolId) return;
    setLoadingYears(true);
    setFromYear("");
    setToYear("");
    setRules([]);
    fetch(`/api/students/promote?schoolId=${selectedSchoolId}`)
      .then((r) => r.json())
      .then((data) => {
        const years: string[] = data.years || [];
        setAvailableYears(years);
        if (years.length > 0) setFromYear(years[years.length - 1]);
      })
      .catch(() => setAvailableYears([]))
      .finally(() => setLoadingYears(false));
  }, [selectedSchoolId]);

  // When fromYear changes, auto-populate toYear and rules
  useEffect(() => {
    if (!fromYear) return;
    setToYear(guessNextYear(fromYear));
    fetch(`/api/students/promote?schoolId=${selectedSchoolId}&year=${encodeURIComponent(fromYear)}`)
      .then((r) => r.json())
      .then((data) => {
        const classes: string[] = data.classes || [];
        setRules(buildDefaultRules(classes));
      })
      .catch(() => setRules([]));
  }, [fromYear, selectedSchoolId]);

  const updateRule = useCallback((idx: number, field: keyof PromoteRule, value: string) => {
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }, []);

  const removeRule = useCallback((idx: number) => {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const addRule = useCallback(() => {
    setRules((prev) => [...prev, { fromClass: "", toClass: "" }]);
  }, []);

  const handleReviewClick = useCallback(() => {
    const invalid = rules.filter((r) => !r.fromClass.trim() || !r.toClass.trim());
    if (invalid.length > 0) {
      toast.error("Fill in all class mappings before promoting.");
      return;
    }
    setStep("confirm");
  }, [rules]);

  const handleConfirm = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/students/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: selectedSchoolId, fromYear, toYear, rules }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Promotion failed");
      setResult({ promoted: data.promoted, graduated: data.graduated });
      setStep("done");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Promotion failed");
      setStep("configure");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedSchoolId, fromYear, toYear, rules]);

  if (!open) return null;

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId);
  const graduateRules = rules.filter((r) => r.toClass === "GRADUATE");
  const promoteRules = rules.filter((r) => r.toClass !== "GRADUATE");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border overflow-hidden shadow-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap size={18} strokeWidth={1.75} className="text-primary" />
            </div>
            <div>
              <h3 className="font-display text-[1.125rem] font-bold text-foreground tracking-tight">
                Academic Year Rollover
              </h3>
              <p className="text-[0.8125rem] text-muted-fg mt-0.5">
                {step === "configure" && "Set up promotion rules"}
                {step === "confirm" && "Review before applying"}
                {step === "done" && "Promotion complete"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-fg transition-colors"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* ── STEP: configure ── */}
        {step === "configure" && (
          <>
            <div className="overflow-y-auto overflow-x-hidden flex-1 thin-scrollbar">
              <div className="px-6 pb-2 space-y-5 min-w-0">

                {/* School picker */}
                <div className="space-y-1.5">
                  <label className="block text-[0.8125rem] font-medium text-foreground">School</label>
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-border bg-background text-[0.9375rem] text-foreground
                               focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Year row */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[0.8125rem] font-medium text-foreground">From year</label>
                    {loadingYears ? (
                      <div className="h-11 rounded-lg border border-border bg-muted animate-pulse" />
                    ) : availableYears.length > 0 ? (
                      <select
                        value={fromYear}
                        onChange={(e) => setFromYear(e.target.value)}
                        className="w-full h-11 px-3 rounded-lg border border-border bg-background text-[0.9375rem] text-foreground
                                   focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                      >
                        <option value="">Select year…</option>
                        {availableYears.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={fromYear}
                        onChange={(e) => setFromYear(e.target.value)}
                        placeholder="2024-25"
                        className="w-full h-11 px-3 rounded-lg border border-border bg-background text-[0.9375rem] text-foreground font-mono
                                   focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                      />
                    )}
                  </div>
                  <div className="h-11 flex items-center justify-center text-muted-fg">
                    <ArrowRight size={16} strokeWidth={1.75} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[0.8125rem] font-medium text-foreground">To year</label>
                    <input
                      type="text"
                      value={toYear}
                      onChange={(e) => setToYear(e.target.value)}
                      placeholder="2025-26"
                      className="w-full h-11 px-3 rounded-lg border border-border bg-background text-[0.9375rem] text-foreground font-mono
                                 focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    />
                  </div>
                </div>

                {/* Class rules */}
                {rules.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[0.8125rem] font-medium text-foreground">
                        Class promotion rules
                      </label>
                      <span className="text-[0.75rem] text-muted-fg">
                        Use <span className="font-mono font-semibold">GRADUATE</span> for final year
                      </span>
                    </div>
                    <div className="space-y-2">
                      {rules.map((rule, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={rule.fromClass}
                            onChange={(e) => updateRule(idx, "fromClass", e.target.value)}
                            placeholder="e.g. V"
                            className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-border bg-background text-[0.875rem] text-foreground font-mono
                                       focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                          />
                          <ArrowRight size={14} strokeWidth={1.75} className="text-muted-fg shrink-0" />
                          <input
                            type="text"
                            value={rule.toClass}
                            onChange={(e) => updateRule(idx, "toClass", e.target.value.toUpperCase())}
                            placeholder="VI or GR"
                            className={`flex-1 min-w-0 h-10 px-3 rounded-lg border text-[0.875rem] font-mono
                                        focus:outline-none focus:ring-2 focus:ring-ring transition-colors
                                        ${rule.toClass === "GRADUATE"
                                          ? "border-warning/60 bg-warning-bg text-warning font-semibold"
                                          : "border-border bg-background text-foreground"
                                        }`}
                          />
                          <button
                            onClick={() => removeRule(idx)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-danger-bg text-muted-fg hover:text-danger transition-colors shrink-0"
                          >
                            <Trash2 size={13} strokeWidth={2} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addRule}
                      className="flex items-center gap-1.5 text-[0.8125rem] text-primary hover:text-primary-hover font-medium transition-colors"
                    >
                      <Plus size={13} strokeWidth={2.5} />
                      Add rule
                    </button>
                  </div>
                )}

                {fromYear && rules.length === 0 && !loadingYears && (
                  <div className="text-center py-4 text-[0.875rem] text-muted-fg">
                    No students found for {fromYear} in this school.
                  </div>
                )}

                <p className="text-[0.75rem] text-muted-fg bg-muted/50 rounded-lg px-4 py-3 leading-relaxed">
                  Each student&apos;s class, section, and year are updated <strong>in place</strong>.
                  Empty sections from the old year are automatically removed.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
              <button
                onClick={onClose}
                className="h-10 px-4 text-[0.875rem] font-medium rounded-lg hover:bg-muted text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewClick}
                disabled={
                  !selectedSchoolId || !fromYear || !toYear ||
                  rules.length === 0 ||
                  rules.some((r) => !r.fromClass.trim() || !r.toClass.trim())
                }
                className="flex items-center gap-1.5 h-10 px-4 text-[0.875rem] font-semibold rounded-lg bg-primary text-primary-fg
                           hover:bg-primary-hover active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Review →
              </button>
            </div>
          </>
        )}

        {/* ── STEP: confirm ── */}
        {step === "confirm" && (
          <div className="px-6 pb-6 space-y-4 shrink-0">
            {/* Warning banner */}
            <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning-bg px-4 py-3.5">
              <AlertTriangle size={16} strokeWidth={2} className="text-warning mt-0.5 shrink-0" />
              <p className="text-[0.8125rem] text-foreground leading-relaxed">
                This will <strong>permanently update</strong> all matching student records.
                This action cannot be undone.
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-border bg-background divide-y divide-border text-[0.875rem]">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-muted-fg">School</span>
                <span className="font-medium text-foreground">{selectedSchool?.name}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-muted-fg">Year</span>
                <span className="font-mono font-medium text-foreground">{fromYear} → {toYear}</span>
              </div>
              {promoteRules.length > 0 && (
                <div className="px-4 py-3 space-y-1.5">
                  <span className="text-muted-fg block mb-2">Promoting</span>
                  {promoteRules.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 font-mono text-foreground">
                      <span className="text-[0.8125rem]">Class {r.fromClass}</span>
                      <ArrowRight size={12} strokeWidth={2} className="text-muted-fg" />
                      <span className="text-[0.8125rem]">Class {r.toClass}</span>
                    </div>
                  ))}
                </div>
              )}
              {graduateRules.length > 0 && (
                <div className="px-4 py-3 space-y-1.5">
                  <span className="text-muted-fg block mb-2">Graduating (marked inactive)</span>
                  {graduateRules.map((r, i) => (
                    <div key={i} className="font-mono text-[0.8125rem] text-warning">
                      Class {r.fromClass}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setStep("configure")}
                disabled={isSubmitting}
                className="h-10 px-4 text-[0.875rem] font-medium rounded-lg hover:bg-muted text-foreground transition-colors disabled:opacity-50"
              >
                ← Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 h-10 px-4 text-[0.875rem] font-semibold rounded-lg bg-primary text-primary-fg
                           hover:bg-primary-hover active:translate-y-px disabled:opacity-50 transition-all"
              >
                {isSubmitting
                  ? <><Loader2 size={15} className="animate-spin" /> Promoting…</>
                  : <><GraduationCap size={15} strokeWidth={2} /> Confirm & promote</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: done ── */}
        {step === "done" && result && (
          <div className="px-6 pb-6 space-y-4 shrink-0">
            <div className="rounded-xl border border-border bg-background p-5 space-y-4">
              <div className="flex items-center gap-2 text-success font-semibold text-[0.9375rem]">
                <Check size={16} strokeWidth={2.5} />
                Promotion complete
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center rounded-lg bg-muted/50 py-3">
                  <div className="font-display font-bold text-[1.75rem] text-foreground tabular-nums">
                    {result.promoted}
                  </div>
                  <div className="text-[0.75rem] text-muted-fg mt-0.5">Promoted</div>
                </div>
                <div className="text-center rounded-lg bg-muted/50 py-3">
                  <div className="font-display font-bold text-[1.75rem] text-foreground tabular-nums">
                    {result.graduated}
                  </div>
                  <div className="text-[0.75rem] text-muted-fg mt-0.5">Graduated</div>
                </div>
              </div>
              <p className="text-[0.8125rem] text-muted-fg">
                {fromYear} → {toYear} · {selectedSchool?.name}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setStep("configure"); setResult(null); }}
                className="h-10 px-4 text-[0.875rem] font-medium rounded-lg hover:bg-muted text-foreground transition-colors"
              >
                Promote another
              </button>
              <button
                onClick={onClose}
                className="h-10 px-4 text-[0.875rem] font-semibold rounded-lg bg-primary text-primary-fg hover:bg-primary-hover transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
