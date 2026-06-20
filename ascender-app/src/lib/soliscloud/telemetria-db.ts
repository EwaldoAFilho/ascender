import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  alarmes,
  telemetriaColetor,
  telemetriaEstacao,
  telemetriaInversor,
  usinas,
} from "@/lib/db/schema";
import type {
  AlarmLevel,
  Collector,
  CollectorMonitor,
  DeviceState,
  InverterTelemetry,
  SolisAlarm,
  SolisTelemetry,
} from "@/types/soliscloud";

// Leitura da telemetria a partir do banco (o worker `sync-telemetria` mantém
// atualizado). O "estado atual" é o registro mais recente por entidade
// (DISTINCT ON). As telas leem daqui — não batem mais na SolisCloud ao vivo.

function fmt(d: Date | null | undefined): string {
  if (!d) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(d);
  } catch {
    return "";
  }
}

export async function lerEstacoesDoBanco(): Promise<SolisTelemetry[]> {
  const db = getDb();
  const rows = await db
    .selectDistinctOn([telemetriaEstacao.stationId], {
      stationId: telemetriaEstacao.stationId,
      estado: telemetriaEstacao.estado,
      potenciaKw: telemetriaEstacao.potenciaKw,
      dia: telemetriaEstacao.energiaDiaKwh,
      mes: telemetriaEstacao.energiaMesKwh,
      ano: telemetriaEstacao.energiaAnoKwh,
      total: telemetriaEstacao.energiaTotalKwh,
      capturadoEm: telemetriaEstacao.capturadoEm,
      usinaNome: usinas.nome,
    })
    .from(telemetriaEstacao)
    .leftJoin(usinas, eq(usinas.id, telemetriaEstacao.usinaId))
    .orderBy(telemetriaEstacao.stationId, desc(telemetriaEstacao.capturadoEm));

  return rows.map((r) => ({
    plantId: r.stationId,
    stationId: r.stationId,
    stationName: r.usinaNome ?? r.stationId,
    updateTime: fmt(r.capturadoEm),
    state: r.estado as DeviceState,
    currentPowerKw: r.potenciaKw,
    dayEnergyKwh: r.dia,
    monthEnergyKwh: r.mes,
    yearEnergyKwh: r.ano,
    allEnergyKwh: r.total,
    expectedMonthEnergyKwh: 0,
    gridSellEnergyKwh: 0,
    gridPurchasedEnergyKwh: 0,
    homeLoadEnergyKwh: 0,
  }));
}

export async function lerInversoresDoBanco(): Promise<InverterTelemetry[]> {
  const db = getDb();
  const rows = await db
    .selectDistinctOn([telemetriaInversor.serial], {
      serial: telemetriaInversor.serial,
      stationId: telemetriaInversor.stationId,
      estado: telemetriaInversor.estado,
      potenciaKw: telemetriaInversor.potenciaKw,
      dia: telemetriaInversor.energiaDiaKwh,
      total: telemetriaInversor.energiaTotalKwh,
      temp: telemetriaInversor.temperaturaC,
      capturadoEm: telemetriaInversor.capturadoEm,
    })
    .from(telemetriaInversor)
    .orderBy(telemetriaInversor.serial, desc(telemetriaInversor.capturadoEm));

  return rows.map((r) => ({
    id: r.serial,
    plantId: r.stationId ?? "",
    serialNumber: r.serial,
    state: r.estado as DeviceState,
    currentPowerKw: r.potenciaKw,
    todayEnergyKwh: r.dia,
    totalEnergyKwh: r.total,
    temperatureC: r.temp,
    lastUpdate: fmt(r.capturadoEm),
  }));
}

export async function lerColetoresDoBanco(): Promise<CollectorMonitor> {
  const db = getDb();
  const rows = await db
    .selectDistinctOn([telemetriaColetor.sn], {
      sn: telemetriaColetor.sn,
      stationId: telemetriaColetor.stationId,
      estado: telemetriaColetor.estado,
      ultimaComunicacao: telemetriaColetor.ultimaComunicacao,
      modelo: telemetriaColetor.modelo,
      capturadoEm: telemetriaColetor.capturadoEm,
    })
    .from(telemetriaColetor)
    .orderBy(telemetriaColetor.sn, desc(telemetriaColetor.capturadoEm));

  const coletores: Collector[] = rows.map((r) => ({
    sn: r.sn,
    plantId: r.stationId ?? "",
    state: r.estado as DeviceState,
    updateTime: r.ultimaComunicacao || fmt(r.capturadoEm),
    model: r.modelo,
  }));

  return {
    resumo: {
      total: coletores.length,
      online: coletores.filter((c) => c.state === "online").length,
      offline: coletores.filter((c) => c.state === "offline").length,
      alarme: coletores.filter((c) => c.state === "alarm").length,
    },
    coletores,
  };
}

export async function lerAlarmesDoBanco(): Promise<SolisAlarm[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(alarmes)
    .orderBy(desc(alarmes.atualizadoEm));

  return rows.map((r) => ({
    id: r.alarmId,
    plantId: r.stationId ?? "",
    deviceSerialNumber: r.deviceSn ?? "",
    level: r.nivel as AlarmLevel,
    message: r.mensagem ?? "",
    startedAt: r.iniciadoEm ?? "",
    status: r.status as SolisAlarm["status"],
  }));
}

/** Momento da última coleta de telemetria (para "atualizado há X min"). */
export async function ultimaTelemetriaEm(): Promise<string | null> {
  const db = getDb();
  const [r] = await db
    .select({ at: sql<Date | null>`max(${telemetriaEstacao.capturadoEm})` })
    .from(telemetriaEstacao);
  return r?.at ? new Date(r.at).toISOString() : null;
}
