import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { contasEnergia } from "@/lib/db/schema";
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
  return p;
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
