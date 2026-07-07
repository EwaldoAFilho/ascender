// Financeiro (client-safe — opera sobre o preço final, não sobre o custo).
// Modelado por FLUXO DE CAIXA ANUAL: cada cenário fornece uma função
// `fluxoAno(t)` que devolve o retorno nominal do ano t. Isso permite créditos
// que variam por ano (ex.: Fio B da Lei 14.300 no Telhado Rentável).

import { FMES } from "./constantes";
import type { ProjecaoAno } from "./types";

// Payback simples em anos (retorno mensal constante).
export function payback(precoFinal: number, retornoMensal: number): number {
  if (retornoMensal <= 0) return Infinity;
  return precoFinal / retornoMensal / 12;
}

// Payback pelo cruzamento do acumulado × investimento (interpolado no ano) —
// correto quando o retorno varia ano a ano.
export function paybackPorFluxo(
  investimento: number,
  fluxoAno: (t: number) => number,
  anosMax = 40,
): number {
  let acumulado = 0;
  for (let t = 1; t <= anosMax; t++) {
    const f = fluxoAno(t);
    if (f > 0 && acumulado + f >= investimento) {
      return t - 1 + (investimento - acumulado) / f;
    }
    acumulado += f;
  }
  return Infinity;
}

// TIR por bisseção sobre o fluxo de caixa.
export function tirPorFluxo(
  investimento: number,
  fluxoAno: (t: number) => number,
  anos = 25,
): number {
  let lo = 0;
  let hi = 200;
  for (let i = 0; i < 60; i++) {
    const meio = (lo + hi) / 2;
    const r = meio / 100;
    let vpl = -investimento;
    for (let t = 1; t <= anos; t++) {
      vpl += fluxoAno(t) / Math.pow(1 + r, t);
    }
    if (vpl > 0) lo = meio;
    else hi = meio;
  }
  return (lo + hi) / 2;
}

// Projeção ano a ano (para o gráfico) + total acumulado (usado como economia25).
export function projecaoPorFluxo(
  fluxoAno: (t: number) => number,
  investimento: number,
  anos = 25,
): { projecao: ProjecaoAno[]; total: number } {
  const projecao: ProjecaoAno[] = [];
  let acumulado = 0;
  for (let t = 1; t <= anos; t++) {
    acumulado += fluxoAno(t);
    projecao.push({
      ano: t,
      acumuladoRetorno: Math.round(acumulado),
      retornoLiquido: Math.round(acumulado - investimento),
    });
  }
  return { projecao, total: acumulado };
}

// CO2 evitado (toneladas) ao longo de `anos`.
export function co2Evitado(
  geracaoAnualKwh: number,
  degradacaoAnual: number,
  co2PorKwh: number,
  anos = 25,
): number {
  return (geracaoAnualKwh * anos * (1 - degradacaoAnual) * co2PorKwh) / 1000;
}

// Curva de geração mensal (12 meses) a partir da média mensal.
export function geracaoMensalPorMes(geracaoMediaMensal: number): number[] {
  return FMES.map((f) => Math.round(geracaoMediaMensal * f));
}
