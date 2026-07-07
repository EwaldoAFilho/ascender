// Financeiro (client-safe — opera sobre o preço final, não sobre o custo).
// Portado do gerador estático.

import { CO2F, DEG, FMES, REA } from "./constantes";
import type { ProjecaoAno } from "./types";

// Payback simples em anos.
export function payback(precoFinal: number, retornoMensal: number): number {
  if (retornoMensal <= 0) return Infinity;
  return precoFinal / retornoMensal / 12;
}

// TIR por bisseção (mesma lógica do gerador original).
export function calcularTir(
  investimento: number,
  geracaoAnualKwh: number,
  tarifa: number,
  anos = 25,
): number {
  let lo = 0;
  let hi = 200;
  for (let i = 0; i < 60; i++) {
    const meio = (lo + hi) / 2;
    const r = meio / 100;
    let vpl = -investimento;
    for (let t = 1; t <= anos; t++) {
      vpl +=
        (geracaoAnualKwh * tarifa * Math.pow(1 + REA, t - 1) * Math.pow(1 - DEG, t - 1)) /
        Math.pow(1 + r, t);
    }
    if (vpl > 0) lo = meio;
    else hi = meio;
  }
  return (lo + hi) / 2;
}

// Economia/receita acumulada em 25 anos (reajuste + degradação).
export function retornoAcumulado25(retornoAnualBase: number): number {
  let total = 0;
  for (let i = 0; i < 25; i++) {
    total += retornoAnualBase * Math.pow(1 + REA, i) * Math.pow(1 - DEG, i);
  }
  return total;
}

// CO2 evitado (toneladas) ao longo de 25 anos.
export function co2Evitado25(geracaoAnualKwh: number): number {
  return (geracaoAnualKwh * 25 * (1 - DEG) * CO2F) / 1000;
}

// Projeção ano a ano (para o gráfico de retorno).
export function projecao25Anos(
  retornoAnualBase: number,
  investimento: number,
): ProjecaoAno[] {
  const linhas: ProjecaoAno[] = [];
  let acumulado = 0;
  for (let i = 1; i <= 25; i++) {
    acumulado += retornoAnualBase * Math.pow(1 + REA, i) * Math.pow(1 - DEG, i);
    linhas.push({
      ano: i,
      acumuladoRetorno: Math.round(acumulado),
      retornoLiquido: Math.round(acumulado - investimento),
    });
  }
  return linhas;
}

// Curva de geração mensal (12 meses) a partir da média mensal.
export function geracaoMensalPorMes(geracaoMediaMensal: number): number[] {
  return FMES.map((f) => Math.round(geracaoMediaMensal * f));
}
