import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  alarmes,
  syncRuns,
  telemetriaColetor,
  telemetriaEstacao,
  telemetriaInversor,
  usinas,
} from "@/lib/db/schema";
import type { GenerationSeries } from "@/lib/api/soliscloud";
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

export type GeracaoDia = {
  dia: string; // "AAAA-MM-DD"
  realizado: number;
  esperado: number;
  aderenciaPct: number | null;
};

/**
 * Geração realizada por dia (frota) × meta diária, dos últimos `dias`. O
 * realizado vem do pico de `energia_dia_kwh` por estação/dia (acumulado do dia)
 * somado entre estações; a meta diária é a soma das metas mensais / 30.
 */
export async function geracaoDiariaFrota(dias = 14): Promise<GeracaoDia[]> {
  const db = getDb();
  const [m] = await db
    .select({
      meta: sql<number>`coalesce(sum(${usinas.geracaoEsperadaKwhMes}), 0)`,
    })
    .from(usinas);
  const esperadoDia = Number(m?.meta ?? 0) / 30;

  // Realizado por dia = pico de energia_dia_kwh (acumulado do dia) por estação,
  // somado entre estações. SQL bruto (Postgres padrão) para a subconsulta.
  const res = await db.execute(sql`
    SELECT to_char(d, 'YYYY-MM-DD') AS dia, sum(maxdia)::float8 AS realizado
    FROM (
      SELECT station_id,
             (capturado_em AT TIME ZONE 'America/Sao_Paulo')::date AS d,
             max(energia_dia_kwh) AS maxdia
      FROM telemetria_estacao
      WHERE capturado_em > now() - make_interval(days => ${dias})
      GROUP BY station_id, (capturado_em AT TIME ZONE 'America/Sao_Paulo')::date
    ) sub
    GROUP BY d
    ORDER BY d
  `);
  const rows = res.rows as Array<{ dia: string; realizado: number }>;

  return rows.map((r) => {
    const realizado = Number(r.realizado);
    return {
      dia: r.dia,
      realizado,
      esperado: esperadoDia,
      aderenciaPct: esperadoDia > 0 ? (realizado / esperadoDia) * 100 : null,
    };
  });
}

/**
 * Curva de geração de uma estação, lida do banco (sync-first):
 * - day  → potência por horário, dos snapshots de hoje (kW);
 * - month→ geração por dia do mês (pico de energia_dia por dia), dos snapshots;
 * - year → geração mensal do ano, de medicoes_geracao.
 * Tudo no fuso de São Paulo, sempre o período corrente.
 */
