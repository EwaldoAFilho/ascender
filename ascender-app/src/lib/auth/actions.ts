"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import {
  countAtivos,
  createUsuario,
  deleteUsuario,
  emailEmUso,
  getUsuario,
  updateUsuario,
} from "@/lib/auth/users";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function ensureAuth(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session.authenticated) return { ok: false, error: "Não autenticado." };
  return null;
}

const schema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1, "Informe o nome."),
  email: z.string().email("E-mail inválido."),
  senha: z.string().optional().default(""),
  ativo: z.enum(["true", "false"]).optional().default("true"),
});

export async function salvarUsuario(
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { id, nome, email, senha, ativo } = parsed.data;
  const ativoBool = ativo !== "false";
  const session = await getSession();

  if (await emailEmUso(email, id)) {
    return { ok: false, error: "Já existe um usuário com esse e-mail." };
  }

  try {
    if (id) {
      if (!ativoBool && session.userId === id) {
        return { ok: false, error: "Você não pode desativar o próprio usuário." };
      }
      if (!ativoBool) {
        const alvo = await getUsuario(id);
        if (alvo?.ativo && (await countAtivos()) <= 1) {
          return { ok: false, error: "Deve haver ao menos um usuário ativo." };
        }
      }
      if (senha && senha.trim() && senha.trim().length < 8) {
        return { ok: false, error: "A nova senha deve ter ao menos 8 caracteres." };
      }
      await updateUsuario(id, { nome, email, ativo: ativoBool, senha });
    } else {
      if (!senha || senha.trim().length < 8) {
        return { ok: false, error: "A senha deve ter ao menos 8 caracteres." };
      }
      await createUsuario({ nome, email, senha: senha.trim(), ativo: ativoBool });
    }
    revalidatePath("/configuracoes/usuarios");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao salvar usuário." };
  }
}

export async function excluirUsuario(id: string): Promise<ActionResult> {
  const auth = await ensureAuth();
  if (auth) return auth;

  const session = await getSession();
  if (session.userId === id) {
    return { ok: false, error: "Você não pode excluir o próprio usuário." };
  }
  const alvo = await getUsuario(id);
  if (alvo?.ativo && (await countAtivos()) <= 1) {
    return { ok: false, error: "Deve haver ao menos um usuário ativo." };
  }
  try {
    await deleteUsuario(id);
    revalidatePath("/configuracoes/usuarios");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao excluir usuário." };
  }
}
