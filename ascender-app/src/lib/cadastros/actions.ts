"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
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
  try {
    if (id) {
      await getDb()
        .update(distribuidoras)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(distribuidoras.id, id));
    } else {
      await getDb().insert(distribuidoras).values(data);
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
  try {
    await getDb().delete(distribuidoras).where(eq(distribuidoras.id, id));
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
});

export async function saveCliente(input: unknown): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { id, ...data } = parsed.data;
  try {
    if (id) {
      await getDb()
        .update(clientes)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(clientes.id, id));
    } else {
      await getDb().insert(clientes).values(data);
    }
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao salvar cliente." };
  }
}

export async function deleteCliente(id: string): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  try {
    await getDb().delete(clientes).where(eq(clientes.id, id));
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
  try {
    if (id) {
      await getDb()
        .update(unidadesConsumidoras)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(unidadesConsumidoras.id, id));
    } else {
      await getDb().insert(unidadesConsumidoras).values(data);
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
  try {
    await getDb()
      .delete(unidadesConsumidoras)
      .where(eq(unidadesConsumidoras.id, id));
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
});

export async function saveUsina(input: unknown): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;
  const parsed = usinaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { id, ...data } = parsed.data;
  try {
    if (id) {
      await getDb()
        .update(usinas)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(usinas.id, id));
    } else {
      await getDb().insert(usinas).values(data);
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
  try {
    await getDb().delete(usinas).where(eq(usinas.id, id));
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
  try {
    if (id) {
      await getDb()
        .update(contratos)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(contratos.id, id));
    } else {
      await getDb().insert(contratos).values(data);
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
  try {
    await getDb().delete(contratos).where(eq(contratos.id, id));
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
  try {
    if (id) {
      await getDb()
        .update(faturas)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(faturas.id, id));
    } else {
      await getDb().insert(faturas).values(data);
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
  try {
    await getDb().delete(faturas).where(eq(faturas.id, id));
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
  try {
    if (id) {
      await getDb()
        .update(propostas)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(propostas.id, id));
    } else {
      await getDb().insert(propostas).values(data);
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
  try {
    await getDb().delete(propostas).where(eq(propostas.id, id));
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
    const result = await importStationsFromSolis();
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
    const result = await runImportarCadastrosDg();
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
