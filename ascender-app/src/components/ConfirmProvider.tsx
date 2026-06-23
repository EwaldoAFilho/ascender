"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ConfirmOptions = {
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** Diálogo só-aviso: esconde o botão Cancelar (ex.: mensagens de erro). */
  hideCancel?: boolean;
};

type Pendente = ConfirmOptions & { resolve: (v: boolean) => void };

const ConfirmContext = createContext<
  ((o: ConfirmOptions) => Promise<boolean>) | null
>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  // Só fecha por clique no fundo quando o pressionar começou no fundo.
  const downNoFundo = useRef(false);

  const confirm = useCallback(
    (o: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setPendente({ ...o, resolve })),
    [],
  );

  const fechar = useCallback((v: boolean) => {
    setPendente((p) => {
      p?.resolve(v);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!pendente) return;
    okRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar(false);
      else if (e.key === "Enter") fechar(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendente, fechar]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pendente ? (
        <div
          className="modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            downNoFundo.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            if (downNoFundo.current && e.target === e.currentTarget) fechar(false);
          }}
        >
          <div
            className="modal confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-label={pendente.title ?? "Confirmação"}
            onClick={(e) => e.stopPropagation()}
          >
            {pendente.title ? (
              <h2 className="confirm-titulo">{pendente.title}</h2>
            ) : null}
            <div className="confirm-msg">{pendente.message}</div>
            <div className="form-actions">
              <button
                ref={okRef}
                type="button"
                className={pendente.danger ? "btn-danger" : "btn-primary"}
                onClick={() => fechar(true)}
              >
                {pendente.confirmLabel ?? "Confirmar"}
              </button>
              {pendente.hideCancel ? null : (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => fechar(false)}
                >
                  {pendente.cancelLabel ?? "Cancelar"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

/** Hook que retorna uma função `confirm(options)` → Promise<boolean>. */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm precisa de <ConfirmProvider>.");
  return ctx;
}
