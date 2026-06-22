import {
  getOperationalOverview,
  type OperationalOverview,
} from "@/lib/operacao/operational-overview";

export type HealthStatus = "healthy" | "attention" | "critical";

export type HealthReason = {
  severity: "success" | "warning" | "critical" | "info";
  title: string;
  description: string;
};

export type HealthScoreResult = {
  score: number; // 0 a 100 (ver `noData` para o caso sem telemetria)
  status: HealthStatus;
  label: string;
  /** true quando não há telemetria — a nota não é significativa (exibir "—"). */
  noData: boolean;
  reasons: HealthReason[];
  counters: {
    onlinePlants?: number;
    offlinePlants?: number;
    plantsWithAlarm?: number;
    silentCollectors?: number;
    overdueInvoices?: number;
  };
};

export type HealthInput = {
  totalPlants: number;
  onlinePlants: number;
  offlinePlants: number;
  plantsWithAlarm: number;
  totalCollectors?: number;
  silentCollectors?: number;
  lastCommAgeMinutes?: number | null;
  overdueInvoices?: number;
  /**
   * true = dentro da janela solar (dia). Default true (comportamento da 2A).
   * À noite (false), usina `offline` é tratada como ausência de geração esperada
   * (não penaliza nem vira crítico) — coletor/alarme seguem penalizando.
   */
  isSolarWindow?: boolean;
};

// Pesos máximos por fator (documentados em PLANO_FASE_2A_HEALTHSCORE.md).
const W_OFFLINE = 45;
const W_ALARM = 20;
const W_COLLECTORS = 20;
const W_STALE = 15;
const W_INVOICES = 10;

const STALE_OK_MIN = 30; // até aqui, sem penalidade
const STALE_MAX_MIN = 180; // penalidade máxima a partir daqui

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function penalidadeAtraso(ageMin: number | null | undefined): number {
  if (ageMin == null) return 0;
  if (ageMin <= STALE_OK_MIN) return 0;
  if (ageMin >= STALE_MAX_MIN) return W_STALE;
  return (
    ((ageMin - STALE_OK_MIN) / (STALE_MAX_MIN - STALE_OK_MIN)) * W_STALE
  );
}

/**
 * Função PURA: calcula o Health Score a partir de contagens já apuradas.
 * Sem I/O — testável e versionável. Ver fórmula/pesos no PLANO_FASE_2A.
 */
