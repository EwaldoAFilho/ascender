// Orquestrador do gerador (SENSÍVEL — usa precificação).
// Puro: recebe entrada + parâmetros (+ ano da proposta) e devolve o resultado
// completo dos dois cenários. Importado apenas por código de servidor.

import {
  calcularInversor,
  dimensionarPorConsumo,
  geracaoPorKwpMes,
  resolverInversor,
  totalTelhados,
} from "./dimensionamento";
import {
  co2Evitado,
  geracaoMensalPorMes,
  payback,
  paybackPorFluxo,
  projecaoPorFluxo,
  tirPorFluxo,
} from "./financeiro";
import { calcularCusto, trifasicoObrigatorio } from "./precificacao";
import type { ParametrosProposta } from "./parametros";
import type {
  Cenario,
  CenarioResultado,
  GeradorInput,
  GeradorResultado,
  Inversor,
  InversorResultado,
  Premissas,
} from "./types";

// Fração do Fio B (Lei 14.300) cobrada no ano-calendário informado.
function fioBPercentual(anoCalendario: number, p: Premissas): number {
  if (!p.fioBAtivo || !p.cronogramaFioB.length) return 0;
  const idx = Math.min(
    Math.max(anoCalendario - p.anoBaseFioB, 0),
    p.cronogramaFioB.length - 1,
  );
  return p.cronogramaFioB[idx];
}

// Crédito unitário (R$/kWh, em valor do 1º ano) do excedente, líquido do Fio B,
// no ano-calendário informado.
function creditoUnitarioReal(anoCalendario: number, p: Premissas): number {
  return Math.max(0, p.creditoExcedenteBaseKwh - p.tarifaFioB * fioBPercentual(anoCalendario, p));
}

function montarCenario(args: {
  cenario: Cenario;
  potenciaKwp: number;
  qtdModulos: number;
  geracaoMensalKwh: number;
  inversor: InversorResultado;
  precoFinal: number;
  custo: CenarioResultado["custo"];
  moduloWp: GeradorInput["moduloWp"];
  retornoMensal: number;
  fluxoAno: (t: number) => number;
  paybackSimples: boolean;
  co2GeracaoAnual: number;
  excedenteKwh: number;
  creditoExcedente: number;
  premissas: Premissas;
}): CenarioResultado {
  const {
    cenario, potenciaKwp, qtdModulos, geracaoMensalKwh, inversor, precoFinal, custo, moduloWp,
    retornoMensal, fluxoAno, paybackSimples, co2GeracaoAnual, excedenteKwh, creditoExcedente,
    premissas,
  } = args;

  const { projecao, total } = projecaoPorFluxo(fluxoAno, precoFinal);
  return {
    cenario,
    potenciaKwp,
    qtdModulos,
    moduloWp,
    geracaoMensalKwh,
    geracaoAnualKwh: geracaoMensalKwh * 12,
    inversor,
    precoFinal,
    precoPorKwp: potenciaKwp > 0 ? precoFinal / potenciaKwp : 0,
    paybackAnos: paybackSimples
      ? payback(precoFinal, retornoMensal)
      : paybackPorFluxo(precoFinal, fluxoAno),
    tirPercent: tirPorFluxo(precoFinal, fluxoAno),
    economia25Anos: total,
    co2Toneladas: co2Evitado(co2GeracaoAnual, premissas.degradacaoAnual, premissas.co2PorKwh),
    retornoMensal,
    excedenteKwh,
    creditoExcedente,
    geracaoMensalPorMes: geracaoMensalPorMes(geracaoMensalKwh),
    projecao25Anos: projecao,
    custo,
  };
}

