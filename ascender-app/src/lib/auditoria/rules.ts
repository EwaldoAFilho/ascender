// Regras de auditoria — FUNÇÕES PURAS (sem I/O), 100% testáveis.
// Recebem linhas já carregadas e devolvem Finding[]. Nenhuma escrita.
//
// Fase 1 implementa as validações viáveis HOJE (só com os dados atuais):
//   #2 UC sem rateio · #3 rateio duplicado · #7 consumo×crédito incompatível ·
//   #10 fatura sem UC · #11 fatura duplicada · #12 competência incorreta ·
//   #14 crédito parado
// + diagnósticos do otimizador: UC subalocada / superalocada / baixo consumo.

import type { FaturaRow, RateioRow, UcRow } from "./queries";
import type {
  DiagnosticoDados,
  Finding,
  RegrasOpts,
  Severidade,
} from "./types";

export const soDigitos = (s: string | null | undefined): string =>
  (s ?? "").replace(/\D/g, "");

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Competências distintas, mais recentes primeiro. */
export function competenciasOrdenadas(
  linhas: { competencia: string }[],
): string[] {
  const set = new Set<string>();
  for (const l of linhas) if (l.competencia) set.add(l.competencia);
  return [...set].sort().reverse();
}

// ===== Diagnóstico de dados (puro) =====

/**
 * Infere a escala do campo `percentual`. Sem confirmar com dados reais, a regra
 * de "soma = 100%" é arriscada — por isso o diagnóstico vem primeiro.
 */
export function inferirEscalaPercentual(rateios: RateioRow[]): {
  min: number;
  max: number;
  media: number;
  escala: DiagnosticoDados["percentual"]["escala"];
  fatorPara100: number;
} {
  const vals = rateios.map((r) => r.percentual).filter((v) => v > 0);
  if (vals.length === 0)
    return { min: 0, max: 0, media: 0, escala: "indefinida", fatorPara100: 1 };
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const media = vals.reduce((s, v) => s + v, 0) / vals.length;
  // Heurística: valores ≤ 1.5 sugerem fração (0–1); até ~100 sugerem 0–100.
  if (max <= 1.5)
    return { min, max, media, escala: "fracao_0_1", fatorPara100: 100 };
  if (max <= 100.5)
    return { min, max, media, escala: "percentual_0_100", fatorPara100: 1 };
  return { min, max, media, escala: "indefinida", fatorPara100: 1 };
}

/** Taxas de junção entre o Digital Grid (string) e o cadastro local. */
export function calcularJuncao(
  rateios: RateioRow[],
  faturas: FaturaRow[],
  ucs: UcRow[],
): DiagnosticoDados["juncao"] {
  const ucCodes = new Set(ucs.map((u) => u.codigoInstalacao).filter(Boolean));
  const ucDocs = new Set(
    ucs.map((u) => soDigitos(u.documento)).filter(Boolean),
  );

  const rInst = new Set(rateios.map((r) => r.installation).filter(Boolean));
  const rInstOk = [...rInst].filter((i) => ucCodes.has(i)).length;

  const fInst = new Set(
    faturas.map((f) => f.installationNumber ?? "").filter(Boolean),
  );
  const fInstOk = [...fInst].filter((i) => ucCodes.has(i)).length;

  const rDocs = new Set(
    rateios.map((r) => soDigitos(r.ownerDocument)).filter(Boolean),
  );
  const rDocsOk = [...rDocs].filter((d) => ucDocs.has(d)).length;

  const pct = (ok: number, total: number) =>
    total > 0 ? round2((ok / total) * 100) : 0;

  return {
    rateioInstalacoes: rInst.size,
    rateioComUc: rInstOk,
    rateioJoinPct: pct(rInstOk, rInst.size),
    faturaInstalacoes: fInst.size,
    faturaComUc: fInstOk,
    faturaJoinPct: pct(fInstOk, fInst.size),
    rateioDocumentos: rDocs.size,
    rateioComCliente: rDocsOk,
    documentoJoinPct: pct(rDocsOk, rDocs.size),
  };
}

