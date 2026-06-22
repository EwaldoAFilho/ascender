import Link from "next/link";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  History,
  Info,
} from "lucide-react";
import type { OperationalTimelineEvent } from "@/lib/operacao/timeline";

const ICON = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
} as const;

/**
 * Linha do tempo operacional: eventos datados recentes (mais novo no topo).
 * Apresentação pura — recebe a lista já derivada por `getTimeline()`.
 * Genérico: reaproveitável em outras telas.
 */
export function OperationalTimeline({
  events,
}: {
  events: OperationalTimelineEvent[];
}) {
  return (
    <section className="panel op-timeline-panel">
      <div className="panel-header">
        <div>
          <h2>
            <History size={18} style={{ verticalAlign: "-3px", marginRight: 6 }} />
            Linha do tempo operacional
          </h2>
          <p>Eventos recentes da operação (alarmes, telemetria, sincronizações).</p>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="op-timeline-empty">
          <CheckCircle2 size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
          Operação sem eventos recentes registrados.
        </p>
      ) : (
        <ol className="op-timeline">
          {events.map((e) => {
            const Icon = ICON[e.severity];
            return (
              <li key={e.id} className={`tl-item sev-${e.severity}`}>
                <span className="tl-marker">
                  <Icon size={15} />
                </span>
                <div className="tl-body">
                  <div className="tl-top">
                    <strong>{e.title}</strong>
                    {e.targetLabel ? (
                      <span className="tl-target">{e.targetLabel}</span>
                    ) : null}
                    {e.ageLabel ? <span className="tl-age">{e.ageLabel}</span> : null}
                  </div>
                  <span className="tl-desc">{e.description}</span>
                </div>
                {e.href ? (
                  <Link className="tl-action" href={e.href} aria-label="Ver detalhes">
                    <ChevronRight size={15} />
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
