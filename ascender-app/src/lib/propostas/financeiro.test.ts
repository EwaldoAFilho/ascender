// Testes das funções financeiras (client-safe: operam sobre o preço final).

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  co2Evitado,
  geracaoMensalPorMes,
  payback,
  paybackPorFluxo,
  projecaoPorFluxo,
  tirPorFluxo,
} from "./financeiro";

const perto = (real: number, esperado: number, tol = 1e-6) =>
  assert.ok(Math.abs(real - esperado) <= tol, `esperado ≈ ${esperado}, obtido ${real}`);

describe("payback (simples)", () => {
  it("preço / retorno mensal / 12", () => {
    perto(payback(12_000, 500), 2);
  });
  it("sem retorno → Infinity", () => {
    assert.equal(payback(12_000, 0), Infinity);
    assert.equal(payback(12_000, -10), Infinity);
  });
});

describe("paybackPorFluxo", () => {
  it("interpola dentro do ano em que o acumulado cruza o investimento", () => {
    // 400 + 400 = 800 no ano 2; faltam 200 de 400 no ano 3 → 2,5 anos
    perto(paybackPorFluxo(1000, () => 400), 2.5);
  });
  it("cruzamento exato no fim de um ano", () => {
    perto(paybackPorFluxo(1000, () => 500), 2);
  });
  it("fluxo crescente", () => {
    // 100, 200, 300, 400 → acumulado 600 após o ano 3; faltam 400 de 400 → 4
    perto(paybackPorFluxo(1000, (t) => 100 * t), 4);
  });
  it("nunca paga dentro do horizonte → Infinity", () => {
    assert.equal(paybackPorFluxo(1000, () => 0), Infinity);
    assert.equal(paybackPorFluxo(1000, () => 10, 40), Infinity);
  });
});

describe("tirPorFluxo", () => {
  it("recupera a taxa de uma anuidade conhecida (10% a.a.)", () => {
    let investimento = 0;
    for (let t = 1; t <= 25; t++) investimento += 100 / Math.pow(1.1, t);
    perto(tirPorFluxo(investimento, () => 100), 10, 1e-6);
  });

  it("VPL na TIR encontrada é ~zero", () => {
    const fluxo = (t: number) => 1500 * Math.pow(1.08, t - 1) * Math.pow(0.993, t - 1);
    const tir = tirPorFluxo(10_000, fluxo) / 100;
    let vpl = -10_000;
    for (let t = 1; t <= 25; t++) vpl += fluxo(t) / Math.pow(1 + tir, t);
    perto(vpl, 0, 1e-4);
  });

  it("sem retorno satura no limite inferior (0%)", () => {
    perto(tirPorFluxo(1000, () => 0), 0, 1e-9);
  });

  it("retorno absurdo satura no limite superior (200%)", () => {
    perto(tirPorFluxo(1, () => 1e9), 200, 1e-9);
  });
});

describe("projecaoPorFluxo", () => {
  it("acumula retorno ano a ano e desconta o investimento", () => {
    const { projecao, total } = projecaoPorFluxo(() => 100, 250, 3);
    assert.deepEqual(projecao, [
      { ano: 1, acumuladoRetorno: 100, retornoLiquido: -150 },
      { ano: 2, acumuladoRetorno: 200, retornoLiquido: -50 },
      { ano: 3, acumuladoRetorno: 300, retornoLiquido: 50 },
    ]);
    assert.equal(total, 300);
  });

  it("padrão de 25 anos; arredonda só a projeção, não o total", () => {
    const { projecao, total } = projecaoPorFluxo(() => 10.4, 0);
    assert.equal(projecao.length, 25);
    assert.equal(projecao[0].acumuladoRetorno, 10);
    perto(total, 260);
  });
});

describe("co2Evitado", () => {
  it("geração × anos × (1 − degradação) × fator / 1000", () => {
    perto(co2Evitado(1000, 0.007, 0.29), (1000 * 25 * 0.993 * 0.29) / 1000);
  });
});

describe("geracaoMensalPorMes", () => {
  it("aplica os fatores sazonais FMES e arredonda", () => {
    assert.deepEqual(
      geracaoMensalPorMes(1000),
      [1050, 1000, 980, 950, 920, 900, 910, 940, 970, 1010, 1040, 1060],
    );
  });
});
