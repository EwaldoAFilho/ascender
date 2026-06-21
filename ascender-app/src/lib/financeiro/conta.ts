import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { contasEnergia, faturasDg } from "@/lib/db/schema";
import { parseContaNeoenergia, type ContaParsed } from "./parse-conta";

async function extractText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const res = await parser.getText();
    return res.text ?? "";
  } finally {
    await parser.destroy().catch(() => {});
  }
}

// Colunas exibíveis (sem o base64 do arquivo).
const camposPublicos = {
  id: contasEnergia.id,
  faturaDgId: contasEnergia.faturaDgId,
  arquivoNome: contasEnergia.arquivoNome,
  installationNumber: contasEnergia.installationNumber,
  competencia: contasEnergia.competencia,
  cliente: contasEnergia.cliente,
  ano: contasEnergia.ano,
  mes: contasEnergia.mes,
  vencimento: contasEnergia.vencimento,
  valor: contasEnergia.valor,
  notaFiscal: contasEnergia.notaFiscal,
  codigoBarras: contasEnergia.codigoBarras,
  leituraAnteriorData: contasEnergia.leituraAnteriorData,
  leituraData: contasEnergia.leituraData,
  leituraProximaData: contasEnergia.leituraProximaData,
  numeroDias: contasEnergia.numeroDias,
  energiaKwh: contasEnergia.energiaKwh,
  tributos: contasEnergia.tributos,
  itensFatura: contasEnergia.itensFatura,
  aviso: contasEnergia.aviso,
  sceeExcedenteKwh: contasEnergia.sceeExcedenteKwh,
  sceeCreditosKwh: contasEnergia.sceeCreditosKwh,
  sceeSaldoProximoKwh: contasEnergia.sceeSaldoProximoKwh,
  sceeSaldoAnteriorKwh: contasEnergia.sceeSaldoAnteriorKwh,
  sceeTransfKwh: contasEnergia.sceeTransfKwh,
  sceeInjetadoKwh: contasEnergia.sceeInjetadoKwh,
  sceeCompensadoKwh: contasEnergia.sceeCompensadoKwh,
  sceeSaldoAtualKwh: contasEnergia.sceeSaldoAtualKwh,
  criadoEm: contasEnergia.criadoEm,
} as const;

export type ContaEnergiaPublica = Awaited<
  ReturnType<typeof getContaEnergia>
>;

export async function salvarContaEnergia(
  faturaDgId: string,
  nome: string,
  mimeType: string,
  buffer: Buffer,
): Promise<ContaParsed> {
  const texto = await extractText(buffer);
  const p = parseContaNeoenergia(texto);
  await persistConta(faturaDgId, nome, mimeType, buffer, texto, p);
  return p;
}

// Persiste (upsert por fatura) o PDF + os campos já extraídos. Separado para o
// upload em lote reaproveitar sem reprocessar o PDF.
async function persistConta(
  faturaDgId: string,
  nome: string,
  mimeType: string,
  buffer: Buffer,
  texto: string,
  p: ContaParsed,
): Promise<void> {
  const base64 = buffer.toString("base64");
  const valores = {
    installationNumber: p.installationNumber,
    competencia: p.competencia,
    cliente: p.cliente,
    ano: p.ano,
    mes: p.mes,
    vencimento: p.vencimento,
    valor: p.valor,
    notaFiscal: p.notaFiscal,
    codigoBarras: p.codigoBarras,
    leituraAnteriorData: p.leituraAnteriorData,
    leituraData: p.leituraData,
    leituraProximaData: p.leituraProximaData,
    numeroDias: p.numeroDias,
    energiaKwh: p.energiaKwh,
    tributos: p.tributos,
    itensFatura: p.itensFatura,
    aviso: p.aviso,
    sceeExcedenteKwh: p.sceeExcedenteKwh,
    sceeCreditosKwh: p.sceeCreditosKwh,
    sceeSaldoProximoKwh: p.sceeSaldoProximoKwh,
    sceeSaldoAnteriorKwh: p.sceeSaldoAnteriorKwh,
    sceeTransfKwh: p.sceeTransfKwh,
    sceeInjetadoKwh: p.sceeInjetadoKwh,
    sceeCompensadoKwh: p.sceeCompensadoKwh,
    sceeSaldoAtualKwh: p.sceeSaldoAtualKwh,
    textoExtraido: texto,
  };
  await getDb()
    .insert(contasEnergia)
    .values({
      faturaDgId,
      arquivoNome: nome,
      mimeType,
      arquivoBase64: base64,
      ...valores,
    })
    .onConflictDoUpdate({
      target: contasEnergia.faturaDgId,
      set: {
        arquivoNome: nome,
        mimeType,
        arquivoBase64: base64,
        atualizadoEm: new Date(),
        ...valores,
      },
    });
}

