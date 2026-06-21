import { and, desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { cadastroHistorico } from "@/lib/db/schema";

export type AutorAtual = { autor: string | null; autorId: string | null };

/** Identifica quem está fazendo a alteração (e-mail/id da sessão). */
export async function autorAtual(): Promise<AutorAtual> {
  const s = await getSession();
  return { autor: s.email ?? null, autorId: s.userId ?? null };
}

export type EntradaHistorico = {
  entidade: string;
  entidadeId: string;
  acao: "criou" | "editou_campo" | "anexou" | "removeu_anexo";
  campo?: string | null;
  valorAntes?: string | null;
  valorDepois?: string | null;
  detalhe?: string | null;
  autor?: string | null;
  autorId?: string | null;
};

/** Grava uma ou mais entradas no histórico de cadastros. */
export async function registrarHistorico(
  entrada: EntradaHistorico | EntradaHistorico[],
): Promise<void> {
  const arr = Array.isArray(entrada) ? entrada : [entrada];
  if (arr.length === 0) return;
  await getDb()
    .insert(cadastroHistorico)
    .values(
      arr.map((x) => ({
        entidade: x.entidade,
        entidadeId: x.entidadeId,
        acao: x.acao,
        campo: x.campo ?? null,
        valorAntes: x.valorAntes ?? null,
        valorDepois: x.valorDepois ?? null,
        detalhe: x.detalhe ?? null,
        autor: x.autor ?? null,
        autorId: x.autorId ?? null,
      })),
    );
}

/** Lista o histórico de uma entidade (mais recente primeiro). */
export async function listarHistorico(entidade: string, entidadeId: string) {
  return getDb()
    .select()
    .from(cadastroHistorico)
    .where(
      and(
        eq(cadastroHistorico.entidade, entidade),
        eq(cadastroHistorico.entidadeId, entidadeId),
      ),
    )
    .orderBy(desc(cadastroHistorico.criadoEm));
}
