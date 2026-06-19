import type { ReactNode } from "react";

export type SummaryTone = "default" | "ok" | "warn" | "bad";

export type SummaryItem = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: SummaryTone;
};

/**
 * Faixa de métricas compacta (rótulo + valor + dica), com tom opcional para
 * sinalizar saúde (ok/warn/bad). Pura de apresentação — serve tanto às páginas
 * de servidor (cadastros) quanto às de cliente (SolisCloud).
 */
export function SummaryStrip({ items }: { items: SummaryItem[] }) {
  return (
    <section className="metric-row">
      {items.map((item, i) => (
        <article
          key={i}
          className={`metric${item.tone && item.tone !== "default" ? ` is-${item.tone}` : ""}`}
        >
          <span className="m-lbl">{item.label}</span>
          <span className="m-val">{item.value}</span>
          {item.hint ? <span className="m-hint">{item.hint}</span> : null}
        </article>
      ))}
    </section>
  );
}
