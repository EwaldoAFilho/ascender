import { eq, sql } from "drizzle-orm";
import { parseContaComIA } from "@/lib/ai/extract";
import { getDocumentoPorInstalacao } from "@/lib/digitalgrid/queries";
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

// Mescla preferindo a IA; o regex preenche os campos que a IA deixou em branco.
function mergePreferIa(ia: ContaParsed, regex: ContaParsed): ContaParsed {
  return {
    installationNumber: ia.installationNumber ?? regex.installationNumber,
    competencia: ia.competencia ?? regex.competencia,
    ano: ia.ano ?? regex.ano,
    mes: ia.mes ?? regex.mes,
    cliente: ia.cliente ?? regex.cliente,
    cnpj: ia.cnpj ?? regex.cnpj,
    vencimento: ia.vencimento ?? regex.vencimento,
    valor: ia.valor ?? regex.valor,
    notaFiscal: ia.notaFiscal ?? regex.notaFiscal,
    codigoBarras: ia.codigoBarras ?? regex.codigoBarras,
    leituraAnteriorData: ia.leituraAnteriorData ?? regex.leituraAnteriorData,
    leituraData: ia.leituraData ?? regex.leituraData,
    leituraProximaData: ia.leituraProximaData ?? regex.leituraProximaData,
    numeroDias: ia.numeroDias ?? regex.numeroDias,
    energiaKwh: ia.energiaKwh ?? regex.energiaKwh,
    tributos: {
      pis: ia.tributos.pis ?? regex.tributos.pis,
      cofins: ia.tributos.cofins ?? regex.tributos.cofins,
      icms: ia.tributos.icms ?? regex.tributos.icms,
    },
    itensFatura: ia.itensFatura.length ? ia.itensFatura : regex.itensFatura,
    aviso: ia.aviso ?? regex.aviso,
    sceeExcedenteKwh: ia.sceeExcedenteKwh ?? regex.sceeExcedenteKwh,
    sceeCreditosKwh: ia.sceeCreditosKwh ?? regex.sceeCreditosKwh,
    sceeSaldoProximoKwh: ia.sceeSaldoProximoKwh ?? regex.sceeSaldoProximoKwh,
    sceeSaldoAnteriorKwh: ia.sceeSaldoAnteriorKwh ?? regex.sceeSaldoAnteriorKwh,
    sceeTransfKwh: ia.sceeTransfKwh ?? regex.sceeTransfKwh,
    sceeInjetadoKwh: ia.sceeInjetadoKwh ?? regex.sceeInjetadoKwh,
    sceeCompensadoKwh: ia.sceeCompensadoKwh ?? regex.sceeCompensadoKwh,
    sceeSaldoAtualKwh: ia.sceeSaldoAtualKwh ?? regex.sceeSaldoAtualKwh,
  };
}