export function montarDiagnostico(
  rateios: RateioRow[],
  faturas: FaturaRow[],
  ucs: UcRow[],
): DiagnosticoDados {
  return {
    rateios: rateios.length,
    faturas: faturas.length,
    ucsCadastradas: ucs.length,
    competenciaRateioRecente: competenciasOrdenadas(rateios)[0] ?? null,
    competenciaFaturaRecente: competenciasOrdenadas(faturas)[0] ?? null,
    percentual: inferirEscalaPercentual(rateios),
    juncao: calcularJuncao(rateios, faturas, ucs),
  };
}

// ===== Validações (puras) =====

// #1 — Soma de percentuais por usina × competência ≠ 100%.
export function regraSomaPercentual(
  rateios: RateioRow[],
  opts: RegrasOpts,
): Finding[] {
  const recente = competenciasOrdenadas(rateios)[0] ?? null;
  if (!recente) return [];
  const grupos = new Map<string, { soma: number; usina: string }>();
  for (const r of rateios) {
    if (r.competencia !== recente) continue;
    const usina = r.usinaNome ?? r.generatorNumber ?? "(sem usina)";
    const g = grupos.get(usina) ?? { soma: 0, usina };
    g.soma += r.percentual * opts.fatorPercentualPara100;
    grupos.set(usina, g);
  }
  const out: Finding[] = [];
  for (const { soma, usina } of grupos.values()) {
    const desvio = soma - 100;
    if (Math.abs(desvio) <= opts.tolPercentual) continue;
    out.push({
      regra: "soma_percentual",
      severidade: desvio > 0 ? "alta" : "media",
      entidade: "usina",
      entidadeRef: usina,
      competencia: recente,
      titulo:
        desvio > 0
          ? `Soma de percentuais acima de 100% (${round2(soma)}%)`
          : `Soma de percentuais abaixo de 100% (${round2(soma)}%) — capacidade não distribuída`,
      detalhe: { somaPercentual: round2(soma), desvio: round2(desvio) },
      impactoFinanceiro: 0,
    });
  }
  return out;
}

/** UC que é, na verdade, um gerador/consórcio (não recebe rateio). */
export function ehGeradoraOuConsorcio(
  u: UcRow,
  generatorNumbers: Set<string>,
): boolean {
  return (
    generatorNumbers.has(u.codigoInstalacao) ||
    /consorcio|cons[oó]rcio|\bases\b/i.test(u.clienteNome ?? "")
  );
}

// #2 — UC cadastrada e ativa, sem rateio na competência recente.
// Exclui geradoras/consórcio (que naturalmente não recebem rateio).
export function regraUcSemRateio(
  rateios: RateioRow[],
  ucs: UcRow[],
  generatorNumbers: Set<string>,
  opts: RegrasOpts,
): Finding[] {
  const recente = competenciasOrdenadas(rateios)[0] ?? null;
  if (!recente) return [];
  const comRateio = new Set(
    rateios.filter((r) => r.competencia === recente).map((r) => r.installation),
  );
  const out: Finding[] = [];
  for (const u of ucs) {
    if (!u.ativo) continue;
    if (comRateio.has(u.codigoInstalacao)) continue;
    if (ehGeradoraOuConsorcio(u, generatorNumbers)) continue;
    out.push({
      regra: "uc_sem_rateio",
      severidade: "alta",
      entidade: "uc",
      entidadeRef: u.codigoInstalacao,
      competencia: recente,
      titulo: `UC ativa sem rateio na competência ${recente}`,
      detalhe: {
        cliente: u.clienteNome ?? "(sem cliente)",
        consumoMedioKwh: u.consumoMedioKwh,
      },
      impactoFinanceiro: round2(u.consumoMedioKwh * opts.tarifaRef * 0.15),
    });
  }
  return out;
}

// #3 — UC com rateio duplicado (mais de uma usina/linha na mesma competência).
export function regraRateioDuplicado(rateios: RateioRow[]): Finding[] {
  const recente = competenciasOrdenadas(rateios)[0] ?? null;
  if (!recente) return [];
  const porInst = new Map<string, RateioRow[]>();
  for (const r of rateios) {
    if (r.competencia !== recente) continue;
    const arr = porInst.get(r.installation) ?? [];
    arr.push(r);
    porInst.set(r.installation, arr);
  }
  const out: Finding[] = [];
  for (const [inst, linhas] of porInst) {
    const usinas = new Set(
      linhas.map((l) => l.usinaNome ?? l.generatorNumber ?? "?"),
    );
    if (linhas.length > 1 || usinas.size > 1) {
      out.push({
        regra: "rateio_duplicado",
        severidade: "alta",
        entidade: "uc",
        entidadeRef: inst,
        competencia: recente,
        titulo: `UC com ${linhas.length} rateios na competência ${recente}`,
        detalhe: {
          usinas: [...usinas],
          somaPercentual: round2(linhas.reduce((s, l) => s + l.percentual, 0)),
        },
        impactoFinanceiro: 0,
      });
    }
  }
  return out;
}

