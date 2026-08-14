// ── URL ↔ Zustand sync for the page's school/class/section/year context ──
//
// URL shape:  /?school=<id>&class=<V>&section=<B>&year=<2026-2027>
//
// Reads on mount, writes on every selection change (history.replaceState so
// we don't pollute the back stack with one entry per keystroke), and reacts
// to popstate so browser back/forward navigation restores the right store
// state.

export interface ContextParams {
  schoolId: string;
  className: string;
  sectionName: string;
  academicYear: string;
}

const KEYS = ["school", "class", "section", "year"] as const;

/** Read context from window.location.search. Empty strings when missing. */
export function readContextFromUrl(): Partial<ContextParams> {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  return {
    schoolId: sp.get("school") ?? "",
    className: sp.get("class") ?? "",
    sectionName: sp.get("section") ?? "",
    academicYear: sp.get("year") ?? "",
  };
}

/** Build a query string from the non-empty context fields. */
export function buildContextQuery(ctx: ContextParams): string {
  const sp = new URLSearchParams();
  if (ctx.schoolId) sp.set("school", ctx.schoolId);
  if (ctx.className) sp.set("class", ctx.className);
  if (ctx.sectionName) sp.set("section", ctx.sectionName);
  if (ctx.academicYear) sp.set("year", ctx.academicYear);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Push the current context to the URL using replaceState (no history entry).
 * Safe to call from useEffect — won't trigger SSR hydration mismatches.
 */
export function writeContextToUrl(ctx: ContextParams): void {
  if (typeof window === "undefined") return;
  const next = `${window.location.pathname}${buildContextQuery(ctx)}${window.location.hash}`;
  if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(null, "", next);
  }
}

/** True when the URL has at least the school param set. */
export function hasUrlContext(): boolean {
  return !!readContextFromUrl().schoolId;
}

/** Strip all context params from the URL (used when a school is deleted). */
export function clearUrlContext(): void {
  if (typeof window === "undefined") return;
  window.history.replaceState(null, "", window.location.pathname + window.location.hash);
}
