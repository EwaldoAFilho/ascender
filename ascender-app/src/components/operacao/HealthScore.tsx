import { Activity } from "lucide-react";
import type { HealthReason, HealthScoreResult } from "@/lib/operacao/health-score";

const STATUS_SEV = {
  healthy: "ok",
  attention: "warning",
  critical: "critical",
} as const;

const SEV_COLOR: Record<HealthReason["severity"], string> = {
  success: "var(--sev-ok)",
  warning: "var(--sev-warning)",
  critical: "var(--sev-critical)",
  info: "var(--sev-info)",
};

function Gauge({
  score,
  color,
  noData,
}: {
  score: number;
  color: string;
  noData: boolean;
}) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = noData ? 0 : Math.max(0, Math.min(100, score)) / 100;
  return (
    <svg className="hs-gauge" viewBox="0 0 80 80" width="80" height="80" aria-hidden>
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke="var(--line)"
        strokeWidth="7"
      />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${(c * pct).toFixed(1)} ${c.toFixed(1)}`}
        transform="rotate(-90 40 40)"
      />
      <text
        x="40"
        y="40"
        textAnchor="middle"
        dominantBaseline="central"
        className="hs-gauge-num"
      >
        {noData ? "—" : score}
      </text>
    </svg>
  );
}

/**
 * Widget premium de saúde da operação (nota 0–100 + status + motivos).
 * Apresentação pura — recebe o resultado já calculado por `getHealthScore()`.
 */
export function HealthScore({ result }: { result: HealthScoreResult }) {
  // Sem telemetria é um estado NEUTRO (desconhecido), não um alerta âmbar.
  const sev = result.noData ? "info" : STATUS_SEV[result.status];
  const color = `var(--sev-${sev})`;
  const topReasons = result.reasons.slice(0, 3);

  return (
    <section className={`healthscore sev-${sev}`} role="status">
      <div className="hs-gauge-wrap">
        <Gauge score={result.score} color={color} noData={result.noData} />
      </div>

      <div className="hs-body">
        <p className="eyebrow">
          <Activity size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
          Saúde da operação
        </p>
        <strong className="hs-label">{result.label}</strong>
        <ul className="hs-reasons">
          {topReasons.map((reason, i) => (
            <li key={i}>
              <span
                className="hs-dot"
                style={{ background: SEV_COLOR[reason.severity] }}
                aria-hidden
              />
              <span className="hs-reason-text">
                <b>{reason.title}</b>
                <span className="hs-reason-desc"> — {reason.description}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
