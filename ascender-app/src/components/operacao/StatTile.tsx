import type { ReactNode } from "react";

export type StatTileTone = "ok" | "warn" | "critical" | "neutral";

/**
 * Tile de contador NOC/SOC. Apresentação pura. Quando recebe `onClick`, vira um
 * botão (filtro) com estado `active`; senão, é um cartão informativo.
 */
export function StatTile({
  label,
  value,
  tone = "neutral",
  hint,
  active = false,
  onClick,
}: {
  label: string;
  value: ReactNode;
  tone?: StatTileTone;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const className = `stat-tile tone-${tone}${active ? " is-active" : ""}${
    onClick ? " is-clickable" : ""
  }`;
  const inner = (
    <>
      <span className="stat-tile-value">{value}</span>
      <span className="stat-tile-label">{label}</span>
      {hint ? <span className="stat-tile-hint">{hint}</span> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        aria-pressed={active}
        onClick={onClick}
      >
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}
