"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { getSessionTenantId } from "@/lib/auth/tenant";
import { requireRole } from "@/lib/auth/rbac";
import {
  atualizarMembro,
  countMembrosAtivos,
  criarMembro,
  emailEmUso,
  papelNoTenant,
  removerMembro,
} from "@/lib/auth/users";

export type ActionResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1, "Informe o nome."),
  email: z.string().email("E-mail inválido."),
  senha: z.string().optional().default(""),
  ativo: z.enum(["true", "false"]).optional().default("true"),
  role: z.enum(["owner", "admin", "operador", "leitura"]).optional().default("operador"),
});

export async function salvarUsuario(
  input: Record<string, unknown>,
): Promise<ActionResult> {
  // Gestão de usuários exige papel admin+ no tenant.
  const deny = await requireRole("admin");
  if (deny) return deny;

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { id, nome, email, senha, ativo, role } = parsed.data;
  const ativoBool = ativo !== "false";
  const session = await getSession();
  const tenantId = await getSessionTenantId();

  if (await emailEmUso(email, id)) {
    return { ok: false, error: "Já existe um usuário com esse e-mail." };
  }

  try {
    if (id) {
      // Só edita membros do próprio tenant.
      if (!(await papelNoTenant(tenantId, id))) {
        return { ok: false, error: "Usuário não pertence a este tenant." };
      }
      if (!ativoBool && session.userId === id) {
        return { ok: false, error: "Você não pode desativar o próprio usuário." };
      }
      if (!ativoBool && (await countMembrosAtivos(tenantId)) <= 1) {
        return { ok: false, error: "Deve haver ao menos um usuário ativo." };
      }
      if (senha && senha.trim() && senha.trim().length < 8) {
        return { ok: false, error: "A nova senha deve ter ao menos 8 caracteres." };
      }
      await atualizarMembro(tenantId, id, { nome, email, ativo: ativoBool, senha, role });
    } else {
      if (!senha || senha.trim().length < 8) {
        return { ok: false, error: "A senha deve ter ao menos 8 caracteres." };
      }
      await criarMembro(tenantId, { nome, email, senha: senha.trim(), ativo: ativoBool, role });
    }
    revalidatePath("/configuracoes/usuarios");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao salvar usuário." };
  }
}

export async function excluirUsuario(id: string): Promise<ActionResult> {
  const deny = await requireRole("admin");
  if (deny) return deny;

  const session = await getSession();
  const tenantId = await getSessionTenantId();
  if (session.userId === id) {
    return { ok: false, error: "Você não pode excluir o próprio usuário." };
  }
  if (!(await papelNoTenant(tenantId, id))) {
    return { ok: false, error: "Usuário não pertence a este tenant." };
  }
  if ((await countMembrosAtivos(tenantId)) <= 1) {
    return { ok: false, error: "Deve haver ao menos um usuário ativo." };
  }
  try {
    await removerMembro(tenantId, id);
    revalidatePath("/configuracoes/usuarios");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao excluir usuário." };
  }
}
