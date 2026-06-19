import { asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  clientes,
  contratos,
  distribuidoras,
  faturas,
  medicoesGeracao,
  propostas,
  unidadesConsumidoras,
  usinas,
} from "@/lib/db/schema";
import { callSolis } from "@/lib/soliscloud/client";
import { getSolisCredentials } from "@/lib/soliscloud/credentials";
import { SOLIS_ENDPOINTS } from "@/lib/soliscloud/endpoints";
import { extractRecords, mapStationRecord } from "@/lib/soliscloud/mappers";
import type { SolisPaged, SolisStationRecord } from "@/lib/soliscloud/types";
import type { SolisTelemetry } from "@/types/soliscloud";

export type Option = { value: string; label: string };

export function listDistribuidoras() {
  return getDb().select().from(distribuidoras).orderBy(asc(distribuidoras.nome));
}

export function listClientes() {
  return getDb().select().from(clientes).orderBy(asc(clientes.nome));
}

export function listUnidades() {
  return getDb()
    .select({
      id: unidadesConsumidoras.id,
      codigoInstalacao: unidadesConsumidoras.codigoInstalacao,
      consumoMedioKwh: unidadesConsumidoras.consumoMedioKwh,
      ativo: unidadesConsumidoras.ativo,
      clienteId: unidadesConsumidoras.clienteId,
      clienteNome: clientes.nome,
      distribuidoraId: unidadesConsumidoras.distribuidoraId,
      distribuidoraNome: distribuidoras.nome,
    })
    .from(unidadesConsumidoras)
    .leftJoin(clientes, eq(unidadesConsumidoras.clienteId, clientes.id))
    .leftJoin(
      distribuidoras,
      eq(unidadesConsumidoras.distribuidoraId, distribuidoras.id),
    )
    .orderBy(asc(unidadesConsumidoras.codigoInstalacao));
}

export function listUsinas() {
  return getDb()
    .select({
      id: usinas.id,
      nome: usinas.nome,
      codigoDigitalGrid: usinas.codigoDigitalGrid,
      stationIdSoliscloud: usinas.stationIdSoliscloud,
      potenciaKwp: usinas.potenciaKwp,
      geracaoEsperadaKwhMes: usinas.geracaoEsperadaKwhMes,
      status: usinas.status,
      distribuidoraId: usinas.distribuidoraId,
      distribuidoraNome: distribuidoras.nome,
    })
    .from(usinas)
    .leftJoin(distribuidoras, eq(usinas.distribuidoraId, distribuidoras.id))
    .orderBy(asc(usinas.nome));
}

export function listContratos() {
  return getDb()
    .select({
      id: contratos.id,
      clienteId: contratos.clienteId,
      clienteNome: clientes.nome,
      unidadeConsumidoraId: contratos.unidadeConsumidoraId,
      unidadeCodigo: unidadesConsumidoras.codigoInstalacao,
      usinaId: contratos.usinaId,
      usinaNome: usinas.nome,
      tarifaDistribuidora: contratos.tarifaDistribuidora,
      tarifaAscender: contratos.tarifaAscender,
      percentualDesconto: contratos.percentualDesconto,
      status: contratos.status,
    })
    .from(contratos)
    .leftJoin(clientes, eq(contratos.clienteId, clientes.id))
    .leftJoin(
      unidadesConsumidoras,
      eq(contratos.unidadeConsumidoraId, unidadesConsumidoras.id),
    )
    .leftJoin(usinas, eq(contratos.usinaId, usinas.id));
}

