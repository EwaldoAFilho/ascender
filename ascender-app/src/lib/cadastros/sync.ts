import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/db/tenant-context";
import { medicoesGeracao, usinas } from "@/lib/db/schema";
import { callSolis } from "@/lib/soliscloud/client";
import { getSolisCredentials } from "@/lib/soliscloud/credentials";
import { SOLIS_ENDPOINTS } from "@/lib/soliscloud/endpoints";
import { extractRecords, mapStationRecord } from "@/lib/soliscloud/mappers";
import type {
  SolisPaged,
  SolisSeriesRecord,
  SolisStationRecord,
} from "@/lib/soliscloud/types";

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : 0;
  return Number.isFinite(n) ? n : 0;
}

export type ImportResult = {
  criadas: number;
  atualizadas: number;
  total: number;
};

/**
 * Importa as estações reais da conta SolisCloud para o cadastro de usinas,
 * fazendo upsert por `station_id_soliscloud`. Cria as que faltam (já vinculadas)
 * e atualiza o nome das existentes. Não toca em campos preenchidos manualmente
 * (distribuidora, potência, meta de geração).
 */
export async function importStationsFromSolis(): Promise<ImportResult> {
  const creds = await getSolisCredentials();
  if (!creds) throw new Error("Integração SolisCloud não configurada.");

  const data = await callSolis<SolisPaged<SolisStationRecord>>(
    creds,
    SOLIS_ENDPOINTS.userStationList,
    { pageNo: 1, pageSize: 100 },
  );

  const db = getDb();
  const tenantId = getCurrentTenantId();
  let criadas = 0;
  let atualizadas = 0;
  let total = 0;

  for (const rec of extractRecords(data)) {
    const t = mapStationRecord(rec);
    if (!t.stationId) continue;
    total++;
    const cap = num(rec.capacity);
    const potenciaKwp = (rec.capacityStr ?? "").toUpperCase().startsWith("M")
      ? cap * 1000
      : cap;
    const existing = await db
      .select({ id: usinas.id })
      .from(usinas)
      .where(
        and(
          eq(usinas.stationIdSoliscloud, t.stationId),
          eq(usinas.tenantId, tenantId),
        ),
      );
    if (existing.length > 0) {
      await db
        .update(usinas)
        .set({
          nome: t.stationName ?? t.stationId,
          potenciaKwp,
          origem: "soliscloud",
          origemSincronizadoEm: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(usinas.id, existing[0].id));
      atualizadas++;
    } else {
      await db.insert(usinas).values({
        tenantId,
        nome: t.stationName ?? t.stationId,
        stationIdSoliscloud: t.stationId,
        potenciaKwp,
        status: "ativa",
        origem: "soliscloud",
        origemSincronizadoEm: new Date(),
      });
      criadas++;
    }
  }

  return { criadas, atualizadas, total };
}

export type SyncGeracaoResult = {
  usinas: number;
  competencias: number;
};

/**
 * Sincroniza o histórico mensal de geração (e receita) por usina, para o ano
 * corrente, a partir do stationYear da SolisCloud. Faz upsert por
 * (usina, competência, fonte). `energy`/`money` já vêm em kWh/BRL base.
 */
export async function syncGeracaoMensal(): Promise<SyncGeracaoResult> {
  const creds = await getSolisCredentials();
  if (!creds) throw new Error("Integração SolisCloud não configurada.");

  const db = getDb();
  const tenantId = getCurrentTenantId();
  const lista = await db
    .select({ id: usinas.id, station: usinas.stationIdSoliscloud })
    .from(usinas)
    .where(eq(usinas.tenantId, tenantId));
  const ano = String(new Date().getFullYear());

  let usinasOk = 0;
  let competencias = 0;

  for (const u of lista) {
    if (!u.station) continue;
    const data = await callSolis<SolisPaged<SolisSeriesRecord>>(
      creds,
      SOLIS_ENDPOINTS.stationYear,
      { id: u.station, year: ano, money: "BRL" },
    );
    const recs = extractRecords(data);
    if (recs.length > 0) usinasOk++;
    for (const r of recs) {
      const competencia = String(r.dateStr ?? "");
      if (!competencia) continue;
      const geracaoKwh = num(r.energy);
      const receita = num(r.money);
      await db
        .insert(medicoesGeracao)
        .values({
          tenantId,
          usinaId: u.id,
          competencia,
          geracaoKwh,
          receita,
          fonte: "soliscloud",
          sincronizadoEm: new Date(),
        })
        .onConflictDoUpdate({
          target: [
            medicoesGeracao.tenantId,
            medicoesGeracao.usinaId,
            medicoesGeracao.competencia,
            medicoesGeracao.fonte,
          ],
          set: { geracaoKwh, receita, sincronizadoEm: new Date() },
        });
      competencias++;
    }
  }

  // Preenche a meta de geração (esperada) com a média do histórico, apenas onde
  // ainda não foi definida (= 0). Não sobrescreve metas ajustadas manualmente.
  await db.execute(sql`
    UPDATE usinas SET geracao_esperada_kwh_mes = sub.media
    FROM (
      SELECT usina_id, AVG(geracao_kwh) AS media
      FROM medicoes_geracao
      WHERE tenant_id = ${tenantId}
      GROUP BY usina_id
    ) sub
    WHERE usinas.id = sub.usina_id
      AND usinas.tenant_id = ${tenantId}
      AND usinas.geracao_esperada_kwh_mes = 0
  `);

  return { usinas: usinasOk, competencias };
}
