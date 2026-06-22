import { CheckCircle2, ShieldAlert } from "lucide-react";
import { IncidentItem } from "@/components/operacao/IncidentItem";
import type { OperationalIncident } from "@/lib/operacao/incidents";

/**
 * Centro de Atenção: lista compacta e priorizada de incidentes operacionais
 * (estilo NOC/SOC). Apresentação pura — recebe a lista já derivada por
 * `getIncidents()`. Genérico: reaproveitável em outras telas.
 */
export function AttentionCenter({
  incidents,
  max = 6,
}: {
  incidents: OperationalIncident[];
  max?: number;
}) {
  const total = incidents.length;
  const criticos = incidents.filter((i) => i.severity === "critical").length;
  const shown = incidents.slice(0, max);
  const restante = total - shown.length;

  return (
    <section className="panel attention-center">
      <div className="panel-header">
        <div>
          <h2>
            <ShieldAlert
              size={18}
              style={{ verticalAlign: "-3px", marginRight: 6 }}
            />
            Centro de Atenção
          </h2>
          <p>
            {total === 0
              ? "Nenhum incidente operacional ativo."
              : `${total} incidente(s)${criticos ? ` · ${criticos} crítico(s)` : ""}.`}
          </p>
        </div>
      </div>

      {total === 0 ? (
        <p className="attention-empty">
          <CheckCircle2 size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
          Tudo operando dentro do esperado.
        </p>
      ) : (
        <>
          <ul className="incident-list">
            {shown.map((incident) => (
              <IncidentItem key={incident.id} incident={incident} />
            ))}
          </ul>
          {restante > 0 ? (
            <p className="attention-more">
              + {restante} incidente(s) adicional(is).
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
