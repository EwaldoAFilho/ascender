import { AlertOctagon, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/Badge";

/**
 * Faixa de status global da operação. Versão inicial (Fase 1): apenas
 * apresentação, a partir de contagens que a tela já tem (online/alarme/offline).
 * Não cria query nova. Evoluível para Health Score na Fase 2.
 */
export function StatusBanner({
  online,
  alarme,
  offline,
  total,
}: {
  online: number;
  alarme: number;
  offline: number;
  total: number;
}) {
  const sev = offline > 0 ? "critical" : alarme > 0 ? "warning" : "ok";
  const Icon =
    sev === "critical" ? AlertOctagon : sev === "warning" ? AlertTriangle : CheckCircle2;
  const titulo =
    total === 0
      ? "Sem telemetria"
      : sev === "ok"
        ? "Operação saudável"
        : sev === "warning"
          ? "Operação em atenção"
          : "Operação com falhas";
  const resumo =
    total === 0
      ? "Nenhuma usina monitorada no momento."
      : `${online} de ${total} usina(s) online` +
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
          {online} online
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
