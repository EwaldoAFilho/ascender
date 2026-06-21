import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { anexos } from "@/lib/db/schema";
import { autorAtual, registrarHistorico } from "./historico";

// Colunas de metadados (sem o binário `conteudo`).
const metaCols = {
  id: anexos.id,
  entidade: anexos.entidade,
  entidadeId: anexos.entidadeId,
  nome: anexos.nome,
  mimeType: anexos.mimeType,
  tamanhoBytes: anexos.tamanhoBytes,
  enviadoPor: anexos.enviadoPor,
  enviadoPorId: anexos.enviadoPorId,
  criadoEm: anexos.criadoEm,
} as const;

export type AnexoMeta = Awaited<ReturnType<typeof listarAnexos>>[number];

/** Lista os anexos (só metadados) de uma entidade, mais recente primeiro. */
export async function listarAnexos(entidade: string, entidadeId: string) {
  return getDb()
    .select(metaCols)
    .from(anexos)
    .where(and(eq(anexos.entidade, entidade), eq(anexos.entidadeId, entidadeId)))
    .orderBy(desc(anexos.criadoEm));
}

/** Salva um anexo (binário em bytea) e registra no histórico. */
export async function salvarAnexo(
  entidade: string,
  entidadeId: string,
  nome: string,
  mimeType: string,
  buffer: Buffer,
): Promise<string> {
  const { autor, autorId } = await autorAtual();
  const [row] = await getDb()
    .insert(anexos)
    .values({
      entidade,
      entidadeId,
      nome,
      mimeType,
      tamanhoBytes: buffer.byteLength,
      conteudo: buffer,
      enviadoPor: autor,
      enviadoPorId: autorId,
    })
    .returning({ id: anexos.id });
  await registrarHistorico({
    entidade,
    entidadeId,
    acao: "anexou",
    detalhe: nome,
    autor,
    autorId,
  });
  return row.id;
}

/** Lê o conteúdo de um anexo (para download). */
export async function getAnexoFile(id: string): Promise<{
  nome: string;
  mimeType: string;
  conteudo: Buffer;
} | null> {
  const rows = await getDb()
    .select({
      nome: anexos.nome,
      mimeType: anexos.mimeType,
      conteudo: anexos.conteudo,
    })
    .from(anexos)
    .where(eq(anexos.id, id));
  return rows[0] ?? null;
}

/** Exclui um anexo e registra no histórico. */
export async function excluirAnexo(id: string): Promise<void> {
  const rows = await getDb()
    .select({
      entidade: anexos.entidade,
      entidadeId: anexos.entidadeId,
      nome: anexos.nome,
    })
    .from(anexos)
    .where(eq(anexos.id, id));
  const a = rows[0];
  if (!a) return;
  await getDb().delete(anexos).where(eq(anexos.id, id));
  const { autor, autorId } = await autorAtual();
  await registrarHistorico({
    entidade: a.entidade,
    entidadeId: a.entidadeId,
    acao: "removeu_anexo",
    detalhe: a.nome,
    autor,
    autorId,
  });
}