export async function excluirContaEnergia(faturaDgId: string): Promise<void> {
  await getDb()
    .delete(contasEnergia)
    .where(eq(contasEnergia.faturaDgId, faturaDgId));
}

// ===== Conciliação de boletos em lote =====

export type ConciliacaoBoleto = {
  arquivo: string;
  status: "anexado" | "ja_tinha" | "sem_match" | "ambiguo" | "erro";
  uc: string | null;
  competencia: string | null;
  cliente: string | null;
  faturaDgId?: string;
  detalhe?: string;
};

/**
 * Concilia um PDF de conta com a fatura correspondente: lê UC + competência do
 * PDF, casa com `faturas_dg` (UC só por dígitos + competência) e anexa quando há
 * exatamente uma fatura sem conta. Não sobrescreve conta existente (pula e avisa).
 */
export async function conciliarBoleto(
  nome: string,
  mimeType: string,
  buffer: Buffer,
): Promise<ConciliacaoBoleto> {
  let texto: string;
  try {
    texto = await extractText(buffer);
  } catch {
    return {
      arquivo: nome,
      status: "erro",
      uc: null,
      competencia: null,
      cliente: null,
      detalhe: "Não foi possível ler o PDF.",
    };
  }

  const p = parseContaNeoenergia(texto);
  const ucDigitos = (p.installationNumber ?? "").replace(/\D/g, "");
  const comp = p.competencia;
  const base = {
    arquivo: nome,
    uc: p.installationNumber,
    competencia: comp,
    cliente: p.cliente,
  };

  if (!ucDigitos || !comp) {
    return {
      ...base,
      status: "sem_match",
      detalhe: "Não foi possível ler UC e/ou competência do PDF.",
    };
  }

  const matches = await getDb()
    .select({ id: faturasDg.id })
    .from(faturasDg)
    .where(
      sql`regexp_replace(coalesce(${faturasDg.installationNumber}, ''), '[^0-9]', '', 'g') = ${ucDigitos}
          and ${faturasDg.competencia} = ${comp}`,
    );

  if (matches.length === 0) {
    return {
      ...base,
      status: "sem_match",
      detalhe: `Nenhuma fatura com UC ${p.installationNumber} e competência ${comp}.`,
    };
  }
  if (matches.length > 1) {
    return {
      ...base,
      status: "ambiguo",
      detalhe: `${matches.length} faturas com essa UC e competência.`,
    };
  }

  const faturaId = matches[0].id;
  const [existente] = await getDb()
    .select({ id: contasEnergia.id })
    .from(contasEnergia)
    .where(eq(contasEnergia.faturaDgId, faturaId));
  if (existente) {
    return {
      ...base,
      status: "ja_tinha",
      faturaDgId: faturaId,
      detalhe: "A fatura já tinha uma conta anexada (mantida).",
    };
  }

  await persistConta(faturaId, nome, mimeType, buffer, texto, p);
  return { ...base, status: "anexado", faturaDgId: faturaId };
}

export async function getContaEnergia(faturaDgId: string) {
  const rows = await getDb()
    .select(camposPublicos)
    .from(contasEnergia)
    .where(eq(contasEnergia.faturaDgId, faturaDgId));
  return rows[0] ?? null;
}

export async function getContaFile(
  faturaDgId: string,
): Promise<{ nome: string | null; mimeType: string; base64: string } | null> {
  const rows = await getDb()
    .select({
      nome: contasEnergia.arquivoNome,
      mimeType: contasEnergia.mimeType,
      base64: contasEnergia.arquivoBase64,
    })
    .from(contasEnergia)
    .where(eq(contasEnergia.faturaDgId, faturaDgId));
  const row = rows[0];
  if (!row || !row.base64) return null;
  return { nome: row.nome, mimeType: row.mimeType, base64: row.base64 };
}

export async function getFaturaIdsComConta(): Promise<string[]> {
  const rows = await getDb()
    .select({ id: contasEnergia.faturaDgId })
    .from(contasEnergia);
  return rows.map((r) => r.id);
}
