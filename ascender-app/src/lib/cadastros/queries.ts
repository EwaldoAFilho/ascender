import { asc, count, desc, eq, sql } from "drizzle-orm";
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
import { extractRecords } from "@/lib/soliscloud/mappers";
import { lerEstacoesDoBanco } from "@/lib/soliscloud/telemetria-db";
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
      endereco: usinas.endereco,
      bairro: usinas.bairro,
      estado: usinas.estado,
      cep: usinas.cep,
      codigoCliente: usinas.codigoCliente,
      codigoInstalacao: usinas.codigoInstalacao,
      modulos: usinas.modulos,
      inversores: usinas.inversores,
      latitude: usinas.latitude,
      longitude: usinas.longitude,
      origem: usinas.origem,
      origemSincronizadoEm: usinas.origemSincronizadoEm,
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

export type HeatmapGeracao = {
  competencias: string[]; // "AAAA-MM" ordenadas
  linhas: { usina: string; valores: (number | null)[] }[]; // por competência
};

/**
 * Geração mensal por usina (medicoes_geracao, [real]) montada como matriz
 * usina × competência para o heatmap. Célula sem registro = null ("sem dado",
 * não zero). Somente leitura.
 */
export async function geracaoPorUsinaMes(): Promise<HeatmapGeracao> {
  // Limita ao ano corrente (o sync de geração só traz o ano atual; sem o filtro,
  // ao virar o ano as colunas se acumulariam). Somente leitura.
  const ano = String(new Date().getFullYear());
  const rows = await getDb()
    .select({
      usina: usinas.nome,
      competencia: medicoesGeracao.competencia,
      geracaoKwh: sql<number>`coalesce(sum(${medicoesGeracao.geracaoKwh}), 0)`,
    })
    .from(medicoesGeracao)
    .innerJoin(usinas, eq(usinas.id, medicoesGeracao.usinaId))
    .where(sql`${medicoesGeracao.competencia} like ${`${ano}-%`}`)
    .groupBy(usinas.nome, medicoesGeracao.competencia)
    .orderBy(asc(usinas.nome), asc(medicoesGeracao.competencia));

  const competenciasSet = new Set<string>();
  const porUsina = new Map<string, Map<string, number>>();
  for (const r of rows) {
    competenciasSet.add(r.competencia);
    if (!porUsina.has(r.usina)) porUsina.set(r.usina, new Map());
    porUsina.get(r.usina)!.set(r.competencia, Number(r.geracaoKwh));
  }
  const competencias = [...competenciasSet].sort();
  const linhas = [...porUsina.entries()].map(([usina, mapa]) => ({
    usina,
    valores: competencias.map((c) => (mapa.has(c) ? (mapa.get(c) as number) : null)),
  }));
  return { competencias, linhas };
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

// ===== Resumo dos cadastros (contadores para o hub /cadastros) =====

export type CadastrosResumo = {
  usinas: { total: number; kwp: number; comSolis: number; comDg: number };
  clientes: { total: number; ativos: number };
  unidades: { total: number };
  contratos: { total: number; ativos: number };
  distribuidoras: { total: number };
};

/**
 * Contagens agregadas para a página inicial de Cadastros. Cinco selects
 * paralelos, cada um já agregado no banco (não traz linhas). Os agregados do
 * Postgres podem voltar como string no driver — daí o Number(...).
 */
export async function getCadastrosResumo(): Promise<CadastrosResumo> {
  const db = getDb();
  const [u, c, uc, ct, d] = await Promise.all([
    db
      .select({
        total: count(),
        kwp: sql<number>`coalesce(sum(${usinas.potenciaKwp}), 0)`,
        comSolis: sql<number>`count(${usinas.stationIdSoliscloud})`,
        comDg: sql<number>`count(${usinas.codigoDigitalGrid})`,
      })
      .from(usinas),
    db
      .select({
        total: count(),
        ativos: sql<number>`count(*) filter (where ${clientes.status} = 'ativo')`,
      })
      .from(clientes),
    db.select({ total: count() }).from(unidadesConsumidoras),
    db
      .select({
        total: count(),
        ativos: sql<number>`count(*) filter (where ${contratos.status} = 'ativo')`,
      })
      .from(contratos),
    db.select({ total: count() }).from(distribuidoras),
  ]);

  return {
    usinas: {
      total: Number(u[0].total),
      kwp: Number(u[0].kwp),
      comSolis: Number(u[0].comSolis),
      comDg: Number(u[0].comDg),
    },
    clientes: { total: Number(c[0].total), ativos: Number(c[0].ativos) },
    unidades: { total: Number(uc[0].total) },
    contratos: { total: Number(ct[0].total), ativos: Number(ct[0].ativos) },
    distribuidoras: { total: Number(d[0].total) },
  };
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
  // Lê a telemetria do banco (mantida pelo worker sync-telemetria), não da API
  // ao vivo — escala para muitos usuários e independe da latência da SolisCloud.
  const [creds, estacoes] = await Promise.all([
    getSolisCredentials(),
    lerEstacoesDoBanco(),
  ]);
  const mapa = new Map<string, SolisTelemetry>();
  for (const t of estacoes) mapa.set(t.stationId, t);
  return { configurada: Boolean(creds) || estacoes.length > 0, mapa };
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
  // Meta proporcional aos dias decorridos do mês corrente: o realizado é
  // acumulado do mês até hoje, então comparar com a meta cheia distorce a
  // aderência no início/meio do mês. Ajusta a meta para "até hoje".
  const agora = new Date();
  const diasNoMes = new Date(
    agora.getFullYear(),
    agora.getMonth() + 1,
    0,
  ).getDate();
  const fracaoMes = Math.min(agora.getDate() / diasNoMes, 1);

  const linhas: UsinaCruzada[] = usinasCad.map((u) => {
    const t = u.stationIdSoliscloud
      ? tele.mapa.get(u.stationIdSoliscloud)
      : undefined;
    const realizado = t ? t.monthEnergyKwh : null;
    const esperadoCheio = u.geracaoEsperadaKwhMes || null;
    // meta esperada até hoje (proporcional aos dias decorridos)
    const esperado = esperadoCheio != null ? esperadoCheio * fracaoMes : null;
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
