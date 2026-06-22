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

function horaSaoPaulo(date: Date): number {
  const s = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Sao_Paulo",
  }).format(date);
  return parseInt(s, 10);
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

  const hora = horaSaoPaulo(new Date());
  const isSolarWindow =
    hora >= SOLAR_WINDOW.startHour && hora < SOLAR_WINDOW.endHour;

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