export function computeHealthScore(input: HealthInput): HealthScoreResult {
  const {
    totalPlants,
    onlinePlants,
    offlinePlants,
    plantsWithAlarm,
    totalCollectors,
    silentCollectors,
    lastCommAgeMinutes,
    overdueInvoices,
  } = input;
  const solar = input.isSolarWindow ?? true;

  const counters: HealthScoreResult["counters"] = {
    onlinePlants,
    offlinePlants,
    plantsWithAlarm,
    silentCollectors: totalCollectors ? silentCollectors : undefined,
    overdueInvoices: overdueInvoices != null ? overdueInvoices : undefined,
  };

  // Caso sem telemetria: nota não é significativa.
  if (totalPlants <= 0 && lastCommAgeMinutes == null) {
    return {
      score: 0,
      status: "attention",
      label: "Sem telemetria",
      noData: true,
      reasons: [
        {
          severity: "info",
          title: "Sem telemetria",
          description:
            "Nenhuma usina enviou dados ainda. Configure a SolisCloud ou aguarde a próxima coleta.",
        },
      ],
      counters,
    };
  }

  const base = Math.max(totalPlants, 1);
  // À noite (fora da janela solar) a usina offline = sem geração esperada → não
  // penaliza. O datalogger (coletor) offline segue penalizando abaixo.
  const pOffline = solar ? (offlinePlants / base) * W_OFFLINE : 0;
  const pAlarm = (plantsWithAlarm / base) * W_ALARM;
  const pColl =
    totalCollectors && totalCollectors > 0
      ? ((silentCollectors ?? 0) / totalCollectors) * W_COLLECTORS
      : 0;
  const pStale = penalidadeAtraso(lastCommAgeMinutes);
  const pInv =
    overdueInvoices && overdueInvoices > 0
      ? (Math.min(overdueInvoices, 20) / 20) * W_INVOICES
      : 0;

  const score = clamp(
    Math.round(100 - pOffline - pAlarm - pColl - pStale - pInv),
    0,
    100,
  );

  // Status base por faixa.
  let status: HealthStatus =
    score >= 85 ? "healthy" : score >= 60 ? "attention" : "critical";

  // Regras de proteção (evitam nota enganosa). As de offline só valem de dia —
  // à noite, usina offline é ausência de geração esperada.
  if (solar && offlinePlants > 0 && status === "healthy") status = "attention";
  // Qualquer usina em alarme rebaixa para no mínimo "attention" (nota pode
  // seguir alta, mas o rótulo não pode ser "Operação saudável"). Um alarme
  // isolado NÃO torna crítico.
  if (plantsWithAlarm > 0 && status === "healthy") status = "attention";
  if (solar && totalPlants > 0 && offlinePlants / totalPlants >= 0.3)
    status = "critical";
  if (
    lastCommAgeMinutes != null &&
    lastCommAgeMinutes > 60 &&
    status === "healthy"
  ) {
    status = "attention";
  }

  const label =
    status === "healthy"
      ? "Operação saudável"
      : status === "attention"
        ? "Operação em atenção"
        : "Operação crítica";

  const reasons: HealthReason[] = [];
  if (offlinePlants > 0) {
    reasons.push(
      solar
        ? {
            severity: "critical",
            title: "Usinas offline",
            description: `${offlinePlants} de ${totalPlants} usina(s) sem comunicação.`,
          }
        : {
            severity: "info",
            title: "Sem geração (fora da janela solar)",
            description: `${offlinePlants} usina(s) sem geração — esperado fora do horário solar.`,
          },
    );
  }
  if (totalCollectors && (silentCollectors ?? 0) > 0) {
    reasons.push({
      severity: "warning",
      title: "Coletores sem comunicação",
      description: `${silentCollectors} datalogger(s) offline de ${totalCollectors}.`,
    });
  }
  if (plantsWithAlarm > 0) {
    reasons.push({
      severity: "warning",
      title: "Usinas em alarme",
      description: `${plantsWithAlarm} usina(s) com alarme ativo.`,
    });
  }
  if (lastCommAgeMinutes != null && lastCommAgeMinutes > STALE_OK_MIN) {
    reasons.push({
      severity: lastCommAgeMinutes > 60 ? "warning" : "info",
      title: "Telemetria atrasada",
      description: `Última coleta há ${lastCommAgeMinutes} min.`,
    });
  }
  if (overdueInvoices && overdueInvoices > 0) {
    reasons.push({
      severity: "warning",
      title: "Faturas vencidas",
      description: `${overdueInvoices} fatura(s) vencida(s) em aberto.`,
    });
  }
  if (reasons.length === 0) {
    reasons.push({
      severity: "success",
      title: "Tudo operando",
      description: `${onlinePlants} usina(s) online, sem alarmes ou atrasos.`,
    });
  }

  return { score, status, label, noData: false, reasons, counters };
}

/** Mapeia o overview (snapshot único) para a entrada da função pura. */
export function healthInputFromOverview(ov: OperationalOverview): HealthInput {
  return {
    totalPlants: ov.plants.length,
    onlinePlants: ov.plants.filter((p) => p.state === "online").length,
    offlinePlants: ov.plants.filter((p) => p.state === "offline").length,
    plantsWithAlarm: ov.plants.filter((p) => p.state === "alarm").length,
    totalCollectors: ov.collectorSummary.total,
    silentCollectors: ov.collectorSummary.offline,
    lastCommAgeMinutes: ov.lastTelemetryAgeMinutes,
    overdueInvoices: ov.overdueInvoices,
    isSolarWindow: ov.isSolarWindow,
  };
}

/**
 * Health Score a partir do overview. Sem `overview`, lê uma vez via
 * `getOperationalOverview()` (compatível com o uso anterior). Com `overview`
 * recebido, NÃO faz I/O (permite a página compartilhar uma única leitura).
 */
export async function getHealthScore(
  overview?: OperationalOverview,
): Promise<HealthScoreResult> {
  const ov = overview ?? (await getOperationalOverview());
  return computeHealthScore(healthInputFromOverview(ov));
}