// Orquestra a extração: IA (provedor ativo) primeiro, regex como rede de
// segurança. Usado tanto pelo upload individual quanto pelo lote, então os dois
// fluxos herdam a leitura de qualquer distribuidora/PDF escaneado.
async function extrairConta(
  buffer: Buffer,
  label?: string,
): Promise<{ parsed: ContaParsed; texto: string; fonte: "ia" | "regex" }> {
  const alvo = label ? ` arquivo="${label}"` : "";
  let texto = "";
  try {
    texto = await extractText(buffer);
  } catch {
    texto = "";
  }
  const regex = parseContaNeoenergia(texto);

  let ia: ContaParsed | null = null;
  try {
    const r = await parseContaComIA(buffer);
    if (r) {
      ia = r.conta;
      console.log(
        `[conta] extração via IA OK${alvo} provider=${r.provider} model=${r.model} tokens_in=${r.usage.inputTokens ?? "?"} tokens_out=${r.usage.outputTokens ?? "?"}`,
      );
    } else {
      console.log(`[conta] IA não está ativa${alvo} — usando apenas regex.`);
    }
  } catch (error) {
    console.error(
      `[conta] extração via IA falhou${alvo}, usando regex:`,
      error,
    );
    ia = null;
  }

  if (!ia) return { parsed: regex, texto, fonte: "regex" };
  return { parsed: mergePreferIa(ia, regex), texto, fonte: "ia" };
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

export type DivergenciaConta = {
  mensagem: string;
  ucPdf: string | null;
  compPdf: string | null;
  ucFatura: string | null;
  compFatura: string | null;
};

export type SalvarContaResult =
  | { status: "ok"; parsed: ContaParsed }
  | {
      status: "divergencia";
      divergencia: DivergenciaConta;
      parsed: ContaParsed;
    };

async function getFaturaChave(
  faturaDgId: string,
): Promise<{ uc: string | null; competencia: string | null } | null> {
  const rows = await getDb()
    .select({
      uc: faturasDg.installationNumber,
      competencia: faturasDg.competencia,
    })
    .from(faturasDg)
    .where(eq(faturasDg.id, faturaDgId));
  const r = rows[0];
  return r ? { uc: r.uc, competencia: r.competencia } : null;
}

// Guarda de divergência (individual): a UC/competência lidas do PDF batem com a
// fatura que o usuário escolheu? Só sinaliza quando os dois lados têm o dado.
function checarDivergencia(
  parsed: ContaParsed,
  fatura: { uc: string | null; competencia: string | null },
): DivergenciaConta | null {
  const ucPdf = (parsed.installationNumber ?? "").replace(/\D/g, "") || null;
  const ucFatura = (fatura.uc ?? "").replace(/\D/g, "") || null;
  const compPdf = parsed.competencia;
  const compFatura = fatura.competencia || null;
  const ucDiverge = Boolean(ucPdf && ucFatura && ucPdf !== ucFatura);
  const compDiverge = Boolean(compPdf && compFatura && compPdf !== compFatura);
  if (!ucDiverge && !compDiverge) return null;

  const partes: string[] = [];
  if (ucDiverge) partes.push(`UC ${ucPdf}`);
  if (compDiverge) partes.push(`competência ${compPdf}`);
  return {
    mensagem: `O PDF lido aparenta ser de ${partes.join(
      " e ",
    )}, diferente desta fatura (UC ${ucFatura ?? "?"}, competência ${
      compFatura ?? "?"
    }). Anexar mesmo assim?`,
    ucPdf,
    compPdf,
    ucFatura,
    compFatura,
  };
}

export async function salvarContaEnergia(
  faturaDgId: string,
  nome: string,
  mimeType: string,
  buffer: Buffer,
  force = false,
): Promise<SalvarContaResult> {
  const { parsed, texto } = await extrairConta(buffer, nome);
  if (!force) {
    const fatura = await getFaturaChave(faturaDgId);
    if (fatura) {
      const divergencia = checarDivergencia(parsed, fatura);
      if (divergencia) return { status: "divergencia", divergencia, parsed };
    }
  }
  await persistConta(faturaDgId, nome, mimeType, buffer, texto, parsed);
  return { status: "ok", parsed };
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
  docMap?: Map<string, string>,
): Promise<ConciliacaoBoleto> {
  let texto: string;
  let p: ContaParsed;
  try {
    const r = await extrairConta(buffer, nome);
    texto = r.texto;
    p = r.parsed;
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

  // Blindagem: confere o CNPJ/CPF do titular antes de anexar. Pega UC mal lida
  // (um dígito trocado) que coincidiria com outra UC real. Só bloqueia quando
  // os dois lados têm o documento e eles divergem.
  const pdfDoc = (p.cnpj ?? "").replace(/\D/g, "");
  if (pdfDoc) {
    const docs = docMap ?? (await getDocumentoPorInstalacao());
    const esperado = docs.get(ucDigitos);
    if (esperado && esperado !== pdfDoc) {
      return {
        ...base,
        status: "ambiguo",
        faturaDgId: faturaId,
        detalhe: `CNPJ/CPF do PDF (${pdfDoc}) não confere com o titular da fatura (${esperado}). Confira manualmente.`,
      };
    }
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