export async function curvaGeracaoBanco(
  stationId: string,
  period: "day" | "month" | "year",
): Promise<GenerationSeries> {
  const db = getDb();

  if (period === "year") {
    const res = await db.execute(sql`
      SELECT to_char(to_date(m.competencia, 'YYYY-MM'), 'MM/YYYY') AS label,
             m.geracao_kwh::float8 AS value,
             m.receita::float8 AS money
      FROM medicoes_geracao m
      JOIN usinas u ON u.id = m.usina_id
      WHERE u.station_id_soliscloud = ${stationId}
        AND m.competencia LIKE to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY') || '-%'
      ORDER BY m.competencia
    `);
    const points = (
      res.rows as Array<{ label: string; value: number; money: number | null }>
    ).map((r) => ({
      label: r.label,
      value: Number(r.value),
      money: r.money == null ? null : Number(r.money),
    }));
    return {
      period,
      unit: "kWh",
      points,
      totalKwh: points.reduce((s, p) => s + p.value, 0),
      totalMoney: points.some((p) => p.money != null)
        ? points.reduce((s, p) => s + (p.money ?? 0), 0)
        : null,
      peakKw: null,
    };
  }

  if (period === "month") {
    const res = await db.execute(sql`
      SELECT to_char(d, 'DD') AS label, maxdia::float8 AS value
      FROM (
        SELECT (capturado_em AT TIME ZONE 'America/Sao_Paulo')::date AS d,
               max(energia_dia_kwh) AS maxdia
        FROM telemetria_estacao
        WHERE station_id = ${stationId}
          AND to_char(capturado_em AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM')
              = to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM')
        GROUP BY (capturado_em AT TIME ZONE 'America/Sao_Paulo')::date
      ) sub ORDER BY d
    `);
    const points = (res.rows as Array<{ label: string; value: number }>).map(
      (r) => ({ label: r.label, value: Number(r.value), money: null }),
    );
    return {
      period,
      unit: "kWh",
      points,
      totalKwh: points.reduce((s, p) => s + p.value, 0),
      totalMoney: null,
      peakKw: null,
    };
  }

  // day — grade fixa de 00:00 a 23:45 (buckets de 15 min) no fuso de São Paulo,
  // para o eixo cobrir o dia inteiro (meia-noite a meia-noite). Cada bucket leva
  // a média da potência dos snapshots que caíram nele; buckets sem leitura ficam
  // NULL (lacuna no gráfico). Na operação normal o worker captura a noite com
  // potência 0, formando a base; só fica vazio onde realmente não há dado.
  const res = await db.execute(sql`
    WITH lim AS (
      SELECT date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AS dia_ini
    ),
    grade AS (
      SELECT gs AS bucket
      FROM lim, generate_series(
        (SELECT dia_ini FROM lim),
        (SELECT dia_ini FROM lim) + interval '1 day' - interval '15 min',
        interval '15 min'
      ) AS gs
    ),
    snaps AS (
      SELECT (SELECT dia_ini FROM lim)
             + floor(extract(epoch FROM
                 ((capturado_em AT TIME ZONE 'America/Sao_Paulo')
                  - (SELECT dia_ini FROM lim))) / 900) * interval '15 min' AS bucket,
             avg(potencia_kw) AS value
      FROM telemetria_estacao
      WHERE station_id = ${stationId}
        AND (capturado_em AT TIME ZONE 'America/Sao_Paulo')::date
            = (SELECT dia_ini FROM lim)::date
      GROUP BY 1
    )
    SELECT to_char(g.bucket, 'HH24:MI') AS label, s.value::float8 AS value
    FROM grade g
    LEFT JOIN snaps s ON s.bucket = g.bucket
    ORDER BY g.bucket
  `);
  const points = (
    res.rows as Array<{ label: string; value: number | null }>
  ).map((r) => ({
    label: r.label,
    value: r.value == null ? null : Number(r.value),
    money: null,
  }));
  return {
    period,
    unit: "kW",
    points,
    totalKwh: null,
    totalMoney: null,
    peakKw: points.reduce(
      (m, p) => (p.value != null && p.value > m ? p.value : m),
      0,
    ),
  };
}

export type UptimeColetor = {
  sn: string;
  usinaNome: string;
  total: number;
  online: number;
  pct: number;
};

/**
 * Disponibilidade (uptime) de cada coletor nas últimas `horas`: fração dos
 * snapshots em que esteve "online". Só o histórico permite — cresce com o tempo.
 */
export async function uptimeColetores(horas = 24): Promise<UptimeColetor[]> {
  const db = getDb();
  const rows = await db
    .select({
      sn: telemetriaColetor.sn,
      usinaNome: usinas.nome,
      total: sql<number>`count(*)`,
      online: sql<number>`count(*) filter (where ${telemetriaColetor.estado} = 'online')`,
    })
    .from(telemetriaColetor)
    .leftJoin(usinas, eq(usinas.id, telemetriaColetor.usinaId))
    .where(sql`${telemetriaColetor.capturadoEm} > now() - make_interval(hours => ${horas})`)
    .groupBy(telemetriaColetor.sn, usinas.nome)
    .orderBy(telemetriaColetor.sn);

  return rows.map((r) => {
    const total = Number(r.total);
    const online = Number(r.online);
    return {
      sn: r.sn,
      usinaNome: r.usinaNome ?? "—",
      total,
      online,
      pct: total > 0 ? (online / total) * 100 : 0,
    };
  });
}

