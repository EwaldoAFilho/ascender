import { contarFaturasVencidasDg } from "@/lib/digitalgrid/queries";
import {
  lerColetoresDoBanco,
  lerEstacoesDoBanco,
  ultimaTelemetriaEm,
} from "@/lib/soliscloud/telemetria-db";

export type IncidentSeverity = "critical" | "warning" | "info";

export type IncidentSource =
  | "telemetria"
  | "alarme"
  | "coletor"
  | "financeiro"
  | "sync";

export type OperationalIncident = {
  id: string;
  severity: IncidentSeverity;
  title: string;
  description: string;
  source: IncidentSource;
  targetLabel?: string;
  createdAt?: Date | string;
  ageLabel?: string;
  actionLabel?: string;
  href?: string;
};

const SEV_ORDER: Record<IncidentSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

/** Ordena por severidade (crítico → atenção → info). Estável. */
export function ordenarIncidentes(
  list: OperationalIncident[],
): OperationalIncident[] {
  return [...list].sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
}

function idadeLabel(min: number): string {
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `há ${h}h ${m}min` : `há ${h}h`;
}

export type IncidentsInput = {
  totalPlants: number;
  offlinePlants: Array<{ stationId: string; name: string; updateTime?: string }>;
  alarmPlants: Array<{ stationId: string; name: string }>;
  silentCollectors: Array<{ sn: string; plant?: string }>;
  lastCommAgeMinutes: number | null;
  overdueInvoices: number;
};

/**
 * Função PURA: monta a lista de incidentes a partir de dados já apurados.
 * Sem I/O — testável. Regras/priorização em PLANO_FASE_2B_ATTENTION_CENTER.md.
 */
export function buildIncidents(input: IncidentsInput): OperationalIncident[] {
  const out: OperationalIncident[] = [];

  // Ausência total de telemetria: único incidente relevante.
  if (input.totalPlants === 0 && input.lastCommAgeMinutes == null) {
    out.push({
      id: "sem-telemetria",
      severity: "info",
      source: "sync",
      title: "Sem telemetria",
      description:
        "Nenhuma usina enviou dados ainda. Configure a SolisCloud ou aguarde a próxima coleta.",
      href: "/configuracoes/integracoes",
      actionLabel: "Configurar",
    });
    return out;
  }

  for (const p of input.offlinePlants) {
    out.push({
      id: `offline-${p.stationId}`,
      severity: "critical",
      source: "telemetria",
      title: "Usina offline",
      description: p.updateTime
        ? `Sem comunicação. Última coleta: ${p.updateTime}.`
        : "Sem comunicação com a usina.",
      targetLabel: p.name,
      href: "/soliscloud",
      actionLabel: "Ver operação",
    });
  }

  for (const p of input.alarmPlants) {
    out.push({
      id: `alarm-${p.stationId}`,
      severity: "warning",
      source: "alarme",
      title: "Usina em alarme",
      description: "Alarme ativo na usina.",
      targetLabel: p.name,
      href: "/soliscloud",
      actionLabel: "Ver alarmes",
    });
  }

  for (const c of input.silentCollectors) {
    out.push({
      id: `coletor-${c.sn}`,
      severity: "warning",
      source: "coletor",
      title: "Coletor sem comunicação",
      description: `Datalogger ${c.sn} offline${c.plant ? ` (${c.plant})` : ""}.`,
      targetLabel: c.plant ?? c.sn,
      href: "/soliscloud",
      actionLabel: "Ver coletores",
    });
  }

  if (input.lastCommAgeMinutes != null && input.lastCommAgeMinutes > 30) {
    out.push({
      id: "telemetria-atrasada",
      severity: input.lastCommAgeMinutes > 60 ? "warning" : "info",
      source: "sync",
      title: "Telemetria atrasada",
      description: `Última coleta ${idadeLabel(input.lastCommAgeMinutes)}. O coletor roda a cada ~10 min.`,
      ageLabel: idadeLabel(input.lastCommAgeMinutes),
    });
  }

  if (input.overdueInvoices > 0) {
    out.push({
      id: "faturas-vencidas",
      severity: "warning",
      source: "financeiro",
      title: "Faturas vencidas",
      description: `${input.overdueInvoices} fatura(s) vencida(s) e em aberto.`,
      href: "/financeiro",
      actionLabel: "Ver financeiro",
    });
  }

  return ordenarIncidentes(out);
}

/**
 * Camada de leitura: apura os incidentes no banco (somente leitura) reusando os
 * mesmos dados do Health Score, agora detalhados por entidade.
 */
export async function getIncidents(): Promise<OperationalIncident[]> {
  const [estacoes, coletores, ultimaComm, vencidas] = await Promise.all([
    lerEstacoesDoBanco(),
    lerColetoresDoBanco(),
    ultimaTelemetriaEm(),
    contarFaturasVencidasDg().catch(() => 0),
  ]);

  const nomePorStation = new Map(
    estacoes.map((e) => [e.stationId, e.stationName ?? e.stationId]),
  );

  const offlinePlants = estacoes
    .filter((e) => e.state === "offline")
    .map((e) => ({
      stationId: e.stationId,
      name: e.stationName ?? e.stationId,
      updateTime: e.updateTime || undefined,
    }));

  const alarmPlants = estacoes
    .filter((e) => e.state === "alarm")
    .map((e) => ({ stationId: e.stationId, name: e.stationName ?? e.stationId }));

  const silentCollectors = coletores.coletores
    .filter((c) => c.state === "offline")
    .map((c) => ({
      sn: c.sn,
      plant: c.plantId ? (nomePorStation.get(c.plantId) ?? c.plantId) : undefined,
    }));

  const lastCommAgeMinutes = ultimaComm
    ? Math.max(
        0,
        Math.round((Date.now() - new Date(ultimaComm).getTime()) / 60000),
      )
    : null;

  return buildIncidents({
    totalPlants: estacoes.length,
    offlinePlants,
    alarmPlants,
    silentCollectors,
    lastCommAgeMinutes,
    overdueInvoices: vencidas ?? 0,
  });
}
