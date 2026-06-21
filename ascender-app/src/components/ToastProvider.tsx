"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

type ToastInput = {
  message: ReactNode;
  variant?: ToastVariant;
  /** ms até sumir sozinho; 0 = fixo até fechar. Default 4000. */
  duration?: number;
};

type Toast = { id: number; message: ReactNode; variant: ToastVariant };

const ToastContext = createContext<((t: ToastInput) => void) | null>(null);

const ICON = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback(
    (id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)),
    [],
  );

  const toast = useCallback(
    (input: ToastInput) => {
      const id = (idRef.current += 1);
      const variant = input.variant ?? "success";
      setToasts((ts) => [...ts, { id, message: input.message, variant }]);
      const duration = input.duration ?? 4000;
      if (duration > 0) setTimeout(() => remove(id), duration);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICON[t.variant];
          return (
            <div key={t.id} className={`toast toast-${t.variant}`}>
              <Icon size={18} />
              <span>{t.message}</span>
              <button
                type="button"
                onClick={() => remove(t.id)}
                aria-label="Fechar"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** Hook que retorna `toast({ message, variant })`. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa de <ToastProvider>.");
  return ctx;
}
