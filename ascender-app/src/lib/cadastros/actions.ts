"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { getSessionTenantId, withSessionTenant } from "@/lib/auth/tenant";
import { getDb } from "@/lib/db";
import {
  clientes,
  contratos,
  distribuidoras,
  faturas,
  propostas,
  unidadesConsumidoras,
  usinas,
} from "@/lib/db/schema";
import { importStationsFromSolis, type ImportResult } from "./sync";
import {
  importarCadastrosDg as runImportarCadastrosDg,
  type ConciliacaoResult,
} from "@/lib/digitalgrid/cadastros";
import { excluirAnexo, listarAnexos, type AnexoMeta } from "./anexos";
import {
  autorAtual,
  listarHistorico,
  registrarHistorico,
  type EntradaHistorico,
} from "./historico";
import type { CadastroHistorico } from "@/lib/db/schema";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function ensureAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session.authenticated) return { ok: false, error: "Não autenticado." };
  return null;
}

function revalidate() {
  revalidatePath("/cadastros", "layout");
}

function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos.";
}

// Texto opcional → null quando vazio.
const optText = z
  .string()
  .optional()
  .transform((v) => {
    const t = v?.trim();
    return t ? t : null;
  });

// Coordenada opcional: vazio → null; senão número finito dentro da faixa.
const optCoord = (min: number, max: number, nome: string) =>
  z.any().transform((v, ctx) => {
    if (v === null || v === undefined || String(v).trim() === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < min || n > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${nome} deve estar entre ${min} e ${max}.`,
      });
      return z.NEVER;
    }
    return n;
  });

// ===== Distribuidoras =====

const distribuidoraSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, "Informe o nome da distribuidora."),
  uf: optText,
});

export async function saveDistribuidora(input: unknown): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  const parsed = distribuidoraSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { id, ...data } = parsed.data;
  const tenantId = await getSessionTenantId();
  try {
    if (id) {
      await getDb()
        .update(distribuidoras)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(eq(distribuidoras.id, id), eq(distribuidoras.tenantId, tenantId)),
        );
    } else {
      await getDb()
        .insert(distribuidoras)
        .values({ ...data, tenantId });
    }
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao salvar (nome já existe?)." };
  }
}

export async function deleteDistribuidora(id: string): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  const tenantId = await getSessionTenantId();
  try {
    await getDb()
      .delete(distribuidoras)
      .where(
        and(eq(distribuidoras.id, id), eq(distribuidoras.tenantId, tenantId)),
      );
    revalidate();
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Não foi possível excluir (há UCs/usinas vinculadas?).",
    };
  }
}

// ===== Clientes =====

const clienteSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, "Informe o nome/razão social."),
  documento: z
    .string()
    .optional()
    .transform((v) => v?.trim() ?? ""),
  tipo: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : "cliente")),
  status: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : "ativo")),
  email: optText,
  responsavel: optText,
  dadosAdicionais: optText,
});

// Campos do cliente rastreados no histórico (chave → rótulo legível).
const CLIENTE_CAMPOS: [keyof typeof clienteSchema._output, string][] = [
  ["nome", "Nome"],
  ["documento", "Documento"],
  ["tipo", "Tipo"],
  ["status", "Status"],
  ["email", "E-mail"],
  ["responsavel", "Responsável"],
  ["dadosAdicionais", "Dados adicionais"],
];

const normValor = (v: unknown): string | null => {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
};

export async function saveCliente(input: unknown): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { id, ...data } = parsed.data;
  const { autor, autorId } = await autorAtual();
  const tenantId = await getSessionTenantId();
  try {
    if (id) {
      const [antes] = await getDb()
        .select()
        .from(clientes)
        .where(and(eq(clientes.id, id), eq(clientes.tenantId, tenantId)));
      await getDb()
        .update(clientes)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(clientes.id, id), eq(clientes.tenantId, tenantId)));
      if (antes) {
        const entradas: EntradaHistorico[] = [];
        for (const [campo, label] of CLIENTE_CAMPOS) {
          const before = normValor((antes as Record<string, unknown>)[campo]);
          const after = normValor((data as Record<string, unknown>)[campo]);
          if (before !== after) {
            entradas.push({
              entidade: "cliente",
              entidadeId: id,
              acao: "editou_campo",
              campo: label,
              valorAntes: before,
              valorDepois: after,
              autor,
              autorId,
            });
          }
        }
        await registrarHistorico(entradas);
      }
    } else {
      const [row] = await getDb()
        .insert(clientes)
        .values({ ...data, tenantId })
        .returning({ id: clientes.id });
      await registrarHistorico({
        entidade: "cliente",
        entidadeId: row.id,
        acao: "criou",
        detalhe: data.nome,
        autor,
        autorId,
      });
    }
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao salvar cliente." };
  }
}

// ===== Cliente · ficha (anexos + histórico) =====

export type FichaCliente = {
  anexos: AnexoMeta[];
  historico: CadastroHistorico[];
};

export async function getFichaCliente(
  clienteId: string,
): Promise<FichaCliente> {
  const auth = await ensureAuth();
  if (auth) return { anexos: [], historico: [] };
  // Escopa as leituras (anexos/histórico usam getCurrentTenantId) ao tenant da sessão.
  return withSessionTenant(async () => {
    const [anexosLista, historico] = await Promise.all([
      listarAnexos("cliente", clienteId),
      listarHistorico("cliente", clienteId),
    ]);
    return { anexos: anexosLista, historico };
  });
}

export async function excluirAnexoCliente(
  anexoId: string,
): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  try {
    await excluirAnexo(anexoId);
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir o anexo." };
  }
}

export async function deleteCliente(id: string): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  const tenantId = await getSessionTenantId();
  try {
    await getDb()
      .delete(clientes)
      .where(and(eq(clientes.id, id), eq(clientes.tenantId, tenantId)));
    revalidate();
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Não foi possível excluir (há UCs/contratos vinculados).",
    };
  }
}

// ===== Unidades consumidoras =====

const unidadeSchema = z.object({
  id: z.string().optional(),
  clienteId: z.string().trim().min(1, "Selecione o cliente."),
  codigoInstalacao: z.string().trim().min(1, "Informe o código de instalação."),
  distribuidoraId: optText,
  consumoMedioKwh: z.coerce.number().nonnegative().default(0),
});

export async function saveUnidade(input: unknown): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  const parsed = unidadeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { id, ...data } = parsed.data;
  const tenantId = await getSessionTenantId();
  try {
    if (id) {
      await getDb()
        .update(unidadesConsumidoras)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(unidadesConsumidoras.id, id),
            eq(unidadesConsumidoras.tenantId, tenantId),
          ),
        );
    } else {
      await getDb()
        .insert(unidadesConsumidoras)
        .values({ ...data, tenantId });
    }
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao salvar unidade consumidora." };
  }
}

export async function deleteUnidade(id: string): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  const tenantId = await getSessionTenantId();
  try {
    await getDb()
      .delete(unidadesConsumidoras)
      .where(
        and(
          eq(unidadesConsumidoras.id, id),
          eq(unidadesConsumidoras.tenantId, tenantId),
        ),
      );
    revalidate();
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Não foi possível excluir (há contratos vinculados).",
    };
  }
}

// ===== Usinas =====

const usinaSchema = z.object({
  id: z.string().optional(),
  nome: z.string().trim().min(1, "Informe o nome da usina."),
  distribuidoraId: optText,
  codigoDigitalGrid: optText,
  stationIdSoliscloud: optText,
  potenciaKwp: z.coerce.number().nonnegative().default(0),
  geracaoEsperadaKwhMes: z.coerce.number().nonnegative().default(0),
  status: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : "ativa")),
  endereco: optText,
  bairro: optText,
  estado: optText,
  cep: optText,
  codigoCliente: optText,
  codigoInstalacao: optText,
  modulos: optText,
  inversores: optText,
  latitude: optCoord(-90, 90, "Latitude"),
  longitude: optCoord(-180, 180, "Longitude"),
});

export async function saveUsina(input: unknown): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  const parsed = usinaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { id, ...data } = parsed.data;
  const tenantId = await getSessionTenantId();
  try {
    if (id) {
      await getDb()
        .update(usinas)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(usinas.id, id), eq(usinas.tenantId, tenantId)));
    } else {
      await getDb()
        .insert(usinas)
        .values({ ...data, tenantId });
    }
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao salvar usina." };
  }
}

export async function deleteUsina(id: string): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  const tenantId = await getSessionTenantId();
  try {
    await getDb()
      .delete(usinas)
      .where(and(eq(usinas.id, id), eq(usinas.tenantId, tenantId)));
    revalidate();
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Não foi possível excluir (há contratos vinculados).",
    };
  }
}

// ===== Contratos =====

const contratoSchema = z.object({
  id: z.string().optional(),
  clienteId: z.string().trim().min(1, "Selecione o cliente."),
  unidadeConsumidoraId: optText,
  usinaId: optText,
  tarifaDistribuidora: z.coerce.number().nonnegative().default(0),
  tarifaAscender: z.coerce.number().nonnegative().default(0),
  percentualDesconto: z.coerce.number().default(0),
  status: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : "simulacao")),
});

export async function saveContrato(input: unknown): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  const parsed = contratoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { id, ...data } = parsed.data;
  const tenantId = await getSessionTenantId();
  try {
    if (id) {
      await getDb()
        .update(contratos)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(contratos.id, id), eq(contratos.tenantId, tenantId)));
    } else {
      await getDb()
        .insert(contratos)
        .values({ ...data, tenantId });
    }
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao salvar contrato." };
  }
}

export async function deleteContrato(id: string): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  const tenantId = await getSessionTenantId();
  try {
    await getDb()
      .delete(contratos)
      .where(and(eq(contratos.id, id), eq(contratos.tenantId, tenantId)));
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir o contrato." };
  }
}

// ===== Faturas (financeiro manual) =====

const faturaSchema = z.object({
  id: z.string().optional(),
  clienteId: optText,
  unidadeConsumidoraId: optText,
  usinaId: optText,
  competencia: z.string().trim().min(1, "Informe a competência (ex.: 2026-06)."),
  valorFatura: z.coerce.number().nonnegative().default(0),
  valorBoleto: z.coerce.number().nonnegative().default(0),
  vencimento: optText,
  status: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : "aguardando")),
  pagoEm: optText,
  observacao: optText,
});

export async function saveFatura(input: unknown): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  const parsed = faturaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { id, ...data } = parsed.data;
  const tenantId = await getSessionTenantId();
  try {
    if (id) {
      await getDb()
        .update(faturas)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(faturas.id, id), eq(faturas.tenantId, tenantId)));
    } else {
      await getDb()
        .insert(faturas)
        .values({ ...data, tenantId });
    }
    revalidatePath("/financeiro");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao salvar fatura." };
  }
}

export async function deleteFatura(id: string): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  const tenantId = await getSessionTenantId();
  try {
    await getDb()
      .delete(faturas)
      .where(and(eq(faturas.id, id), eq(faturas.tenantId, tenantId)));
    revalidatePath("/financeiro");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir a fatura." };
  }
}

// ===== Propostas comerciais =====

const propostaSchema = z.object({
  id: z.string().optional(),
  clienteId: z.string().trim().min(1, "Selecione o cliente."),
  unidadeConsumidoraId: optText,
  distribuidoraId: optText,
  consumoEstimadoKwh: z.coerce.number().nonnegative().default(0),
  tarifaDistribuidora: z.coerce.number().nonnegative().default(0),
  tarifaAscender: z.coerce.number().nonnegative().default(0),
  status: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : "simulacao")),
  observacao: optText,
});

export async function saveProposta(input: unknown): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  const parsed = propostaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { id, ...data } = parsed.data;
  const tenantId = await getSessionTenantId();
  try {
    if (id) {
      await getDb()
        .update(propostas)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(propostas.id, id), eq(propostas.tenantId, tenantId)));
    } else {
      await getDb()
        .insert(propostas)
        .values({ ...data, tenantId });
    }
    revalidatePath("/propostas");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao salvar proposta." };
  }
}

export async function deleteProposta(id: string): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  const tenantId = await getSessionTenantId();
  try {
    await getDb()
      .delete(propostas)
      .where(and(eq(propostas.id, id), eq(propostas.tenantId, tenantId)));
    revalidatePath("/propostas");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir a proposta." };
  }
}

// ===== Importar usinas da SolisCloud =====

export async function importarUsinasSolis(): Promise<
  ActionResult & Partial<ImportResult>
> {
  const auth = await ensureAuth();
  if (auth) return auth;
  try {
    // Fixa o tenant da sessão: credenciais Solis e escrita em `usinas` escopadas.
    const result = await withSessionTenant(() => importStationsFromSolis());
    revalidate();
    return { ok: true, ...result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao importar.",
    };
  }
}

export async function importarCadastrosDg(): Promise<
  ActionResult & Partial<ConciliacaoResult>
> {
  const auth = await ensureAuth();
  if (auth) return auth;
  try {
    // Fixa o tenant da sessão: credenciais DG e escritas de conciliação escopadas.
    const result = await withSessionTenant(() => runImportarCadastrosDg());
    revalidate();
    return { ok: true, ...result };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Falha ao conciliar cadastros.",
    };
  }
}
