// Camada de I/O da auditoria — Fase 1: SOMENTE leitura.
// Carrega os dados necessários (volume pequeno: centenas de linhas) e deixa
// toda a lógica para as funções puras em `rules.ts`.

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
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

export async function carregarDadosAuditoria(): Promise<DadosAuditoria> {
  const db = getDb();
  const [rateios, faturas, ucs] = await Promise.all([
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
      .from(rateiosDg),
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
      })
      .from(faturasDg),
    db
      .select({
        codigoInstalacao: unidadesConsumidoras.codigoInstalacao,
        ativo: unidadesConsumidoras.ativo,
        consumoMedioKwh: unidadesConsumidoras.consumoMedioKwh,
        clienteNome: clientes.nome,
        documento: clientes.documento,
      })
      .from(unidadesConsumidoras)
      .leftJoin(clientes, eq(clientes.id, unidadesConsumidoras.clienteId)),
  ]);

  return { rateios, faturas, ucs };
}
