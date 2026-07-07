// Precificação (SENSÍVEL — usa tabela de kit, custos e margem).
// Puro: recebe os parâmetros como argumento. Importado apenas por código de
// servidor. Portado do gerador estático (`calcCusto`).

import type { ParametrosProposta } from "./parametros";
import type { CustoDetalhado, Inversor } from "./types";

// Faixa da tabela de kit correspondente à potência (primeira faixa cujo teto
// cobre o kWp; acima da última, usa a última).
function faixaKit(kwp: number, p: ParametrosProposta) {
  for (const faixa of p.kit) {
    if (kwp <= faixa.kwpMax) return faixa;
  }
  return p.kit[p.kit.length - 1];
}

// R$/kWp do kit para a potência/inversor/instalação.
export function precoKitPorKwp(
  kwp: number,
  inversor: Inversor,
  solo: boolean,
  p: ParametrosProposta,
): number {
  const faixa = faixaKit(kwp, p);
  const base = inversor === "micro" ? faixa.precoMicro : faixa.precoString;
  const ajuste = inversor === "micro" ? p.ajusteMicro : p.ajusteString;
  return (solo ? base - p.soloDescontoKitKwp : base) + ajuste;
}

// Trifásico obrigatório para a potência (pela faixa de kit).
export function trifasicoObrigatorio(kwp: number, p: ParametrosProposta): boolean {
  return faixaKit(kwp, p).trifasicoObrigatorio;
}

// Custo detalhado do sistema.
export function calcularCusto(args: {
  kwp: number;
  inversor: Inversor;
  solo: boolean;
  qtdModulos: number;
  adequacaoValor: number; // 0 quando não incluída
  margemPercent: number;
  parametros: ParametrosProposta;
}): CustoDetalhado {
  const { kwp, inversor, solo, qtdModulos, adequacaoValor, margemPercent, parametros: p } = args;

  const precoPorKwpBase = precoKitPorKwp(kwp, inversor, solo, p);
  const kit = kwp * precoPorKwpBase;
  const estruturaSolo = solo ? qtdModulos * p.estruturaSoloPorModulo : 0;
  const maoDeObra = kwp * p.maoDeObraKwp;
  const materiaisAc = Math.max(p.materialAcMin, kwp * p.materialAcKwp);
  const baseImposto = maoDeObra + materiaisAc + adequacaoValor + estruturaSolo;
  const imposto = baseImposto * (p.impostoPercent / 100);
  const custoTotal =
    kit + maoDeObra + materiaisAc + adequacaoValor + estruturaSolo + imposto;
  const margemValor = custoTotal * (margemPercent / 100);
  const precoFinal = custoTotal + margemValor;
  const margemPercentFinal = precoFinal > 0 ? (margemValor / precoFinal) * 100 : 0;

  return {
    kit,
    estruturaSolo,
    maoDeObra,
    materiaisAc,
    adequacao: adequacaoValor,
    baseImposto,
    imposto,
    custoTotal,
    margemValor,
    margemPercent: margemPercentFinal,
    precoPorKwpBase,
  };
}
