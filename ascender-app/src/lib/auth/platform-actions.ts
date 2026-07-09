"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TENANT0_ID } from "@/lib/db/schema";
import {
  criarEmpresaComDono,
  getTenant,
  mudarPlanoTenant,
  mudarStatusTenant,
  registrarAcessoOperador,
  requirePlatformAdmin,
} from "@/lib/auth/platform";
import { getSession } from "@/lib/auth/session";
import { emailEmUso } from "@/lib/auth/users";
import { ehViolacaoUnica } from "@/lib/db/erros";
import { getPlano } from "@/lib/plans";

export type ActionResult = { ok: true } | { ok: false; error: string };

const PATH = "/plataforma";

// Validação LENIENTE de tenantId (formato Postgres uuid, 8-4-4-4-12 hex). NÃO usar
// z.string().uuid(): o Zod v4 é estrito quanto ao RFC-4122 e rejeita o TENANT0_ID
// ("00000000-0000-0000-0000-000000000001", versão 0), que o Postgres aceita.
const tenantIdSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Empresa inválida.",
  );

const criarSchema = z.object({
  nomeEmpresa: z.string().min(2, "Informe o nome da empresa.").max(120),
  donoNome: z.string().min(2, "Informe o nome do responsável.").max(120),
  donoEmail: z.string().email("E-mail inválido.").max(254),
  donoSenha: z.string().min(8, "A senha deve ter ao menos 8 caracteres.").max(200),
  // Empresa criada manualmente entra em avaliação (trial) ou já ativa.
  status: z.enum(["trial", "ativo"]).optional().default("trial"),
});

/** Cria uma empresa (tenant) + o usuário dono. Restrito ao operador da plataforma. */
export async function criarEmpresaAction(
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const deny = await requirePlatformAdmin();
  if (deny) return deny;

  const parsed = criarSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }
  const { nomeEmpresa, donoNome, donoEmail, donoSenha, status } = parsed.data;

  if (await emailEmUso(donoEmail)) {
    return { ok: false, error: "Já existe um usuário com esse e-mail." };
  }

  try {
    await criarEmpresaComDono({
      nomeEmpresa,
      status,
      donoNome,
      donoEmail,
      donoSenha,
    });
  } catch (e) {
    console.error("[plataforma] erro ao criar empresa:", e);
    if (ehViolacaoUnica(e)) {
      return { ok: false, error: "Já existe uma conta com esse e-mail." };
    }
    return { ok: false, error: "Erro ao criar a empresa." };
  }
  revalidatePath(PATH);
  return { ok: true };
}

const statusSchema = z.object({
  tenantId: tenantIdSchema,
  status: z.enum(["pendente", "trial", "ativo", "suspenso", "cancelado"]),
});

/** Muda o status de uma empresa (aprovar/ativar/suspender/cancelar). Restrito ao operador. */
export async function mudarStatusAction(
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const deny = await requirePlatformAdmin();
  if (deny) return deny;

  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }
  const { tenantId, status } = parsed.data;

  // A própria Ascender (tenant 0) não pode ser suspensa/cancelada — evita
  // o operador se trancar para fora da plataforma.
  if (tenantId === TENANT0_ID) {
    return { ok: false, error: "A empresa da Ascender não pode ter o status alterado." };
  }

  try {
    await mudarStatusTenant(tenantId, status);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao alterar o status.",
    };
  }
  revalidatePath(PATH);
  return { ok: true };
}

const planoSchema = z.object({
  tenantId: tenantIdSchema,
  plano: z.string().min(1).max(40),
});

/** Muda o plano de assinatura de uma empresa. Restrito ao operador da plataforma. */
export async function mudarPlanoAction(
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const deny = await requirePlatformAdmin();
  if (deny) return deny;

  const parsed = planoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { tenantId, plano } = parsed.data;
  // A Ascender (tenant 0) fica no plano interno (ilimitado) — não pode ser posta
  // num plano limitado, o que travaria a criação de usinas na própria plataforma.
  if (tenantId === TENANT0_ID) {
    return { ok: false, error: "O plano da Ascender não pode ser alterado." };
  }
  if (!(await getPlano(plano))) {
    return { ok: false, error: "Plano inválido." };
  }
  try {
    await mudarPlanoTenant(tenantId, plano);
  } catch (e) {
    console.error("[plataforma] erro ao mudar plano:", e);
    return { ok: false, error: "Erro ao alterar o plano." };
  }
  revalidatePath(PATH);
  return { ok: true };
}

const acessarSchema = z.object({ tenantId: tenantIdSchema });

/**
 * "Acessar empresa": o operador passa a operar dentro de uma empresa (impersonar).
 * A sessão aponta para o tenant acessado (papel efetivo `owner`) e o acesso é
 * registrado na auditoria. Restrito ao operador da plataforma.
 */
export async function acessarEmpresaAction(
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const deny = await requirePlatformAdmin();
  if (deny) return deny;

  const parsed = acessarSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { tenantId } = parsed.data;

  const empresa = await getTenant(tenantId);
  if (!empresa) return { ok: false, error: "Empresa não encontrada." };

  const session = await getSession();
  session.tenantId = tenantId;
  session.role = "owner"; // operador age como owner na empresa acessada
  session.impersonando = true;
  session.empresaNome = empresa.nome;
  await session.save();

  await registrarAcessoOperador({
    operadorUserId: session.userId ?? "",
    operadorEmail: session.email ?? "",
    tenantId,
    tenantNome: empresa.nome,
  });
  return { ok: true };
}

/** "Sair da empresa": encerra a impersonação e volta o operador ao painel. */
export async function sairDaEmpresaAction(): Promise<ActionResult> {
  const deny = await requirePlatformAdmin();
  if (deny) return deny;

  const session = await getSession();
  session.tenantId = undefined;
  session.role = undefined;
  session.impersonando = false;
  session.empresaNome = undefined;
  await session.save();
  return { ok: true };
}
