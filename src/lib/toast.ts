// ── Custom Toast Notification System ── //
// Imperative API: toast.success(), toast.error(), toast.info()
// <Toast /> component in @/components/Toast subscribes and renders them.

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration: number; // ms, 0 = sticky until dismissed
  createdAt: number;
}

type Subscriber = (item: ToastItem) => void;

let counter = 0;
const subscribers = new Set<Subscriber>();

function emit(item: ToastItem) {
  for (const fn of subscribers) fn(item);
}

function create(type: ToastType, message: string, duration: number) {
  emit({
    id: `toast-${++counter}-${Date.now()}`,
    type,
    message,
    duration: duration > 0 ? duration : 4000,
    createdAt: Date.now(),
  });
}

export const toast = {
  success(message: string, opts?: { duration?: number }) {
    create("success", message, opts?.duration ?? 4000);
  },
  error(message: string, opts?: { duration?: number }) {
    create("error", message, opts?.duration ?? 5000); // errors stay a bit longer
  },
  info(message: string, opts?: { duration?: number }) {
    create("info", message, opts?.duration ?? 4000);
  },
};

/** Subscribe to new toast items. Returns unsubscribe function. */
export function subscribe(fn: Subscriber): () => void {
  subscribers.add(fn);
  return () => { subscribers.delete(fn); };
}