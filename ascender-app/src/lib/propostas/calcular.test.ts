// Testes do orquestrador do gerador (SENSÍVEL): dois cenários, crédito do
// excedente e Fio B (Lei 14.300). Roda só no Node — nunca entra no bundle.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { gerarResultado } from "./calcular";
import { PARAMETROS_PADRAO } from "./parametros";
import type { GeradorInput, ParametrosProposta, Premissas } from "./types";

const perto = (real: number, esperado: number, tol = 1e-6) =>
  assert.ok(Math.abs(real - esperado) <= tol, `esperado ≈ ${esperado}, obtido ${real}`);

// gpk com segurança (HSP 5,5, PR 0,79, segurança 0,95) = 123,8325 kWh/kWp/mês
const GPK_SEG = 5.5 * 0.79 * 30 * 0.95;
const ANO = 2026;

const entrada = (over: Partial<GeradorInput> = {}): GeradorInput => ({
  instalacao: "telhado",
  moduloWp: 620,
  inversorForcado: "auto",
  consumoKwh: 500,
  compensacaoPct: 1,
  hsp: 5.5,
  tarifa: 1,
  telhados: [],
  adequacaoTrifasica: false,
  adequacaoValor: 3500,
  ...over,
});

const comPremissas = (over: Partial<Premissas>, base = PARAMETROS_PADRAO): ParametrosProposta => ({
  ...base,
  premissas: { ...base.premissas, ...over },
});

// Telhado grande: 17 × 4 = 68 módulos de 620 Wp (42,16 kWp) em Retrato.
const TELHADO_GRANDE = { largura: 20, comprimento: 10, aproveitamento: 100 };

describe("gerarResultado — Sistema Necessário", () => {
  it("dimensiona pelo consumo e o preço final = custo + margem", () => {
    const r = gerarResultado(entrada(), PARAMETROS_PADRAO, ANO);
    const n = r.necessario;
    assert.equal(n.cenario, "necessario");
    assert.equal(n.qtdModulos, 7);
    perto(n.potenciaKwp, 4.34);
    perto(n.geracaoMensalKwh, 4.34 * GPK_SEG);
    perto(n.geracaoAnualKwh, n.geracaoMensalKwh * 12);
    perto(n.precoFinal, n.custo.custoTotal + n.custo.margemValor);
    perto(n.precoPorKwp, n.precoFinal / n.potenciaKwp);
  });

  it("só o consumo vale tarifa cheia; a sobra é crédito de excedente", () => {
    // Geração 537,43 kWh > consumo 500: 500 × R$1 + 37,43 × R$0,40 (sem Fio B)
    const r = gerarResultado(entrada(), PARAMETROS_PADRAO, ANO);
    const geracao = 4.34 * GPK_SEG;
    perto(r.necessario.retornoMensal, 500 * 1 + (geracao - 500) * 0.4);
  });

  it("compensação de 110% não credita a geração extra à tarifa cheia", () => {
    const r = gerarResultado(entrada({ compensacaoPct: 1.1 }), PARAMETROS_PADRAO, ANO);
    const n = r.necessario;
    assert.equal(n.qtdModulos, 8); // 550 000 / 620 / 123,8325 = 7,16 → 8
    const geracao = 4.96 * GPK_SEG;
    perto(n.retornoMensal, 500 + (geracao - 500) * 0.4);
    assert.ok(n.retornoMensal < geracao * 1, "não pode super-creditar à tarifa cheia");
  });

  it("compensação abaixo de 100%: tudo que gera vale tarifa cheia", () => {
    const r = gerarResultado(entrada({ compensacaoPct: 0.8 }), PARAMETROS_PADRAO, ANO);
    const geracao = 3.72 * GPK_SEG; // 6 módulos
    assert.ok(geracao < 500);
    perto(r.necessario.retornoMensal, geracao * 1);
  });

  it("usa payback simples (preço / retorno mensal / 12)", () => {
    const n = gerarResultado(entrada(), PARAMETROS_PADRAO, ANO).necessario;
    perto(n.paybackAnos, n.precoFinal / n.retornoMensal / 12);
  });

  it("projeção de 25 anos consistente com a economia total", () => {
    const n = gerarResultado(entrada(), PARAMETROS_PADRAO, ANO).necessario;
    assert.equal(n.projecao25Anos.length, 25);
    assert.equal(n.projecao25Anos[24].acumuladoRetorno, Math.round(n.economia25Anos));
    assert.equal(n.geracaoMensalPorMes.length, 12);
    assert.equal(n.excedenteKwh, 0);
    assert.equal(n.creditoExcedente, 0);
  });

  it("não inclui adequação trifásica (só o Telhado Rentável inclui)", () => {
    const r = gerarResultado(
      entrada({ adequacaoTrifasica: true, telhados: [TELHADO_GRANDE] }),
      PARAMETROS_PADRAO,
      ANO,
    );
    assert.equal(r.necessario.custo.adequacao, 0);
    assert.equal(r.rentavel?.custo.adequacao, 3500);
  });
});

