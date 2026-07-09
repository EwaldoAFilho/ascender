"use server";

import { z } from "zod";
import { criarEmpresaComDono } from "@/lib/auth/platform";
import { emailEmUso } from "@/lib/auth/users";

export type ActionResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  nomeEmpresa: z.string().min(2, "Informe o nome da empresa."),
  donoNome: z.string().min(2, "Informe seu nome."),
  donoEmail: z.string().email("E-mail inválido."),
  donoSenha: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
  // Honeypot: campo oculto que um humano nunca preenche (anti-bot simples).
  website: z.string().optional().default(""),
});

/**
 * Autocadastro PÚBLICO (sem sessão) de uma empresa integradora. Cria o tenant com
 * status `pendente` + o usuário dono — mas o dono NÃO entra até o operador aprovar
 * (o login bloqueia `pendente`). A criação é atômica (criarEmpresaComDono).
 */
export async function signupAction(
  input: Record<string, unknown>,
): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }
  const { nomeEmpresa, donoNome, donoEmail, donoSenha, website } = parsed.data;

  // Bot preencheu o honeypot — finge sucesso e não cria nada.
  if (website.trim()) return { ok: true };

  if (await emailEmUso(donoEmail)) {
    return { ok: false, error: "Já existe uma conta com esse e-mail." };
  }

  try {
    await criarEmpresaComDono({
      nomeEmpresa,
      status: "pendente",
      donoNome,
      donoEmail,
      donoSenha,
    });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao concluir o cadastro.",
    };
  }
  return { ok: true };
}
