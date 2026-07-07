// Orquestrador do gerador (SENSÍVEL — usa precificação).
// Puro: recebe entrada + parâmetros e devolve o resultado completo dos dois
// cenários. Importado apenas por código de servidor.

import { SEG, TEXC } from "./constantes";
import {
  calcularInversor,
  dimensionarPorConsumo,
  geracaoPorKwpMes,
  resolverInversor,
  totalTelhados,
} from "./dimensionamento";
import {
  co2Evitado25,
  calcularTir,
  geracaoMensalPorMes,
  payback,
  projecao25Anos,
  retornoAcumulado25,
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
} from "./types";

function montarCenario(args: {
  cenario: Cenario;
  potenciaKwp: number;
  qtdModulos: number;
  geracaoMensalKwh: number;
  inversor: InversorResultado;
  precoFinal: number;
  custo: CenarioResultado["custo"];
  tarifa: number;
  retornoMensal: number;
  retornoAnualBase: number;
  tirGeracaoAnual: number;
  co2GeracaoAnual: number;
  moduloWp: GeradorInput["moduloWp"];
  excedenteKwh: number;
  creditoExcedente: number;
}): CenarioResultado {
  const {
    cenario, potenciaKwp, qtdModulos, geracaoMensalKwh, inversor, precoFinal, custo,
    retornoMensal, retornoAnualBase, tarifa, tirGeracaoAnual, co2GeracaoAnual, moduloWp,
    excedenteKwh, creditoExcedente,
  } = args;

  const geracaoAnualKwh = geracaoMensalKwh * 12;
  return {
    cenario,
    potenciaKwp,
    qtdModulos,
    moduloWp,
    geracaoMensalKwh,
    geracaoAnualKwh,
    inversor,
    precoFinal,
    precoPorKwp: potenciaKwp > 0 ? precoFinal / potenciaKwp : 0,
    paybackAnos: payback(precoFinal, retornoMensal),
    tirPercent: calcularTir(precoFinal, tirGeracaoAnual, tarifa),
    economia25Anos: retornoAcumulado25(retornoAnualBase),
    co2Toneladas: co2Evitado25(co2GeracaoAnual),
    retornoMensal,
    excedenteKwh,
    creditoExcedente,
    geracaoMensalPorMes: geracaoMensalPorMes(geracaoMensalKwh),
    projecao25Anos: projecao25Anos(retornoAnualBase, precoFinal),
    custo,
  };
}

export function gerarResultado(
  input: GeradorInput,
  parametros: ParametrosProposta,
): GeradorResultado {
  const solo = input.instalacao === "solo";
  const gpk = geracaoPorKwpMes(input.hsp);
  const gpkSeg = gpk * SEG;

  // Dimensionamento pelo consumo.
  const nec = dimensionarPorConsumo(
    input.consumoKwh,
    input.compensacaoPct,
    input.hsp,
    input.moduloWp,
  );

  // Telhado disponível.
  const telhadosValidos = input.telhados.filter(
    (t) => t.largura > 0 && t.comprimento > 0,
  );
  const tot = totalTelhados(input.telhados, input.moduloWp);
  const temTelhado = tot.modulos > 0 && tot.potenciaKwp > 0;
  const geracaoTelhadoMes = tot.potenciaKwp * gpkSeg;
  const excedente = Math.max(0, geracaoTelhadoMes - input.consumoKwh);
  const credito = excedente * TEXC;

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
  const necessario = montarCenario({
    cenario: "necessario",
    potenciaKwp: nec.potenciaKwp,
    qtdModulos: nec.modulos,
    geracaoMensalKwh: nec.geracaoMensalKwh,
    inversor: calcularInversor(nec.potenciaKwp, tipo),
    precoFinal: custoNec.custoTotal + custoNec.margemValor,
    custo: custoNec,
    tarifa: input.tarifa,
    retornoMensal: economiaMensalNec,
    retornoAnualBase: nec.geracaoMensalKwh * 12 * input.tarifa,
    tirGeracaoAnual: nec.geracaoMensalKwh * 12,
    co2GeracaoAnual: nec.geracaoMensalKwh * 12,
    moduloWp: input.moduloWp,
    excedenteKwh: 0,
    creditoExcedente: 0,
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
    // Receita = compensa o próprio consumo + crédito do excedente.
    const receitaMensal = nec.geracaoMensalKwh * input.tarifa + credito;
    const retornoAnualBase = nec.geracaoMensalKwh * 12 * input.tarifa + credito * 12;
    rentavel = montarCenario({
      cenario: "rentavel",
      potenciaKwp: tot.potenciaKwp,
      qtdModulos: tot.modulos,
      geracaoMensalKwh: geracaoTelhadoMes,
      inversor: calcularInversor(tot.potenciaKwp, tipo),
      precoFinal: custoRent.custoTotal + custoRent.margemValor,
      custo: custoRent,
      tarifa: input.tarifa,
      retornoMensal: receitaMensal,
      retornoAnualBase,
      tirGeracaoAnual: input.tarifa > 0 ? retornoAnualBase / input.tarifa : 0,
      co2GeracaoAnual: tot.potenciaKwp * gpk * 12,
      moduloWp: input.moduloWp,
      excedenteKwh: excedente,
      creditoExcedente: credito,
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
