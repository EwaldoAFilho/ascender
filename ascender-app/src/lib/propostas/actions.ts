"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/rbac";
import { getSessionTenantId, withSessionTenant } from "@/lib/auth/tenant";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { clientes, parametrosProposta, propostas } from "@/lib/db/schema";
import { gerarResultado } from "./calcular";
import { carregarParametros } from "./parametros";
import type { GeradorInput, GeradorResultado, ModuloWp } from "./types";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type GerarPropostaResult =
  | { ok: true; id: string; resultado: GeradorResultado }
  | { ok: false; error: string };

const optText = z
  .string()
  .optional()
  .transform((v) => {
    const t = v?.trim();
    return t ? t : null;
  });

const telhadoSchema = z.object({
  largura: z.coerce.number().nonnegative().default(0),
  comprimento: z.coerce.number().nonnegative().default(0),
  aproveitamento: z.coerce.number().min(1).max(100).default(80),
});

const gerarSchema = z.object({
  // Cliente livre: aceita o nome digitado (cadastrado ou não). Se casar com um
  // cliente existente, a proposta é vinculada; senão guarda-se o nome livre.
  clienteNome: z.string().trim().min(1, "Informe o cliente."),
  responsavel: optText,
  cidade: optText,
  unidadeConsumidoraId: optText,
  distribuidoraId: optText,
  instalacao: z.enum(["telhado", "solo"]).default("telhado"),
  moduloWp: z.coerce.number().default(620),
  inversorForcado: z.enum(["auto", "string", "micro"]).default("auto"),
  consumoKwh: z.coerce.number().positive("Informe o consumo médio mensal."),
  compensacaoPct: z.coerce.number().positive().default(1),
  hsp: z.coerce.number().positive().default(5.5),
  tarifa: z.coerce.number().positive("Informe a tarifa (R$/kWh)."),
  telhados: z.array(telhadoSchema).default([]),
  adequacaoTrifasica: z.boolean().default(false),
  adequacaoValor: z.coerce.number().default(3500),
  padrao: z.enum(["mono", "bi", "tri"]).default("mono"),
  observacao: optText,
});

// Postgres double aceita 'Infinity', mas guardamos null para não poluir KPIs.
function finito(v: number): number | null {
  return Number.isFinite(v) ? v : null;
}

export async function gerarProposta(input: unknown): Promise<GerarPropostaResult> {
  const session = await getSession();
  if (!session.authenticated) return { ok: false, error: "Não autenticado." };
  // Gerar/gravar proposta é operação de negócio (usa custo/margem) → operador+.
  const deny = await requireRole("operador");
  if (deny) return deny;

  const parsed = gerarSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;
  const tenantId = await getSessionTenantId();

  const geradorInput: GeradorInput = {
    instalacao: d.instalacao,
    moduloWp: (d.moduloWp === 700 ? 700 : 620) as ModuloWp,
    inversorForcado: d.inversorForcado,
    consumoKwh: d.consumoKwh,
    compensacaoPct: d.compensacaoPct,
    hsp: d.hsp,
    tarifa: d.tarifa,
    telhados: d.telhados,
    adequacaoTrifasica: d.adequacaoTrifasica,
    adequacaoValor: d.adequacaoValor,
  };

  try {
    // Escopa a leitura das premissas (kit/custos/margem) ao tenant da sessão —
    // carregarParametros filtra por getCurrentTenantId, que sem contexto cai no T0.
    const parametros = await withSessionTenant(() => carregarParametros());
    const resultado = gerarResultado(geradorInput, parametros, new Date().getFullYear());
    const nec = resultado.necessario;

    // Cliente livre: se o nome casar (case-insensitive) com um cadastro, vincula;
    // senão guarda o nome livre e deixa clienteId nulo.
    const [existente] = await getDb()
      .select({ id: clientes.id })
      .from(clientes)
      .where(
        and(
          sql`lower(${clientes.nome}) = lower(${d.clienteNome})`,
          eq(clientes.tenantId, tenantId),
        ),
      )
      .limit(1);
    const clienteId = existente?.id ?? null;
    const clienteNomeLivre = existente ? null : d.clienteNome;

    const [row] = await getDb()
      .insert(propostas)
      .values({
        tenantId,
        clienteId,
        clienteNomeLivre,
        unidadeConsumidoraId: d.unidadeConsumidoraId,
        distribuidoraId: d.distribuidoraId,
        consumoEstimadoKwh: d.consumoKwh,
        tarifaDistribuidora: d.tarifa,
        tarifaAscender: 0,
        status: "simulacao",
        observacao: d.observacao,
        cenario: nec.cenario,
        potenciaKwp: nec.potenciaKwp,
        moduloWp: nec.moduloWp,
        qtdModulos: nec.qtdModulos,
        inversorTipo: nec.inversor.tipo,
        geracaoMensalKwh: nec.geracaoMensalKwh,
        precoFinal: finito(nec.precoFinal),
        precoPorKwp: finito(nec.precoPorKwp),
        paybackAnos: finito(nec.paybackAnos),
        tirPercent: finito(nec.tirPercent),
        economia25Anos: finito(nec.economia25Anos),
        co2Toneladas: finito(nec.co2Toneladas),
        custoTotal: finito(nec.custo.custoTotal),
        margemValor: finito(nec.custo.margemValor),
        margemPercent: finito(nec.custo.margemPercent),
        // Snapshot para reimpressão (uso interno; nunca vai ao PDF do cliente).
        dadosGerador: {
          input: geradorInput,
          resultado,
          padrao: d.padrao,
          responsavel: d.responsavel,
          cidade: d.cidade,
        },
      })
      .returning({ id: propostas.id });

    revalidatePath("/propostas");
    return { ok: true, id: row.id, resultado };
  } catch {
    return { ok: false, error: "Erro ao gerar/salvar a proposta." };
  }
}

