"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { permitir } from "@/lib/auth/rate-limit";
import { criarEmpresaComDono } from "@/lib/auth/platform";
import { emailEmUso } from "@/lib/auth/users";
import { ehViolacaoUnica } from "@/lib/db/erros";

export type ActionResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  nomeEmpresa: z.string().min(2, "Informe o nome da empresa.").max(120),
  donoNome: z.string().min(2, "Informe seu nome.").max(120),
  donoEmail: z.string().email("E-mail inválido.").max(254),
  donoSenha: z.string().min(8, "A senha deve ter ao menos 8 caracteres.").max(200),
  // Honeypot: campo oculto que um humano nunca preenche (anti-bot simples).
  website: z.string().max(200).optional().default(""),
});

async function ipDaRequisicao(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "desconhecido"
  );
}

/**
 * Autocadastro PÚBLICO (sem sessão) de uma empresa integradora. Cria o tenant com
 * status `pendente` + o usuário dono — mas o dono NÃO entra até o operador aprovar
 * (o login bloqueia `pendente`). A criação é atômica (criarEmpresaComDono).
 *
 * Defesas de endpoint público: validação + tamanho máximo dos campos, honeypot e
 * rate-limit por IP + teto global (mitiga bloat/DoS; NÃO vaza erro cru do banco).
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

  // Rate-limit antes do trabalho caro (hash Argon2 + inserts): por IP (5/h) e um
  // teto global (30/10min) como backstop contra flood distribuído/IP forjado.
  const ip = await ipDaRequisicao();
  const permitido =
    permitir(`signup:ip:${ip}`, 5, 60 * 60 * 1000) &&
    permitir("signup:global", 30, 10 * 60 * 1000);
  if (!permitido) {
    return {
      ok: false,
      error: "Muitas tentativas de cadastro. Tente novamente mais tarde.",
    };
  }

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
    // Não vaza a mensagem crua do banco (nomes de tabela/constraint) ao público.
    console.error("[signup] erro ao criar empresa:", e);
    if (ehViolacaoUnica(e)) {
      return { ok: false, error: "Já existe uma conta com esse e-mail." };
    }
    return {
      ok: false,
      error: "Não foi possível concluir o cadastro. Tente novamente.",
    };
  }
  return { ok: true };
}
