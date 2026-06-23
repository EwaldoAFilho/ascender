// Orquestrador da auditoria — Fase 1: lê o banco (só leitura), monta o
// diagnóstico de dados, roda as regras puras e devolve o relatório em memória.
// NÃO grava nada. A persistência entra na Fase 2.

import { carregarDadosAuditoria } from "./queries";
import { montarDiagnostico, rodarRegras } from "./rules";
import { REGRAS_OPTS_PADRAO, type AuditReport, type RegrasOpts } from "./types";

function numEnv(nome: string, padrao: number): number {
  const v = process.env[nome];
  if (!v) return padrao;
  const n = Number(v);
  return Number.isFinite(n) ? n : padrao;
}

export async function gerarRelatorioAuditoria(): Promise<AuditReport> {
  const { rateios, faturas, ucs } = await carregarDadosAuditoria();
  const diagnostico = montarDiagnostico(rateios, faturas, ucs);

  const tarifaRef = numEnv("AUDITORIA_TARIFA_REF", REGRAS_OPTS_PADRAO.tarifaRef);
  const opts: RegrasOpts = {
    ...REGRAS_OPTS_PADRAO,
    tarifaRef,
    tolPercentual: numEnv("AUDITORIA_TOL_PERCENTUAL", REGRAS_OPTS_PADRAO.tolPercentual),
    fatorCreditoExcessivo: numEnv(
      "AUDITORIA_FATOR_CREDITO",
      REGRAS_OPTS_PADRAO.fatorCreditoExcessivo,
    ),
    // A escala do `percentual` é inferida dos dados (a confirmar empiricamente).
    fatorPercentualPara100: diagnostico.percentual.fatorPara100,
  };

  const findings = rodarRegras(rateios, faturas, ucs, opts);

  return {
    // Data injetada pelo chamador (scripts não usam Date.now no projeto p/ build).
    geradoEm: new Date().toISOString(),
    tarifaRef,
    diagnostico,
    findings,
  };
}
