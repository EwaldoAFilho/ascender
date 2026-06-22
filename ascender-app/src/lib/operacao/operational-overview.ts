import { contarFaturasVencidasDg } from "@/lib/digitalgrid/queries";
import {
  lerColetoresDoBanco,
  lerEstacoesDoBanco,
  ultimaTelemetriaEm,
} from "@/lib/soliscloud/telemetria-db";
import type { DeviceState } from "@/types/soliscloud";

// Janela solar APROXIMADA no fuso de São Paulo. [aproximação] — não há
// coordenadas por usina no schema; usamos um intervalo amplo e conservador para
// NÃO mascarar falhas reais (às 17:50 ainda é "dia").
export const SOLAR_WINDOW = { startHour: 6, endHour: 18 } as const;

export type OverviewPlant = {
  stationId: string;
  name: string;
  state: DeviceState;
  updateTime?: string;
};

export type OverviewCollector = {
  sn: string;
  plantId?: string;
  state: DeviceState;
};

export type OperationalOverview = {
  /** Hora local de São Paulo dentro de [start,end) da janela solar aproximada. */
  isSolarWindow: boolean;
  solarWindow: { startHour: number; endHour: number };
  plants: OverviewPlant[];
  collectors: OverviewCollector[];
  collectorSummary: { total: number; online: number; offline: number; alarme: number };
  lastTelemetryIso: string | null;
  lastTelemetryAgeMinutes: number | null;
  overdueInvoices: number;
};

/**
 * `true` se `date` cai na janela solar aproximada (06:00–18:00, São Paulo).
 * Exposta para **simulação determinística** (sem depender do relógio do
 * servidor). Granularidade de HORA, intervalo **[06, 18)**: 06:00 = dia;
 * 18:00 = noite; 05:59 = noite; 17:59 = dia. Usa `formatToParts` (robusto em
 * Docker/Node com ICU completo, já usado no resto do app) e, se o `Intl` não
 * devolver a hora, assume **dia** (conservador — não mascara offline).
 */
export function isSolarWindowAt(date: Date): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(date);
  const raw = parts.find((p) => p.type === "hour")?.value;
  const hora = raw != null ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(hora)) return true; // [indefinido] → assume dia
  return hora >= SOLAR_WINDOW.startHour && hora < SOLAR_WINDOW.endHour;
}

/**
 * Única camada de I/O da operação: lê estações, coletores, última telemetria e
 * faturas vencidas **uma vez** e devolve um snapshot consumido por
 * `getHealthScore()` e `getIncidents()`. Inclui o contexto solar aproximado.
 */
export async function getOperationalOverview(): Promise<OperationalOverview> {
  const [estacoes, coletores, ultimaComm, vencidas] = await Promise.all([
    lerEstacoesDoBanco(),
    lerColetoresDoBanco(),
    ultimaTelemetriaEm(),
    contarFaturasVencidasDg().catch(() => 0),
  ]);

  const isSolarWindow = isSolarWindowAt(new Date());

  const lastTelemetryAgeMinutes = ultimaComm
    ? Math.max(
        0,
        Math.round((Date.now() - new Date(ultimaComm).getTime()) / 60000),
      )
    : null;

  return {
    isSolarWindow,
    solarWindow: { startHour: SOLAR_WINDOW.startHour, endHour: SOLAR_WINDOW.endHour },
    plants: estacoes.map((e) => ({
      stationId: e.stationId,
      name: e.stationName ?? e.stationId,
      state: e.state,
      updateTime: e.updateTime || undefined,
    })),
    collectors: coletores.coletores.map((c) => ({
      sn: c.sn,
      plantId: c.plantId || undefined,
      state: c.state,
    })),
    collectorSummary: coletores.resumo,
    lastTelemetryIso: ultimaComm,
    lastTelemetryAgeMinutes,
    overdueInvoices: vencidas ?? 0,
  };
}