// Avalia um saldo de crédito vs consumo mensal. Impacto = só o EXCEDENTE além do
// que dá para usar em `mesesExpiracaoScee` meses (esse excedente expira sem uso).
function avaliarCredito(
  ref: string,
  credito: number,
  consumoMensal: number,
  competencia: string,
  nome: string | null,
  ucs: string[],
  ehCancel: boolean,
  opts: RegrasOpts,
): Finding | null {
  if (consumoMensal <= 0) return null;
  if (credito <= opts.fatorCreditoExcessivo * consumoMensal) return null;
  const excedente = Math.max(0, credito - opts.mesesExpiracaoScee * consumoMensal);
  const meses = Math.round(credito / consumoMensal);
  return {
    regra: "consumo_credito_incompativel",
    // UC em encerramento (-CANCEL) é informativo; senão alta se há excedente que expira.
    severidade: ehCancel ? "info" : excedente > 0 ? "alta" : "media",
    entidade: "uc",
    entidadeRef: ucs.length > 1 ? `${ref} (${ucs.length} UCs)` : ucs[0],
    competencia,
    titulo: `Crédito ${round2(credito)} kWh ≫ consumo ${round2(consumoMensal)} kWh/mês (${meses} meses de saldo)${ehCancel ? " — UC em encerramento" : ""}`,
    detalhe: {
      creditosAcumulados: round2(credito),
      consumoMensalKwh: round2(consumoMensal),
      mesesDeSaldo: meses,
      excedenteExpiraKwh: round2(excedente),
      cliente: nome,
      ucs,
    },
    impactoFinanceiro: ehCancel ? 0 : round2(excedente * opts.tarifaRef),
  };
}

// #7 — Crédito acumulado muito acima do consumo (risco de expiração SCEE).
// Dedup por TITULAR: quando o mesmo dono tem 2+ UCs com crédito em LOCKSTEP
// (<5% de diferença), é o saldo do titular replicado por UC — conta UMA vez.
export function regraConsumoCreditoIncompativel(
  rateios: RateioRow[],
  opts: RegrasOpts,
): Finding[] {
  const recente = competenciasOrdenadas(rateios)[0] ?? null;
  if (!recente) return [];
  const rows = rateios.filter(
    (r) => r.competencia === recente && r.creditosAcumulados > 0,
  );
  const porDoc = new Map<string, RateioRow[]>();
  for (const r of rows) {
    const doc = soDigitos(r.ownerDocument) || r.installation;
    const arr = porDoc.get(doc) ?? [];
    arr.push(r);
    porDoc.set(doc, arr);
  }
  const out: Finding[] = [];
  for (const [doc, linhas] of porDoc) {
    const creditos = linhas.map((l) => l.creditosAcumulados);
    const max = Math.max(...creditos);
    const min = Math.min(...creditos);
    const lockstep = linhas.length >= 2 && max > 0 && (max - min) / max < 0.05;
    if (lockstep) {
      // Crédito do titular (replicado): conta o saldo 1x e soma o consumo das UCs.
      const consumoTitular = linhas.reduce((s, l) => s + l.consumoKwh, 0);
      const ehCancel = linhas.every((l) => /cancel/i.test(l.installation));
      const f = avaliarCredito(
        doc,
        max,
        consumoTitular,
        recente,
        linhas[0].ownerName,
        linhas.map((l) => l.installation),
        ehCancel,
        opts,
      );
      if (f) out.push(f);
    } else {
      for (const r of linhas) {
        const f = avaliarCredito(
          r.installation,
          r.creditosAcumulados,
          r.consumoKwh,
          recente,
          r.ownerName,
          [r.installation],
          /cancel/i.test(r.installation),
          opts,
        );
        if (f) out.push(f);
      }
    }
  }
  return out;
}

