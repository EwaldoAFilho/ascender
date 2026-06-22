import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Sparkline } from "@/components/Sparkline";

export type MetricTone = "default" | "ok" | "warn" | "critical";

export type MetricDelta = {
  /** Texto curto, ex.: "12%" ou "R$ 1.200". */
  label: string;
  direction: "up" | "down" | "flat";
  /** Se a direção é positiva para o negócio (verde) ou negativa (vermelho). */
  good?: boolean;
};

const TONE_COLOR: Record<Exclude<MetricTone, "default">, string> = {
  ok: "var(--sev-ok)",
  warn: "var(--sev-warning)",
  critical: "var(--sev-critical)",
};

/**
 * Card de métrica "big number" com rótulo, dica, delta opcional e sparkline
 * opcional. Apresentação pura — não busca dados. Irmão do SummaryStrip (não o
 * substitui); use onde quiser destaque/tendência.
 */
export function MetricCard({
  label,
  value,
  hint,
  delta,
  trend,
  tone = "default",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  delta?: MetricDelta;
  trend?: number[];
  tone?: MetricTone;
  icon?: ReactNode;
}) {
  const sparkColor = tone === "default" ? "var(--brand-yellow)" : TONE_COLOR[tone];
  const deltaClass = delta
    ? delta.good === undefined
      ? "is-flat"
      : delta.good
        ? "is-good"
        : "is-bad"
    : "";
  const DeltaIcon =
    delta?.direction === "up"
      ? ArrowUpRight
      : delta?.direction === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <article
      className={`metric-card${tone !== "default" ? ` tone-${tone}` : ""}`}
    >
      <div className="metric-card-head">
        <span className="metric-card-label">{label}</span>
        {icon ? <span className="metric-card-icon">{icon}</span> : null}
      </div>
      <div className="metric-card-value">{value}</div>
      <div className="metric-card-foot">
        {delta ? (
          <span className={`metric-card-delta ${deltaClass}`}>
            <DeltaIcon size={14} />
            {delta.label}
          </span>
        ) : null}
        {hint ? <span className="metric-card-hint">{hint}</span> : null}
        {trend && trend.length > 1 ? (
          <span className="metric-card-spark">
            <Sparkline data={trend} stroke={sparkColor} />
          </span>
        ) : null}
      </div>
    </article>
  );
}
