import { AlertOctagon, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/Badge";
import type { HealthScoreResult } from "@/lib/operacao/health-score";

type Sev = "ok" | "warning" | "critical";

const ICON = {
  ok: CheckCircle2,
  warning: AlertTriangle,
  critical: AlertOctagon,
} as const;

/**
 * Faixa de status da operação. Dois modos (compatíveis):
 * - `health`: usa o resultado do Health Score (nota + status + motivos).
 * - contagens (`online/alarme/offline/total`): comportamento original da Fase 1.
 */
export function StatusBanner({
  health,
  online,
  alarme = 0,
  offline = 0,
  total,
}: {
  health?: HealthScoreResult;
  online?: number;
  alarme?: number;
  offline?: number;
  total?: number;
}) {
  // Modo Health Score
  if (health) {
    const sev: Sev =
      health.status === "healthy"
        ? "ok"
        : health.status === "attention"
          ? "warning"
          : "critical";
    const Icon = ICON[sev];
    const c = health.counters;
    return (
      <section className={`status-banner sev-${sev}`} role="status">
        <span className="status-banner-icon">
          <Icon size={22} />
        </span>
        <div className="status-banner-body">
          <strong>
            {health.label}
            {!health.noData ? ` · ${health.score}/100` : ""}
          </strong>
          <span>{health.reasons[0]?.description ?? ""}</span>
        </div>
        <div className="status-banner-badges">
          {c.onlinePlants != null ? (
            <Badge variant="success" dot>
              {c.onlinePlants} online
            </Badge>
          ) : null}
          {c.plantsWithAlarm ? (
            <Badge variant="warning" dot>
              {c.plantsWithAlarm} alarme
            </Badge>
          ) : null}
          {c.offlinePlants ? (
            <Badge variant="critical" dot>
              {c.offlinePlants} offline
            </Badge>
          ) : null}
        </div>
      </section>
    );
  }

  // Modo contagens (Fase 1) — preservado.
  const tot = total ?? 0;
  const on = online ?? 0;
  const sev: Sev = offline > 0 ? "critical" : alarme > 0 ? "warning" : "ok";
  const Icon = ICON[sev];
  const titulo =
    tot === 0
      ? "Sem telemetria"
      : sev === "ok"
        ? "Operação saudável"
        : sev === "warning"
          ? "Operação em atenção"
          : "Operação com falhas";
  const resumo =
    tot === 0
      ? "Nenhuma usina monitorada no momento."
      : `${on} de ${tot} usina(s) online` +
        (alarme > 0 ? ` · ${alarme} em alarme` : "") +
        (offline > 0 ? ` · ${offline} offline` : "");

  return (
    <section className={`status-banner sev-${sev}`} role="status">
      <span className="status-banner-icon">
        <Icon size={22} />
      </span>
      <div className="status-banner-body">
        <strong>{titulo}</strong>
        <span>{resumo}</span>
      </div>
      <div className="status-banner-badges">
        <Badge variant="success" dot>
          {on} online
        </Badge>
        {alarme > 0 ? (
          <Badge variant="warning" dot>
            {alarme} alarme
          </Badge>
        ) : null}
        {offline > 0 ? (
          <Badge variant="critical" dot>
            {offline} offline
          </Badge>
        ) : null}
      </div>
    </section>
  );
}