// FIN-1 — Desconto efetivo abaixo do contratado (consistência interna do boleto).
// efetivo = amount_saved / total_amount_without_discount; compara com agent_discount.
// Só alerta quando o cliente recebeu MENOS desconto que o declarado na fatura.
// Pula encerramento (agent_discount ≥ 99%), que tem lógica de cobrança própria.
export function regraDescontoAbaixoContratado(
  faturas: FaturaRow[],
  opts: RegrasOpts,
): Finding[] {
  const recente = competenciasOrdenadas(faturas)[0] ?? null;
  if (!recente) return [];
  const out: Finding[] = [];
  for (const f of faturas) {
    if (f.competencia !== recente) continue;
    if (f.agentDiscountPct == null || f.totalSemDesconto == null) continue;
    if (f.totalSemDesconto <= 0) continue;
    if (f.agentDiscountPct >= 99) continue; // encerramento
    const efetivoPct = (f.economia / f.totalSemDesconto) * 100;
    if (efetivoPct < f.agentDiscountPct - opts.tolDescontoPct) {
      const esperadoBrl = (f.agentDiscountPct / 100) * f.totalSemDesconto;
      out.push({
        regra: "desconto_abaixo_contratado",
        severidade: "alta",
        entidade: "fatura",
        entidadeRef: f.installationNumber ?? `bill ${f.dgBillId}`,
        competencia: recente,
        titulo: `Desconto efetivo ${round2(efetivoPct)}% abaixo do contratado ${round2(f.agentDiscountPct)}%`,
        detalhe: {
          dgBillId: f.dgBillId,
          descontoEfetivoPct: round2(efetivoPct),
          descontoContratadoPct: round2(f.agentDiscountPct),
          economiaObtida: round2(f.economia),
          economiaEsperada: round2(esperadoBrl),
        },
        impactoFinanceiro: round2(Math.max(0, esperadoBrl - f.economia)),
      });
    }
  }
  return out;
}

// FIN-2 — Cobrança não fecha (consistência aritmética do boleto):
// total_value ≈ total_amount_without_discount − amount_saved + lightning + extra_charges.
export function regraCobrancaInconsistente(
  faturas: FaturaRow[],
  opts: RegrasOpts,
): Finding[] {
  const recente = competenciasOrdenadas(faturas)[0] ?? null;
  if (!recente) return [];
  const out: Finding[] = [];
  for (const f of faturas) {
    if (f.competencia !== recente) continue;
    if (f.totalSemDesconto == null) continue;
    if (f.agentDiscountPct != null && f.agentDiscountPct >= 99) continue; // encerramento
    const esperado =
      f.totalSemDesconto - f.economia + f.lightning + f.extraCharges;
    const dif = f.valorTotal - esperado;
    if (Math.abs(dif) > opts.tolCobrancaBrl) {
      out.push({
        regra: "cobranca_inconsistente",
        severidade: "alta",
        entidade: "fatura",
        entidadeRef: f.installationNumber ?? `bill ${f.dgBillId}`,
        competencia: recente,
        titulo: `Cobrança não fecha: total R$ ${round2(f.valorTotal)} vs esperado R$ ${round2(esperado)} (dif R$ ${round2(dif)})`,
        detalhe: {
          dgBillId: f.dgBillId,
          totalCobrado: round2(f.valorTotal),
          totalEsperado: round2(esperado),
          totalSemDesconto: round2(f.totalSemDesconto),
          economia: round2(f.economia),
          lightning: round2(f.lightning),
          extraCharges: round2(f.extraCharges),
        },
        impactoFinanceiro: round2(Math.abs(dif)),
      });
    }
  }
  return out;
}

// #10 — Fatura sem UC correspondente no cadastro.
export function regraFaturaSemUc(
  faturas: FaturaRow[],
  ucs: UcRow[],
): Finding[] {
  const ucCodes = new Set(ucs.map((u) => u.codigoInstalacao).filter(Boolean));
  const vistos = new Set<string>();
  const out: Finding[] = [];
  for (const f of faturas) {
    const inst = f.installationNumber ?? "";
    if (!inst || ucCodes.has(inst) || vistos.has(inst)) continue;
    vistos.add(inst);
    out.push({
      regra: "fatura_sem_uc",
      severidade: "media",
      entidade: "fatura",
      entidadeRef: inst,
      competencia: f.competencia || null,
      titulo: `Fatura(s) sem UC cadastrada (instalação ${inst})`,
      detalhe: { exemploDgBillId: f.dgBillId },
      impactoFinanceiro: 0,
    });
  }
  return out;
}

