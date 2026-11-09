// Testes da precificação (SENSÍVEL). Usam a tabela padrão do gerador original
// (PARAMETROS_PADRAO). Este arquivo roda só no Node — nunca entra no bundle.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PARAMETROS_PADRAO } from "./parametros";
import { calcularCusto, precoKitPorKwp, trifasicoObrigatorio } from "./precificacao";

const perto = (real: number, esperado: number, tol = 1e-6) =>
  assert.ok(Math.abs(real - esperado) <= tol, `esperado ≈ ${esperado}, obtido ${real}`);

const P = PARAMETROS_PADRAO;

describe("precoKitPorKwp", () => {
  it("o teto da faixa é inclusivo", () => {
    assert.equal(precoKitPorKwp(2.8, "micro", false, P), 1655.88);
    assert.equal(precoKitPorKwp(2.81, "micro", false, P), 1566.62);
  });

  it("diferencia string × micro", () => {
    assert.equal(precoKitPorKwp(10, "string", false, P), 1432.76);
    assert.equal(precoKitPorKwp(10, "micro", false, P), 1568.71);
  });

  it("acima da última faixa usa a última", () => {
    assert.equal(precoKitPorKwp(50, "micro", false, P), 1555.2);
    assert.equal(precoKitPorKwp(50, "string", false, P), 1384.56);
  });

  it("solo desconta R$/kWp do kit", () => {
    perto(precoKitPorKwp(4, "string", true, P), 1475.86 - 150);
  });

  it("soma o ajuste por tipo de inversor", () => {
    const p = { ...P, ajusteMicro: 10, ajusteString: -5 };
    perto(precoKitPorKwp(4, "micro", false, p), 1566.62 + 10);
    perto(precoKitPorKwp(4, "string", false, p), 1475.86 - 5);
  });
});

describe("trifasicoObrigatorio", () => {
  it("segue a flag da faixa (a partir de 14 kWp)", () => {
    assert.equal(trifasicoObrigatorio(14, P), false);
    assert.equal(trifasicoObrigatorio(14.01, P), true);
    assert.equal(trifasicoObrigatorio(100, P), true);
  });
});

describe("calcularCusto", () => {
  it("compõe kit, mão de obra, material AC, imposto e margem (telhado)", () => {
    const c = calcularCusto({
      kwp: 4.34,
      inversor: "string",
      solo: false,
      qtdModulos: 7,
      adequacaoValor: 0,
      margemPercent: 20,
      parametros: P,
    });
    const kit = 4.34 * 1475.86;
    const maoDeObra = 4.34 * 180;
    const materiaisAc = 1000; // max(1000, 4,34 × 130 = 564,2)
    const imposto = (maoDeObra + materiaisAc) * 0.09; // imposto NÃO incide no kit
    const custoTotal = kit + maoDeObra + materiaisAc + imposto;

    perto(c.kit, kit);
    perto(c.maoDeObra, maoDeObra);
    assert.equal(c.materiaisAc, materiaisAc);
    assert.equal(c.estruturaSolo, 0);
    perto(c.baseImposto, maoDeObra + materiaisAc);
    perto(c.imposto, imposto);
    perto(c.custoTotal, custoTotal);
    perto(c.margemValor, custoTotal * 0.2);
    assert.equal(c.precoPorKwpBase, 1475.86);
  });

  it("margem informada é markup sobre custo; a devolvida é % do preço final", () => {
    const c = calcularCusto({
      kwp: 10,
      inversor: "string",
      solo: false,
      qtdModulos: 17,
      adequacaoValor: 0,
      margemPercent: 20,
      parametros: P,
    });
    perto(c.margemPercent, (0.2 / 1.2) * 100); // 16,67%
  });

  it("material AC proporcional quando passa do mínimo", () => {
    const c = calcularCusto({
      kwp: 10,
      inversor: "string",
      solo: false,
      qtdModulos: 17,
      adequacaoValor: 0,
      margemPercent: 0,
      parametros: P,
    });
    perto(c.materiaisAc, 1300);
  });

  it("solo: estrutura por módulo + desconto no kit, ambos tributados como serviço", () => {
    const c = calcularCusto({
      kwp: 4.34,
      inversor: "string",
      solo: true,
      qtdModulos: 7,
      adequacaoValor: 3500,
      margemPercent: 0,
      parametros: P,
    });
    assert.equal(c.estruturaSolo, 7 * 150);
    perto(c.kit, 4.34 * (1475.86 - 150));
    assert.equal(c.adequacao, 3500);
    perto(c.baseImposto, 4.34 * 180 + 1000 + 3500 + 1050);
    assert.equal(c.margemValor, 0);
    assert.equal(c.margemPercent, 0);
  });

  it("potência zero não divide por zero", () => {
    const c = calcularCusto({
      kwp: 0,
      inversor: "string",
      solo: false,
      qtdModulos: 0,
      adequacaoValor: 0,
      margemPercent: 20,
      parametros: P,
    });
    // Material AC mínimo continua sendo cobrado.
    assert.equal(c.materiaisAc, 1000);
    assert.ok(Number.isFinite(c.margemPercent));
  });
});
