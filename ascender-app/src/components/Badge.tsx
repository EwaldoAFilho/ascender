import type { ReactNode } from "react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "critical"
  | "info"
  | "neutral";

/**
 * Badge padronizado por severidade. Convive com as classes `.status-*` legadas
 * (não as substitui) — use em conteúdo novo para consistência.
 */
export function Badge({
  variant = "neutral",
  dot = false,
  children,
}: {
  variant?: BadgeVariant;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={`badge badge-${variant}`}>
      {dot ? <i className="badge-dot" aria-hidden /> : null}
      {children}
    </span>
  );
}