// #11 — Fatura duplicada (mesma UC + competência com mais de uma fatura).
export function regraFaturaDuplicada(faturas: FaturaRow[]): Finding[] {
  const grupos = new Map<string, FaturaRow[]>();
  for (const f of faturas) {
    const inst = f.installationNumber ?? "";
    if (!inst || !f.competencia) continue;
    const k = `${inst}|${f.competencia}`;
    const arr = grupos.get(k) ?? [];
    arr.push(f);
    grupos.set(k, arr);
  }
  const out: Finding[] = [];
  for (const [k, linhas] of grupos) {
    if (linhas.length <= 1) continue;
    const [inst, competencia] = k.split("|");
    const ordenadas = [...linhas].sort((a, b) => a.dgBillId - b.dgBillId);
    // Impacto = soma dos valores das faturas excedentes (além da primeira).
    const excedente = ordenadas
      .slice(1)
      .reduce((s, f) => s + (f.valorTotal ?? 0), 0);
    out.push({
      regra: "fatura_duplicada",
      severidade: "critica",
      entidade: "fatura",
      entidadeRef: inst,
      competencia,
      titulo: `Fatura duplicada: ${linhas.length} faturas para ${inst} em ${competencia}`,
      detalhe: {
        dgBillIds: ordenadas.map((f) => f.dgBillId),
        valores: ordenadas.map((f) => round2(f.valorTotal)),
      },
      impactoFinanceiro: round2(excedente),
    });
  }
  return out;
}

// #12 — Competência incorreta (vazia ou incoerente com o vencimento).
export function regraCompetenciaIncorreta(faturas: FaturaRow[]): Finding[] {
  const out: Finding[] = [];
  for (const f of faturas) {
    const inst = f.installationNumber ?? `bill ${f.dgBillId}`;
    if (!f.competencia) {
      out.push({
        regra: "competencia_incorreta",
        severidade: "info",
        entidade: "fatura",
        entidadeRef: inst,
        competencia: null,
        titulo: `Fatura sem competência (bill ${f.dgBillId})`,
        detalhe: { dgBillId: f.dgBillId, vencimento: f.vencimento },
        impactoFinanceiro: 0,
      });
      continue;
    }
    // Vencimento costuma cair no mês da competência ou no seguinte.
    if (f.vencimento && /^\d{4}-\d{2}/.test(f.vencimento)) {
      const venc = f.vencimento.slice(0, 7);
      const lag = mesesEntre(f.competencia, venc);
      if (lag !== null && (lag < 0 || lag > 2)) {
        out.push({
          regra: "competencia_incorreta",
          severidade: "info",
          entidade: "fatura",
          entidadeRef: inst,
          competencia: f.competencia,
          titulo: `Vencimento distante da competência (${lag} meses)`,
          detalhe: {
            dgBillId: f.dgBillId,
            competencia: f.competencia,
            vencimento: f.vencimento,
          },
          impactoFinanceiro: 0,
        });
      }
    }
  }
  return out;
}

// #14 — Crédito parado (saldo não-decrescente em N competências, sem consumo o suficiente).
export function regraCreditoParado(
  rateios: RateioRow[],
  opts: RegrasOpts,
): Finding[] {
  const porInst = new Map<string, RateioRow[]>();
  for (const r of rateios) {
    const arr = porInst.get(r.installation) ?? [];
    arr.push(r);
    porInst.set(r.installation, arr);
  }
  const out: Finding[] = [];
  for (const [inst, linhas] of porInst) {
    const serie = [...linhas].sort((a, b) =>
      a.competencia.localeCompare(b.competencia),
    );
    if (serie.length < opts.minCompetenciasTendencia) continue;
    const ultimas = serie.slice(-opts.minCompetenciasTendencia);
    const naoDecresce = ultimas.every(
      (r, i) => i === 0 || r.creditosAcumulados >= ultimas[i - 1].creditosAcumulados,
    );
    const ultimo = ultimas[ultimas.length - 1];
    const consumoMedio =
      ultimas.reduce((s, r) => s + r.consumoKwh, 0) / ultimas.length;
    if (
      naoDecresce &&
      ultimo.creditosAcumulados > 0 &&
      ultimo.creditosAcumulados > 2 * consumoMedio
    ) {
      out.push({
        regra: "credito_parado",
        severidade: "alta",
        entidade: "uc",
        entidadeRef: inst,
        competencia: ultimo.competencia,
        titulo: `Crédito parado/acumulando há ${ultimas.length} competências (${round2(ultimo.creditosAcumulados)} kWh)`,
        detalhe: {
          cliente: ultimo.ownerName,
          serie: ultimas.map((r) => ({
            competencia: r.competencia,
            creditos: round2(r.creditosAcumulados),
            consumo: round2(r.consumoKwh),
          })),
          consumoMedioKwh: round2(consumoMedio),
        },
        impactoFinanceiro: round2(ultimo.creditosAcumulados * opts.tarifaRef),
      });
    }
  }
  return out;
}