export function listFaturas() {
  return getDb()
    .select({
      id: faturas.id,
      clienteId: faturas.clienteId,
      clienteNome: clientes.nome,
      unidadeConsumidoraId: faturas.unidadeConsumidoraId,
      unidadeCodigo: unidadesConsumidoras.codigoInstalacao,
      usinaId: faturas.usinaId,
      usinaNome: usinas.nome,
      competencia: faturas.competencia,
      valorFatura: faturas.valorFatura,
      valorBoleto: faturas.valorBoleto,
      vencimento: faturas.vencimento,
      status: faturas.status,
      pagoEm: faturas.pagoEm,
      observacao: faturas.observacao,
    })
    .from(faturas)
    .leftJoin(clientes, eq(faturas.clienteId, clientes.id))
    .leftJoin(
      unidadesConsumidoras,
      eq(faturas.unidadeConsumidoraId, unidadesConsumidoras.id),
    )
    .leftJoin(usinas, eq(faturas.usinaId, usinas.id))
    .orderBy(desc(faturas.competencia), asc(clientes.nome));
}

export function listPropostas() {
  return getDb()
    .select({
      id: propostas.id,
      clienteId: propostas.clienteId,
      clienteNome: clientes.nome,
      unidadeConsumidoraId: propostas.unidadeConsumidoraId,
      unidadeCodigo: unidadesConsumidoras.codigoInstalacao,
      distribuidoraId: propostas.distribuidoraId,
      distribuidoraNome: distribuidoras.nome,
      consumoEstimadoKwh: propostas.consumoEstimadoKwh,
      tarifaDistribuidora: propostas.tarifaDistribuidora,
      tarifaAscender: propostas.tarifaAscender,
      status: propostas.status,
      observacao: propostas.observacao,
    })
    .from(propostas)
    .leftJoin(clientes, eq(propostas.clienteId, clientes.id))
    .leftJoin(
      unidadesConsumidoras,
      eq(propostas.unidadeConsumidoraId, unidadesConsumidoras.id),
    )
    .leftJoin(distribuidoras, eq(propostas.distribuidoraId, distribuidoras.id))
    .orderBy(asc(clientes.nome));
}

// ===== Histórico de geração (banco) e resumo financeiro =====

export async function getHistoricoGeracaoMensal() {
  const rows = await getDb()
    .select({
      competencia: medicoesGeracao.competencia,
      geracaoKwh: sql<number>`coalesce(sum(${medicoesGeracao.geracaoKwh}), 0)`,
      receita: sql<number>`coalesce(sum(${medicoesGeracao.receita}), 0)`,
    })
    .from(medicoesGeracao)
    .groupBy(medicoesGeracao.competencia)
    .orderBy(asc(medicoesGeracao.competencia));

  const porMes = rows.map((r) => ({
    competencia: r.competencia,
    geracaoKwh: Number(r.geracaoKwh),
    receita: Number(r.receita),
  }));
  const totalKwh = porMes.reduce((s, r) => s + r.geracaoKwh, 0);
  const totalReceita = porMes.reduce((s, r) => s + r.receita, 0);
  return { porMes, totalKwh, totalReceita };
}

export async function getResumoFaturas() {
  const rows = await getDb()
    .select({ status: faturas.status, valorBoleto: faturas.valorBoleto })
    .from(faturas);
  const total = rows.reduce((s, r) => s + (r.valorBoleto ?? 0), 0);
  const pago = rows
    .filter((r) => r.status === "pago")
    .reduce((s, r) => s + (r.valorBoleto ?? 0), 0);
  return { total, pago, emAberto: total - pago, qtd: rows.length };
}

// ===== Opções para selects (FKs) =====

export async function opcoesDistribuidoras(): Promise<Option[]> {
  const rows = await listDistribuidoras();
  return rows.map((d) => ({ value: d.id, label: d.nome }));
}

export async function opcoesClientes(): Promise<Option[]> {
  const rows = await listClientes();
  return rows.map((c) => ({ value: c.id, label: c.nome }));
}

export async function opcoesUnidades(): Promise<Option[]> {
  const rows = await getDb()
    .select({ id: unidadesConsumidoras.id, codigo: unidadesConsumidoras.codigoInstalacao })
    .from(unidadesConsumidoras)
    .orderBy(asc(unidadesConsumidoras.codigoInstalacao));
  return rows.map((u) => ({ value: u.id, label: u.codigo }));
}