describe("gerarResultado — Telhado Rentável", () => {
  it("sem telhado não há cenário rentável", () => {
    const r = gerarResultado(entrada(), PARAMETROS_PADRAO, ANO);
    assert.equal(r.rentavel, null);
    assert.equal(r.telhadoSuficiente, null);
    assert.equal(r.telhadoTotalModulos, 0);
  });

  it("usa todo o telhado: autoconsumo à tarifa + excedente a crédito", () => {
    const r = gerarResultado(entrada({ telhados: [TELHADO_GRANDE] }), PARAMETROS_PADRAO, ANO);
    const rent = r.rentavel;
    assert.ok(rent);
    assert.equal(rent.qtdModulos, 68);
    perto(rent.potenciaKwp, 42.16);
    const geracao = 42.16 * GPK_SEG;
    perto(rent.geracaoMensalKwh, geracao);
    perto(rent.excedenteKwh, geracao - 500);
    perto(rent.creditoExcedente, (geracao - 500) * 0.4);
    perto(rent.retornoMensal, 500 * 1 + (geracao - 500) * 0.4);
    assert.equal(r.telhadoSuficiente, true);
  });

  it("telhado pequeno: suficiente = false e sem excedente", () => {
    const r = gerarResultado(
      entrada({ telhados: [{ largura: 2.4, comprimento: 4.6, aproveitamento: 100 }] }),
      PARAMETROS_PADRAO,
      ANO,
    );
    assert.equal(r.telhadoSuficiente, false); // 4 módulos < 7
    assert.equal(r.rentavel?.excedenteKwh, 0);
  });

  it("aplica a margem própria do rentável", () => {
    const p = { ...PARAMETROS_PADRAO, margemPercentRentavel: 30 };
    const rent = gerarResultado(entrada({ telhados: [TELHADO_GRANDE] }), p, ANO).rentavel;
    assert.ok(rent);
    perto(rent.custo.margemValor, rent.custo.custoTotal * 0.3);
  });

  it("3+ telhados forçam microinversor nos dois cenários", () => {
    const t = { largura: 5, comprimento: 5, aproveitamento: 100 };
    const r = gerarResultado(entrada({ telhados: [t, t, t] }), PARAMETROS_PADRAO, ANO);
    assert.equal(r.microForcado, true);
    assert.equal(r.necessario.inversor.tipo, "micro");
    assert.equal(r.rentavel?.inversor.tipo, "micro");
  });
});

describe("gerarResultado — Fio B (Lei 14.300)", () => {
  const telhado = entrada({ telhados: [TELHADO_GRANDE] });

  it("tarifa Fio B padrão (0) não altera o crédito", () => {
    const rent = gerarResultado(telhado, PARAMETROS_PADRAO, ANO).rentavel;
    perto(rent!.creditoExcedente, rent!.excedenteKwh * 0.4);
  });

  it("desconta Fio B × fração do cronograma no ano da proposta", () => {
    // 2026 = índice 3 do cronograma → 60%: 0,40 − 0,20 × 0,6 = 0,28
    const p = comPremissas({ tarifaFioB: 0.2 });
    const rent = gerarResultado(telhado, p, 2026).rentavel!;
    perto(rent.creditoExcedente, rent.excedenteKwh * 0.28);
  });

  it("após o fim do cronograma usa o último valor (100%)", () => {
    const p = comPremissas({ tarifaFioB: 0.2 });
    const rent = gerarResultado(telhado, p, 2035).rentavel!;
    perto(rent.creditoExcedente, rent.excedenteKwh * 0.2);
  });

  it("antes do ano-base não há Fio B", () => {
    const p = comPremissas({ tarifaFioB: 0.2 });
    const rent = gerarResultado(telhado, p, 2020).rentavel!;
    perto(rent.creditoExcedente, rent.excedenteKwh * 0.4);
  });

  it("crédito nunca fica negativo", () => {
    const p = comPremissas({ tarifaFioB: 1 });
    const rent = gerarResultado(telhado, p, 2026).rentavel!;
    assert.equal(rent.creditoExcedente, 0);
  });

  it("desativado (fioBAtivo=false) ignora a tarifa", () => {
    const p = comPremissas({ tarifaFioB: 0.2, fioBAtivo: false });
    const rent = gerarResultado(telhado, p, 2026).rentavel!;
    perto(rent.creditoExcedente, rent.excedenteKwh * 0.4);
  });

  it("Fio B ativo reduz a economia em 25 anos e alonga o payback", () => {
    const sem = gerarResultado(telhado, PARAMETROS_PADRAO, 2026).rentavel!;
    const com = gerarResultado(telhado, comPremissas({ tarifaFioB: 0.2 }), 2026).rentavel!;
    assert.ok(com.economia25Anos < sem.economia25Anos);
    assert.ok(com.paybackAnos > sem.paybackAnos);
    assert.ok(com.tirPercent < sem.tirPercent);
  });

  it("Fio B também incide no excedente do Sistema Necessário", () => {
    const p = comPremissas({ tarifaFioB: 0.2 });
    const n = gerarResultado(entrada(), p, 2026).necessario;
    const geracao = 4.34 * GPK_SEG;
    perto(n.retornoMensal, 500 + (geracao - 500) * 0.28);
  });
});

describe("gerarResultado — alertas", () => {
  it("trifásico obrigatório pela potência do Sistema Necessário", () => {
    assert.equal(gerarResultado(entrada(), PARAMETROS_PADRAO, ANO).trifasicoObrigatorio, false);
    // 2000 kWh → 27 módulos = 16,74 kWp (> 14 kWp)
    const r = gerarResultado(entrada({ consumoKwh: 2000 }), PARAMETROS_PADRAO, ANO);
    assert.equal(r.necessario.qtdModulos, 27);
    assert.equal(r.trifasicoObrigatorio, true);
  });

  it("não altera os parâmetros recebidos", () => {
    const antes = JSON.stringify(PARAMETROS_PADRAO);
    gerarResultado(entrada({ telhados: [TELHADO_GRANDE] }), PARAMETROS_PADRAO, ANO);
    assert.equal(JSON.stringify(PARAMETROS_PADRAO), antes);
  });
});