export type AlarmeHistorico = {
  alarmId: string;
  usinaNome: string;
  deviceSn: string;
  nivel: string;
  mensagem: string;
  status: string;
  atualizadoEm: string | null;
  resolvidoEm: string | null;
};

export type SyncRunRecente = {
  id: string;
  job: string;
  status: string; // ok | erro
  iniciadoEm: string;
  terminadoEm: string | null;
  itens: number;
  mensagem: string | null;
};

/** Execuções recentes dos workers (sync_runs), mais recentes primeiro. */
export async function listarSyncRunsRecentes(
  limite = 8,
): Promise<SyncRunRecente[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: syncRuns.id,
      job: syncRuns.job,
      status: syncRuns.status,
      iniciadoEm: syncRuns.iniciadoEm,
      terminadoEm: syncRuns.terminadoEm,
      itens: syncRuns.itens,
      mensagem: syncRuns.mensagem,
    })
    .from(syncRuns)
    .orderBy(desc(syncRuns.iniciadoEm))
    .limit(limite);

  return rows.map((r) => ({
    id: r.id,
    job: r.job,
    status: r.status,
    iniciadoEm: new Date(r.iniciadoEm).toISOString(),
    terminadoEm: r.terminadoEm ? new Date(r.terminadoEm).toISOString() : null,
    itens: r.itens,
    mensagem: r.mensagem,
  }));
}

/** Linha do tempo de alarmes (todos os que já existiram), mais recentes no topo. */
export async function historicoAlarmes(limite = 60): Promise<AlarmeHistorico[]> {
  const db = getDb();
  const rows = await db
    .select({
      alarmId: alarmes.alarmId,
      usinaNome: usinas.nome,
      deviceSn: alarmes.deviceSn,
      nivel: alarmes.nivel,
      mensagem: alarmes.mensagem,
      status: alarmes.status,
      atualizadoEm: alarmes.atualizadoEm,
      resolvidoEm: alarmes.resolvidoEm,
    })
    .from(alarmes)
    .leftJoin(usinas, eq(usinas.id, alarmes.usinaId))
    .orderBy(desc(alarmes.atualizadoEm))
    .limit(limite);

  return rows.map((r) => ({
    alarmId: r.alarmId,
    usinaNome: r.usinaNome ?? "—",
    deviceSn: r.deviceSn ?? "",
    nivel: r.nivel,
    mensagem: r.mensagem ?? "",
    status: r.status,
    atualizadoEm: r.atualizadoEm ? new Date(r.atualizadoEm).toISOString() : null,
    resolvidoEm: r.resolvidoEm ? new Date(r.resolvidoEm).toISOString() : null,
  }));
}

function fmtHora(d: Date | null | undefined): string {
  if (!d) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(d);
  } catch {
    return "";
  }
}

/**
 * Curva de potência da frota nas últimas `horas` — soma a potência de todas as
 * estações por ciclo de coleta (cada ciclo grava com um mesmo `capturado_em`).
 * Só o histórico permite isso; cresce conforme o worker roda.
 */
export async function historicoPotenciaFrota(
  horas = 24,
): Promise<GenerationSeries> {
  const db = getDb();
  const rows = await db
    .select({
      capt: telemetriaEstacao.capturadoEm,
      total: sql<number>`sum(${telemetriaEstacao.potenciaKw})`,
    })
    .from(telemetriaEstacao)
    .where(sql`${telemetriaEstacao.capturadoEm} > now() - make_interval(hours => ${horas})`)
    .groupBy(telemetriaEstacao.capturadoEm)
    .orderBy(telemetriaEstacao.capturadoEm);

  const points = rows.map((r) => ({
    label: fmtHora(new Date(r.capt)),
    value: Number(r.total),
    money: null,
  }));
  const peakKw = points.reduce((m, p) => Math.max(m, p.value), 0);

  return {
    period: "day",
    unit: "kW",
    points,
    totalKwh: null,
    totalMoney: null,
    peakKw,
  };
}
