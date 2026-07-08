// Camada de I/O da auditoria — Fase 1: SOMENTE leitura.
// Carrega os dados necessários (volume pequeno: centenas de linhas) e deixa
// toda a lógica para as funções puras em `rules.ts`.

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/db/tenant-context";
import {
  clientes,
  faturasDg,
  rateiosDg,
  unidadesConsumidoras,
} from "@/lib/db/schema";

export type RateioRow = {
  competencia: string;
  installation: string;
  generatorNumber: string | null;
  usinaNome: string | null;
  ownerDocument: string;
  ownerName: string | null;
  percentual: number;
  covering: number;
  consumoKwh: number;
  creditosAcumulados: number;
};

export type FaturaRow = {
  dgBillId: number;
  competencia: string;
  installationNumber: string | null;
  valorTotal: number;
  valorPago: number;
  economia: number;
  consumoKwh: number;
  vencimento: string | null;
  paymentStatus: string;
  // ===== Campos extraídos do raw (DG) p/ validações financeiras =====
  /** Desconto contratado declarado na fatura (%). */
  agentDiscountPct: number | null;
  /** Valor da fatura sem o desconto (cheio, inclui resíduo da distribuidora). */
  totalSemDesconto: number | null;
  /** Resíduo cobrado pela distribuidora (fio B, taxas, iluminação) — NÃO descontável. */
  totalDistribuidor: number;
  /** Iluminação pública (entra no total cobrado). */
  lightning: number;
  /** Encargos extras (entram no total cobrado). */
  extraCharges: number;
};

export type UcRow = {
  codigoInstalacao: string;
  ativo: boolean;
  consumoMedioKwh: number;
  clienteNome: string | null;
  documento: string | null;
};

export type DadosAuditoria = {
  rateios: RateioRow[];
  faturas: FaturaRow[];
  ucs: UcRow[];
};

// Lê um número de um campo do raw (DG manda valores como "356.04000").
function rawNum(raw: unknown, key: string): number | null {
  const o = raw as Record<string, unknown> | null;
  const v = o?.[key];
  if (v == null) return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

export async function carregarDadosAuditoria(): Promise<DadosAuditoria> {
  const db = getDb();
  const [rateios, faturasRaw, ucs] = await Promise.all([
    db
      .select({
        competencia: rateiosDg.competencia,
        installation: rateiosDg.installation,
        generatorNumber: rateiosDg.generatorNumber,
        usinaNome: rateiosDg.usinaNome,
        ownerDocument: rateiosDg.ownerDocument,
        ownerName: rateiosDg.ownerName,
        percentual: rateiosDg.percentual,
        covering: rateiosDg.covering,
        consumoKwh: rateiosDg.consumoKwh,
        creditosAcumulados: rateiosDg.creditosAcumulados,
      })
      .from(rateiosDg)
      .where(eq(rateiosDg.tenantId, getCurrentTenantId())),
    db
      .select({
        dgBillId: faturasDg.dgBillId,
        competencia: faturasDg.competencia,
        installationNumber: faturasDg.installationNumber,
        valorTotal: faturasDg.valorTotal,
        valorPago: faturasDg.valorPago,
        economia: faturasDg.economia,
        consumoKwh: faturasDg.consumoKwh,
        vencimento: faturasDg.vencimento,
        paymentStatus: faturasDg.paymentStatus,
        raw: faturasDg.raw,
      })
      .from(faturasDg)
      .where(eq(faturasDg.tenantId, getCurrentTenantId())),
    db
      .select({
        codigoInstalacao: unidadesConsumidoras.codigoInstalacao,
        ativo: unidadesConsumidoras.ativo,
        consumoMedioKwh: unidadesConsumidoras.consumoMedioKwh,
        clienteNome: clientes.nome,
        documento: clientes.documento,
      })
      .from(unidadesConsumidoras)
      .leftJoin(clientes, eq(clientes.id, unidadesConsumidoras.clienteId))
      .where(eq(unidadesConsumidoras.tenantId, getCurrentTenantId())),
  ]);

  const faturas: FaturaRow[] = faturasRaw.map((f) => ({
    dgBillId: f.dgBillId,
    competencia: f.competencia,
    installationNumber: f.installationNumber,
    valorTotal: f.valorTotal,
    valorPago: f.valorPago,
    economia: f.economia,
    consumoKwh: f.consumoKwh,
    vencimento: f.vencimento,
    paymentStatus: f.paymentStatus,
    agentDiscountPct: rawNum(f.raw, "agent_discount"),
    totalSemDesconto: rawNum(f.raw, "total_amount_without_discount"),
    totalDistribuidor: rawNum(f.raw, "total_amount_distributor") ?? 0,
    lightning: rawNum(f.raw, "lightning") ?? 0,
    extraCharges: rawNum(f.raw, "extra_charges") ?? 0,
  }));

  return { rateios, faturas, ucs };
}
