"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TENANT0_ID } from "@/lib/db/schema";
import {
  criarEmpresaComDono,
  mudarStatusTenant,
  requirePlatformAdmin,
} from "@/lib/auth/platform";
import { emailEmUso } from "@/lib/auth/users";
import { ehViolacaoUnica } from "@/lib/db/erros";

export type ActionResult = { ok: true } | { ok: false; error: string };

const PATH = "/plataforma";

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
  tenantId: z.string().uuid("Empresa inválida."),
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
