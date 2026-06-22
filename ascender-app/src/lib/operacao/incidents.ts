import {
  getOperationalOverview,
  type OperationalOverview,
} from "@/lib/operacao/operational-overview";

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
  /** true = dia (janela solar). Default true. À noite, offline de usina vira um
   *  único item informativo (sem geração esperada). Coletor segue inalterado. */
  isSolarWindow?: boolean;
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

  const solar = input.isSolarWindow ?? true;
  if (solar) {
    // Dia: cada usina offline é um incidente crítico (sem comunicação/produção).
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
  } else if (input.offlinePlants.length > 0) {
    // Noite: agrega num único item informativo (ausência de geração esperada).
    out.push({
      id: "sem-geracao-noturno",
      severity: "info",
      source: "telemetria",
      title: "Sem geração (fora da janela solar)",
      description: `${input.offlinePlants.length} usina(s) sem geração — esperado fora do horário solar. Coletores/alarmes seguem monitorados.`,
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

/** Mapeia o overview (snapshot único) para a entrada da função pura. */
export function incidentsInputFromOverview(
  ov: OperationalOverview,
): IncidentsInput {
  const nomePorStation = new Map(ov.plants.map((p) => [p.stationId, p.name]));
  return {
    totalPlants: ov.plants.length,
    offlinePlants: ov.plants
      .filter((p) => p.state === "offline")
      .map((p) => ({
        stationId: p.stationId,
        name: p.name,
        updateTime: p.updateTime,
      })),
    alarmPlants: ov.plants
      .filter((p) => p.state === "alarm")
      .map((p) => ({ stationId: p.stationId, name: p.name })),
    silentCollectors: ov.collectors
      .filter((c) => c.state === "offline")
      .map((c) => ({
        sn: c.sn,
        plant: c.plantId ? (nomePorStation.get(c.plantId) ?? c.plantId) : undefined,
      })),
    lastCommAgeMinutes: ov.lastTelemetryAgeMinutes,
    overdueInvoices: ov.overdueInvoices,
    isSolarWindow: ov.isSolarWindow,
  };
}

/**
 * Incidentes a partir do overview. Sem `overview`, lê uma vez via
 * `getOperationalOverview()` (compatível). Com `overview` recebido, NÃO faz I/O.
 */
export async function getIncidents(
  overview?: OperationalOverview,
): Promise<OperationalIncident[]> {
  const ov = overview ?? (await getOperationalOverview());
  return buildIncidents(incidentsInputFromOverview(ov));
}
