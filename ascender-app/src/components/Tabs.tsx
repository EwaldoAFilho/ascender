"use client";

import type { ReactNode } from "react";

export type TabItem = { id: string; label: ReactNode };

/**
 * Abas padronizadas. Reaproveita o estilo `.registry-tabs` já usado em
 * SolisCloud/Geração — apenas encapsula o padrão para reuso consistente.
 */
export function Tabs({
  items,
  value,
  onChange,
  ariaLabel,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}) {
  return (
    <nav className="registry-tabs" aria-label={ariaLabel} role="tablist">
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          className={value === t.id ? "active" : ""}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
