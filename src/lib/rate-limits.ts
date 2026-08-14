// ── Client-side Rate Limit Tracker ── //
// Tracks Gemini free-tier limits: ~15 RPM, ~1500 RPD
// Pauses batch processing automatically when limits are near.
// Reads retryAfter from 429 error responses.

export interface RateLimitState {
  rpmUsed: number;         // requests in current minute window
  rpmLimit: number;        // actual limit from your AI Studio tier
  rpdUsed: number;         // requests made today
  rpdLimit: number;        // actual daily limit from your AI Studio tier
  minuteStart: number;     // timestamp of current minute window
  isPaused: boolean;       // true when we're in cooldown
  pausedUntil: number;     // timestamp when cooldown ends (0 if not paused)
  pauseReason: string;     // e.g. "Rate limit reached — 60s cooldown"
}

type Listener = () => void;

const listeners = new Set<Listener>();
let state: RateLimitState = loadState();

function loadState(): RateLimitState {
  try {
    const raw = sessionStorage.getItem("gemini-rate-limits");
    if (raw) {
      const saved = JSON.parse(raw);
      // Reset minute counter if minute has passed
      if (Date.now() - saved.minuteStart > 60_000) {
        return {
          rpmUsed: 0,
          rpmLimit: 5,  // conservative — free tier actual limit
          rpdUsed: saved.rpdUsed || 0,
          rpdLimit: 100, // conservative — prevents hitting daily cap in one session
          minuteStart: Date.now(),
          isPaused: false,
          pausedUntil: 0,
          pauseReason: "",
        };
      }
      return saved;
    }
  } catch { /* ignore */ }
  return {
    rpmUsed: 0,
    rpmLimit: 5,
    rpdUsed: 0,
    rpdLimit: 100,
    minuteStart: Date.now(),
    isPaused: false,
    pausedUntil: 0,
    pauseReason: "",
  };
}

function saveState() {
  try {
    sessionStorage.setItem("gemini-rate-limits", JSON.stringify(state));
  } catch { /* ignore */ }
}

function notify() {
  for (const fn of listeners) fn();
}

/** Reset the minute counter if we've crossed into a new minute */
function refreshWindow() {
  if (Date.now() - state.minuteStart > 60_000) {
    state.rpmUsed = 0;
    state.minuteStart = Date.now();
  }
  // Check if paused cooldown has expired
  if (state.isPaused && Date.now() > state.pausedUntil) {
    state.isPaused = false;
    state.pausedUntil = 0;
    state.pauseReason = "";
  }
  saveState();
}

/** Call before making a Gemini request. Returns true if request can proceed. */
export function canMakeRequest(): boolean {
  refreshWindow();
  if (state.isPaused) {
    const remaining = Math.ceil((state.pausedUntil - Date.now()) / 1000);
    if (remaining > 0) return false;
    // cooldown expired
    state.isPaused = false;
    state.pausedUntil = 0;
    state.pauseReason = "";
    saveState();
    notify();
  }
  // Leave 10% headroom on RPM
  if (state.rpmUsed >= state.rpmLimit * 0.9) {
    state.isPaused = true;
    state.pausedUntil = Date.now() + 61_000;
    state.pauseReason = `Minute limit reached (${state.rpmUsed}/${state.rpmLimit}) — waiting 60s`;
    saveState();
    notify();
    return false;
  }
  return true;
}

/** Call after a successful Gemini request */
export function recordRequest(): void {
  refreshWindow();
  state.rpmUsed++;
  state.rpdUsed++;
  saveState();
  notify();
}

/** Call when we hit a 429 error. retryAfterSeconds from the error response. */
export function handleRateLimited(retryAfterSeconds?: number): void {
  const wait = Math.max(retryAfterSeconds ?? 60, 10);
  state.isPaused = true;
  state.pausedUntil = Date.now() + wait * 1000 + 1000;
  state.pauseReason = `Rate limited by API — resuming in ${wait}s`;
  saveState();
  notify();
}

/** Get current state snapshot */
export function getRateLimitState(): Readonly<RateLimitState> {
  refreshWindow();
  return { ...state };
}

/**
 * Wait until it's safe to send the next request.
 * Returns a promise that resolves when allowed, or after the pause expires.
 */
export async function waitForSlot(): Promise<void> {
  while (!canMakeRequest()) {
    const remaining = Math.max(state.pausedUntil - Date.now(), 1000);
    await new Promise((r) => setTimeout(r, Math.min(remaining, 5000)));
  }
}

/** Subscribe to state changes. Returns unsubscribe function. */
export function onRateLimitChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** Reset daily count (for testing or new day). Persists across page reloads via sessionStorage. */
export function resetDailyCount(): void {
  state.rpdUsed = 0;
  saveState();
  notify();
}