export function gerarResultado(
  input: GeradorInput,
  parametros: ParametrosProposta,
  anoProposta: number,
): GeradorResultado {
  const prem = parametros.premissas;
  const solo = input.instalacao === "solo";
  const gpk = geracaoPorKwpMes(input.hsp, prem.performanceRatio);

  // Dimensionamento pelo consumo.
  const nec = dimensionarPorConsumo(
    input.consumoKwh,
    input.compensacaoPct,
    input.hsp,
    input.moduloWp,
    prem.performanceRatio,
    prem.margemSeguranca,
  );

  // Telhado disponível.
  const telhadosValidos = input.telhados.filter((t) => t.largura > 0 && t.comprimento > 0);
  const tot = totalTelhados(input.telhados, input.moduloWp);
  const temTelhado = tot.modulos > 0 && tot.potenciaKwp > 0;
  const geracaoTelhadoMes = tot.potenciaKwp * gpk * prem.margemSeguranca;
  const excedente = Math.max(0, geracaoTelhadoMes - input.consumoKwh);

  // Fatores de crescimento/degradação por ano.
  const cresc = (t: number) => Math.pow(1 + prem.reajusteTarifario, t - 1);
  const degr = (t: number) => Math.pow(1 - prem.degradacaoAnual, t - 1);

  // Inversor (tipo resolvido uma vez; disjuntor por potência).
  const tipo: Inversor = resolverInversor(telhadosValidos.length, input.inversorForcado);

  // ── Sistema Necessário ──
  const custoNec = calcularCusto({
    kwp: nec.potenciaKwp,
    inversor: tipo,
    solo,
    qtdModulos: nec.modulos,
    adequacaoValor: 0,
    margemPercent: parametros.margemPercent,
    parametros,
  });
  const economiaMensalNec = nec.geracaoMensalKwh * input.tarifa;
  const fluxoNec = (t: number) => nec.geracaoMensalKwh * 12 * input.tarifa * cresc(t) * degr(t);
  const necessario = montarCenario({
    cenario: "necessario",
    potenciaKwp: nec.potenciaKwp,
    qtdModulos: nec.modulos,
    geracaoMensalKwh: nec.geracaoMensalKwh,
    inversor: calcularInversor(nec.potenciaKwp, tipo),
    precoFinal: custoNec.custoTotal + custoNec.margemValor,
    custo: custoNec,
    moduloWp: input.moduloWp,
    retornoMensal: economiaMensalNec,
    fluxoAno: fluxoNec,
    paybackSimples: true,
    co2GeracaoAnual: nec.geracaoMensalKwh * 12,
    excedenteKwh: 0,
    creditoExcedente: 0,
    premissas: prem,
  });

  // ── Telhado Rentável ──
  let rentavel: CenarioResultado | null = null;
  if (temTelhado) {
    const adequacaoValor = input.adequacaoTrifasica ? input.adequacaoValor : 0;
    const custoRent = calcularCusto({
      kwp: tot.potenciaKwp,
      inversor: tipo,
      solo,
      qtdModulos: tot.modulos,
      adequacaoValor,
      margemPercent: parametros.margemPercentRentavel,
      parametros,
    });

    // Crédito unitário do excedente no ano corrente (com Fio B do ano da proposta).
    const creditoUnitAno1 = creditoUnitarioReal(anoProposta, prem);
    const creditoMensal = excedente * creditoUnitAno1;
    const receitaMensal = nec.geracaoMensalKwh * input.tarifa + creditoMensal;

    // Fluxo anual: compensação do consumo + crédito do excedente (Fio B por ano).
    const fluxoRent = (t: number) => {
      const anoCal = anoProposta + (t - 1);
      const creditoUnit = creditoUnitarioReal(anoCal, prem);
      const compensacao = nec.geracaoMensalKwh * 12 * input.tarifa;
      const credito = excedente * 12 * creditoUnit;
      return (compensacao + credito) * cresc(t) * degr(t);
    };

    rentavel = montarCenario({
      cenario: "rentavel",
      potenciaKwp: tot.potenciaKwp,
      qtdModulos: tot.modulos,
      geracaoMensalKwh: geracaoTelhadoMes,
      inversor: calcularInversor(tot.potenciaKwp, tipo),
      precoFinal: custoRent.custoTotal + custoRent.margemValor,
      custo: custoRent,
      moduloWp: input.moduloWp,
      retornoMensal: receitaMensal,
      fluxoAno: fluxoRent,
      paybackSimples: false,
      co2GeracaoAnual: tot.potenciaKwp * gpk * 12,
      excedenteKwh: excedente,
      creditoExcedente: creditoMensal,
      premissas: prem,
    });
  }

  return {
    necessario,
    rentavel,
    telhados: tot.detalhes,
    telhadoTotalModulos: tot.modulos,
    telhadoTotalKwp: tot.potenciaKwp,
    telhadoSuficiente: temTelhado ? tot.modulos >= nec.modulos : null,
    trifasicoObrigatorio: trifasicoObrigatorio(nec.potenciaKwp, parametros),
    microForcado: telhadosValidos.length > 2,
  };
}
