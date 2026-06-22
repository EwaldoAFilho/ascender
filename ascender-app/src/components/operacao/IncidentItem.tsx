import Link from "next/link";
import { AlertOctagon, AlertTriangle, ChevronRight, Info } from "lucide-react";
import type { OperationalIncident } from "@/lib/operacao/incidents";

const ICON = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
} as const;

/** Um item acionável do Centro de Atenção. Apresentação pura. */
export function IncidentItem({ incident }: { incident: OperationalIncident }) {
  const Icon = ICON[incident.severity];
  return (
    <li className={`incident-item sev-${incident.severity}`}>
      <span className="incident-icon">
        <Icon size={17} />
      </span>
      <div className="incident-body">
        <div className="incident-top">
          <strong>{incident.title}</strong>
          {incident.targetLabel ? (
            <span className="incident-target">{incident.targetLabel}</span>
          ) : null}
          {incident.ageLabel ? (
            <span className="incident-age">{incident.ageLabel}</span>
          ) : null}
        </div>
        <span className="incident-desc">{incident.description}</span>
      </div>
      {incident.href ? (
        <Link className="incident-action" href={incident.href}>
          {incident.actionLabel ?? "Ver"}
          <ChevronRight size={14} />
        </Link>
      ) : null}
    </li>
  );
}