// ===== Parâmetros de custo/margem (config) =====

const faixaKitSchema = z.object({
  kwpMax: z.coerce.number().positive(),
  precoMicro: z.coerce.number().nonnegative(),
  precoString: z.coerce.number().nonnegative(),
  trifasicoObrigatorio: z.boolean(),
});

const premissasSchema = z.object({
  performanceRatio: z.coerce.number().positive(),
  margemSeguranca: z.coerce.number().positive(),
  degradacaoAnual: z.coerce.number().min(0).max(1),
  reajusteTarifario: z.coerce.number().min(0).max(1),
  co2PorKwh: z.coerce.number().nonnegative(),
  creditoExcedenteBaseKwh: z.coerce.number().nonnegative(),
  fioBAtivo: z.boolean(),
  tarifaFioB: z.coerce.number().nonnegative(),
  anoBaseFioB: z.coerce.number().int(),
  cronogramaFioB: z.array(z.coerce.number().min(0).max(1)).min(1),
});

const parametrosSchema = z.object({
  kit: z.array(faixaKitSchema).min(1, "Informe ao menos uma faixa de kit."),
  ajusteString: z.coerce.number(),
  ajusteMicro: z.coerce.number(),
  maoDeObraKwp: z.coerce.number().nonnegative(),
  materialAcKwp: z.coerce.number().nonnegative(),
  materialAcMin: z.coerce.number().nonnegative(),
  impostoPercent: z.coerce.number().min(0).max(100),
  margemPercent: z.coerce.number().min(0).max(100),
  margemPercentRentavel: z.coerce.number().min(0).max(100),
  soloDescontoKitKwp: z.coerce.number().nonnegative(),
  estruturaSoloPorModulo: z.coerce.number().nonnegative(),
  dataTabela: z
    .string()
    .optional()
    .transform((v) => v?.trim() ?? ""),
  premissas: premissasSchema,
});

export async function salvarParametrosProposta(input: unknown): Promise<ActionResult> {
  const session = await getSession();
  if (!session.authenticated) return { ok: false, error: "Não autenticado." };
  // Preços/margem/premissas são sensíveis: só admin+ altera.
  const deny = await requireRole("admin");
  if (deny) return deny;

  const parsed = parametrosSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  // Ordena as faixas por teto de kWp (a busca de faixa depende disso).
  const dados = {
    ...parsed.data,
    kit: [...parsed.data.kit].sort((a, b) => a.kwpMax - b.kwpMax),
  };

  try {
    const db = getDb();
    const tenantId = await getSessionTenantId();
    const [existente] = await db
      .select({ id: parametrosProposta.id })
      .from(parametrosProposta)
      .where(eq(parametrosProposta.tenantId, tenantId))
      .limit(1);
    if (existente) {
      await db
        .update(parametrosProposta)
        .set({ dados, updatedAt: new Date() })
        .where(
          and(
            eq(parametrosProposta.id, existente.id),
            eq(parametrosProposta.tenantId, tenantId),
          ),
        );
    } else {
      await db.insert(parametrosProposta).values({ dados, tenantId });
    }
    revalidatePath("/configuracoes/proposta-precos");
    revalidatePath("/propostas/gerador");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao salvar os parâmetros." };
  }
}