// Diagnóstico do otimizador: UC subalocada (consumo > cobertura recorrente).
export function diagUcSubalocada(rateios: RateioRow[]): Finding[] {
  const recente = competenciasOrdenadas(rateios)[0] ?? null;
  if (!recente) return [];
  const out: Finding[] = [];
  for (const r of rateios) {
    if (r.competencia !== recente) continue;
    // `covering` < consumo sugere UC que consome mais do que recebe.
    if (r.consumoKwh > 0 && r.covering > 0 && r.covering < r.consumoKwh * 0.9) {
      out.push({
        regra: "uc_subalocada",
        severidade: "media",
        entidade: "uc",
        entidadeRef: r.installation,
        competencia: recente,
        titulo: `UC possivelmente subalocada (cobertura ${round2(r.covering)} < consumo ${round2(r.consumoKwh)})`,
        detalhe: { covering: round2(r.covering), consumoKwh: round2(r.consumoKwh), cliente: r.ownerName },
        impactoFinanceiro: 0,
      });
    }
  }
  return out;
}

// ===== Orquestração das regras (pura) =====

export function rodarRegras(
  rateios: RateioRow[],
  faturas: FaturaRow[],
  ucs: UcRow[],
  opts: RegrasOpts,
): Finding[] {
  const generatorNumbers = new Set(
    rateios.map((r) => r.generatorNumber).filter((g): g is string => !!g),
  );
  return [
    ...regraUcSemRateio(rateios, ucs, generatorNumbers, opts),
    ...regraConsumoCreditoIncompativel(rateios, opts),
    ...regraFaturaSemUc(faturas, ucs),
    ...regraFaturaDuplicada(faturas),
    ...regraCompetenciaIncorreta(faturas),
    ...regraCreditoParado(rateios, opts),
    // PENDENTE DE CALIBRAÇÃO (desativadas do relatório, código mantido):
    // a 1ª execução real mostrou falso-positivo sistemático nas UCs de alto
    // consumo (efetivo ~24,3% vs 30%; cobrança esperada ≫ cobrada) — a fórmula
    // ignora a energia compensada por crédito. Reativar após `db:reconciliar-fatura`
    // identificar o termo que falta:
    //   ...regraDescontoAbaixoContratado(faturas, opts),
    //   ...regraCobrancaInconsistente(faturas, opts),
  ];
  // Regras DESATIVADAS após inspeção dos dados reais (2026-06) — a semântica do
  // Digital Grid não sustenta o alerta; funções mantidas para teste/uso futuro:
  //  • regraSomaPercentual  — `percentage` não particiona 100% por gerador
  //    (UCs compartilhadas entre usinas; soma dá 100/150/200%).
  //  • regraRateioDuplicado — multi-gerador por UC é NORMAL na geração
  //    compartilhada (confirmado pelo negócio).
  //  • diagUcSubalocada     — `covering` é um índice/ratio do DG (0–3), não kWh.
}

export const ORDEM_SEVERIDADE: Record<Severidade, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  info: 3,
};

// "2025-09" → diferença de meses até "2025-11" = 2.
function mesesEntre(compA: string, compB: string): number | null {
  const a = /^(\d{4})-(\d{2})/.exec(compA);
  const b = /^(\d{4})-(\d{2})/.exec(compB);
  if (!a || !b) return null;
  return (
    (Number(b[1]) - Number(a[1])) * 12 + (Number(b[2]) - Number(a[2]))
  );
}
