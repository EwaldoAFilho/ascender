import { getDb } from "@/lib/db";
import {
  alarmes,
  telemetriaColetor,
  telemetriaEstacao,
  telemetriaInversor,
  usinas,
} from "@/lib/db/schema";
import { callSolis } from "./client";
import { getSolisCredentials } from "./credentials";
import { SOLIS_ENDPOINTS } from "./endpoints";
import {
  extractRecords,
  mapAlarmRecord,
  mapCollectorRecord,
  mapInverterRecord,
  mapStationRecord,
} from "./mappers";
import type {
  SolisAlarmRecord,
  SolisCollectorRecord,
  SolisInverterRecord,
  SolisPaged,
  SolisStationRecord,
} from "./types";

export type TelemetriaSyncResult = {
  estacoes: number;
  inversores: number;
  coletores: number;
  alarmes: number;
};

const noCache = { cache: false } as const;
const page = { pageNo: 1, pageSize: 100 } as const;

/**
 * Coleta a telemetria atual da SolisCloud (estações, inversores, coletores e
 * alarmes) e grava no banco. Append-only nas séries (uma leitura por ciclo);
 * upsert nos alarmes (1 linha por alarme, com status/resolução). Sem cache — o
 * worker quer o dado fresco a cada ciclo. Somente leitura na SolisCloud.
 */
export async function syncTelemetria(): Promise<TelemetriaSyncResult> {
  const creds = await getSolisCredentials();
  if (!creds) throw new Error("Integração SolisCloud não configurada.");

  const db = getDb();
  const capturadoEm = new Date();

  // stationId -> usinaId (vincula as leituras às usinas cadastradas)
  const usinasCad = await db
    .select({ id: usinas.id, station: usinas.stationIdSoliscloud })
    .from(usinas);
  const usinaPorStation = new Map<string, string>();
  for (const u of usinasCad) if (u.station) usinaPorStation.set(u.station, u.id);

  // 1) Estações
  const stData = await callSolis<SolisPaged<SolisStationRecord>>(
    creds,
    SOLIS_ENDPOINTS.userStationList,
    page,
    noCache,
  );
  const estacoes = extractRecords(stData)
    .map(mapStationRecord)
    .filter((t) => t.stationId);
  if (estacoes.length > 0) {
    await db.insert(telemetriaEstacao).values(
      estacoes.map((t) => ({
        usinaId: usinaPorStation.get(t.stationId) ?? null,
        stationId: t.stationId,
        estado: t.state,
        potenciaKw: t.currentPowerKw,
        energiaDiaKwh: t.dayEnergyKwh,
        energiaMesKwh: t.monthEnergyKwh,
        energiaAnoKwh: t.yearEnergyKwh,
        energiaTotalKwh: t.allEnergyKwh,
        capturadoEm,
      })),
    );
  }

  // 2) Inversores
  const invData = await callSolis<SolisPaged<SolisInverterRecord>>(
    creds,
    SOLIS_ENDPOINTS.inverterList,
    page,
    noCache,
  );
  const inversores = extractRecords(invData)
    .map(mapInverterRecord)
    .filter((i) => i.serialNumber);
  if (inversores.length > 0) {
    await db.insert(telemetriaInversor).values(
      inversores.map((i) => ({
        usinaId: usinaPorStation.get(i.plantId) ?? null,
        stationId: i.plantId || null,
        serial: i.serialNumber,
        estado: i.state,
        potenciaKw: i.currentPowerKw,
        energiaDiaKwh: i.todayEnergyKwh,
        energiaTotalKwh: i.totalEnergyKwh,
        temperaturaC: i.temperatureC,
        capturadoEm,
      })),
    );
  }

  // 3) Coletores
  const colData = await callSolis<SolisPaged<SolisCollectorRecord>>(
    creds,
    SOLIS_ENDPOINTS.collectorList,
    page,
    noCache,
  );
  const coletores = extractRecords(colData)
    .map(mapCollectorRecord)
    .filter((c) => c.sn);
  if (coletores.length > 0) {
    await db.insert(telemetriaColetor).values(
      coletores.map((c) => ({
        usinaId: usinaPorStation.get(c.plantId) ?? null,
        stationId: c.plantId || null,
        sn: c.sn,
        estado: c.state,
        ultimaComunicacao: c.updateTime || null,
        modelo: c.model,
        capturadoEm,
      })),
    );
  }

  // 4) Alarmes — a SolisCloud costuma mandar id = -1, então a chave única do
  // evento é composta (estação|device|código|início). Deduplica no lote e faz
  // upsert: mantém o histórico de tudo que já alarmou e marca a resolução.
  const alData = await callSolis<SolisPaged<SolisAlarmRecord>>(
    creds,
    SOLIS_ENDPOINTS.alarmList,
    page,
    noCache,
  );
  const alarmesPorChave = new Map<string, typeof alarmes.$inferInsert>();
  for (const rec of extractRecords(alData)) {
    const a = mapAlarmRecord(rec);
    const realId = String(rec.id ?? rec.alarmId ?? "");
    const composta = [
      rec.stationId,
      rec.alarmDeviceSn ?? rec.deviceSn ?? rec.sn,
      rec.alarmCode,
      rec.alarmBegTime,
    ]
      .filter((x) => x != null && x !== "")
      .join("|");
    const chave =
      realId && realId !== "-1" && realId !== "0" ? realId : composta;
    if (!chave) continue;
    alarmesPorChave.set(chave, {
      alarmId: chave,
      usinaId: usinaPorStation.get(a.plantId) ?? null,
      stationId: a.plantId || null,
      deviceSn: a.deviceSerialNumber || null,
      nivel: a.level,
      mensagem: a.message,
      iniciadoEm: a.startedAt || null,
      status: a.status,
      vistoEm: capturadoEm,
      atualizadoEm: capturadoEm,
      resolvidoEm: a.status === "resolvido" ? capturadoEm : null,
    });
  }
  for (const row of alarmesPorChave.values()) {
    await db
      .insert(alarmes)
      .values(row)
      .onConflictDoUpdate({
        target: alarmes.alarmId,
        set: {
          status: row.status,
          nivel: row.nivel,
          mensagem: row.mensagem,
          atualizadoEm: capturadoEm,
          resolvidoEm: row.resolvidoEm,
        },
      });
  }

  return {
    estacoes: estacoes.length,
    inversores: inversores.length,
    coletores: coletores.length,
    alarmes: alarmesPorChave.size,
  };
}