export async function opcoesUsinas(): Promise<Option[]> {
  const rows = await getDb()
    .select({ id: usinas.id, nome: usinas.nome })
    .from(usinas)
    .orderBy(asc(usinas.nome));
  return rows.map((u) => ({ value: u.id, label: u.nome }));
}

/**
 * Lista as estações reais da conta SolisCloud (para vincular ao cadastro de
 * usina). Retorna vazio se a integração não estiver configurada ou falhar —
 * o cadastro continua funcionando com digitação livre.
 */
export async function opcoesEstacoesSolis(): Promise<Option[]> {
  try {
    const creds = await getSolisCredentials();
    if (!creds) return [];
    const data = await callSolis<SolisPaged<SolisStationRecord>>(
      creds,
      SOLIS_ENDPOINTS.userStationList,
      { pageNo: 1, pageSize: 100 },
    );
    return extractRecords(data).map((record) => {
      const id = String(record.id ?? record.stationId ?? record.sno ?? "");
      const name = record.name ?? record.stationName ?? id;
      return { value: id, label: `${name} (${id})` };
    });
  } catch {
    return [];
  }
}

// ===== Cruzamento usina (cadastro) × telemetria real (SolisCloud) =====

export async function getTelemetriaPorStation(): Promise<{
  configurada: boolean;
  mapa: Map<string, SolisTelemetry>;
}> {
  const mapa = new Map<string, SolisTelemetry>();
  const creds = await getSolisCredentials();
  if (!creds) return { configurada: false, mapa };
  try {
    const data = await callSolis<SolisPaged<SolisStationRecord>>(
      creds,
      SOLIS_ENDPOINTS.userStationList,
      { pageNo: 1, pageSize: 100 },
    );
    for (const rec of extractRecords(data)) {
      const t = mapStationRecord(rec);
      if (t.stationId) mapa.set(t.stationId, t);
    }
  } catch {
    /* mantém mapa vazio; a tela exibe aviso de indisponibilidade */
  }
  return { configurada: true, mapa };
}

export type UsinaCruzada = {
  id: string;
  nome: string;
  distribuidoraNome: string | null;
  potenciaKwp: number;
  status: string;
  stationIdSoliscloud: string | null;
  vinculada: boolean;
  estacaoNome: string | null;
  statusReal: string | null;
  potenciaAgoraKw: number | null;
  realizadoMesKwh: number | null;
  esperadoMesKwh: number | null;
  aderenciaPct: number | null;
};

export async function getUsinasComTelemetria(): Promise<{
  configurada: boolean;
  linhas: UsinaCruzada[];
}> {
  const [usinasCad, tele] = await Promise.all([
    listUsinas(),
    getTelemetriaPorStation(),
  ]);
  const linhas: UsinaCruzada[] = usinasCad.map((u) => {
    const t = u.stationIdSoliscloud
      ? tele.mapa.get(u.stationIdSoliscloud)
      : undefined;
    const realizado = t ? t.monthEnergyKwh : null;
    const esperado = u.geracaoEsperadaKwhMes || null;
    const aderencia =
      realizado != null && esperado ? (realizado / esperado) * 100 : null;
    return {
      id: u.id,
      nome: u.nome,
      distribuidoraNome: u.distribuidoraNome,
      potenciaKwp: u.potenciaKwp,
      status: u.status,
      stationIdSoliscloud: u.stationIdSoliscloud,
      vinculada: Boolean(t),
      estacaoNome: t?.stationName ?? null,
      statusReal: t?.state ?? null,
      potenciaAgoraKw: t?.currentPowerKw ?? null,
      realizadoMesKwh: realizado,
      esperadoMesKwh: esperado,
      aderenciaPct: aderencia,
    };
  });
  return { configurada: tele.configurada, linhas };
}
