// Testes do motor de regras de auditoria (funções puras, sem banco).
// Fixtures sintéticas — os valores reais do Digital Grid não entram no repo.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { FaturaRow, RateioRow, UcRow } from "./queries";
import {
  calcularJuncao,
  competenciasOrdenadas,
  diagUcSubalocada,
  ehGeradoraOuConsorcio,
  inferirEscalaPercentual,
  montarDiagnostico,
  regraCompetenciaIncorreta,
  regraConsumoCreditoIncompativel,
  regraCreditoParado,
  regraDescontoAbaixoContratado,
  regraFaturaDuplicada,
  regraFaturaSemUc,
  regraRateioDuplicado,
  regraSomaPercentual,
  regraUcSemRateio,
  rodarRegras,
  soDigitos,
} from "./rules";
import { REGRAS_OPTS_PADRAO as OPTS } from "./types";

// ===== Fábricas de fixtures =====

const rateio = (over: Partial<RateioRow> = {}): RateioRow => ({
  competencia: "2026-05",
  installation: "100001",
  generatorNumber: "900001",
  usinaNome: "Usina A",
  ownerDocument: "111.111.111-11",
  ownerName: "Titular 1",
  percentual: 50,
  covering: 1,
  consumoKwh: 100,
  creditosAcumulados: 0,
  ...over,
});

const fatura = (over: Partial<FaturaRow> = {}): FaturaRow => ({
  dgBillId: 1,
  competencia: "2026-05",
  installationNumber: "100001",
  valorTotal: 200,
  valorPago: 0,
  economia: 0,
  consumoKwh: 100,
  vencimento: "2026-06-10",
  paymentStatus: "open",
  agentDiscountPct: null,
  totalSemDesconto: null,
  totalDistribuidor: 0,
  lightning: 0,
  extraCharges: 0,
  ...over,
});

const uc = (over: Partial<UcRow> = {}): UcRow => ({
  codigoInstalacao: "100001",
  ativo: true,
  consumoMedioKwh: 1000,
  clienteNome: "Cliente 1",
  documento: "111.111.111-11",
  ...over,
});

const regras = (fs: { regra: string }[]) => fs.map((f) => f.regra);

// ===== Utilitários =====

describe("soDigitos", () => {
  it("remove pontuação de CPF/CNPJ e tolera nulos", () => {
    assert.equal(soDigitos("12.345.678/0001-90"), "12345678000190");
    assert.equal(soDigitos(null), "");
    assert.equal(soDigitos(undefined), "");
  });
});

describe("competenciasOrdenadas", () => {
  it("distintas, mais recente primeiro, ignorando vazias", () => {
    assert.deepEqual(
      competenciasOrdenadas([
        { competencia: "2026-03" },
        { competencia: "2026-05" },
        { competencia: "" },
        { competencia: "2026-03" },
        { competencia: "2025-12" },
      ]),
      ["2026-05", "2026-03", "2025-12"],
    );
  });
});

// ===== Diagnóstico =====

describe("inferirEscalaPercentual", () => {
  it("valores ≤ 1,5 → fração 0–1 (fator 100)", () => {
    const r = inferirEscalaPercentual([rateio({ percentual: 0.5 }), rateio({ percentual: 0.3 })]);
    assert.equal(r.escala, "fracao_0_1");
    assert.equal(r.fatorPara100, 100);
    assert.equal(r.min, 0.3);
    assert.equal(r.max, 0.5);
  });
  it("valores até ~100 → percentual 0–100", () => {
    const r = inferirEscalaPercentual([rateio({ percentual: 50 }), rateio({ percentual: 30 })]);
    assert.equal(r.escala, "percentual_0_100");
    assert.equal(r.fatorPara100, 1);
  });
  it("acima de 100 ou sem dados → indefinida", () => {
    assert.equal(inferirEscalaPercentual([rateio({ percentual: 150 })]).escala, "indefinida");
    assert.equal(inferirEscalaPercentual([]).escala, "indefinida");
    assert.equal(inferirEscalaPercentual([rateio({ percentual: 0 })]).escala, "indefinida");
  });
});

describe("calcularJuncao", () => {
  it("mede a taxa de junção DG × cadastro por instalação e documento", () => {
    const j = calcularJuncao(
      [
        rateio({ installation: "1", ownerDocument: "111.111.111-11" }),
        rateio({ installation: "2", ownerDocument: "222.222.222-22" }),
      ],
      [fatura({ installationNumber: "1" }), fatura({ installationNumber: null })],
      [uc({ codigoInstalacao: "1", documento: "11111111111" })],
    );
    assert.equal(j.rateioInstalacoes, 2);
    assert.equal(j.rateioComUc, 1);
    assert.equal(j.rateioJoinPct, 50);
    assert.equal(j.faturaInstalacoes, 1);
    assert.equal(j.faturaJoinPct, 100);
    assert.equal(j.rateioDocumentos, 2);
    assert.equal(j.rateioComCliente, 1);
    assert.equal(j.documentoJoinPct, 50);
  });

  it("sem dados → 0%", () => {
    const j = calcularJuncao([], [], []);
    assert.equal(j.rateioJoinPct, 0);
    assert.equal(j.faturaJoinPct, 0);
  });
});

describe("montarDiagnostico", () => {
  it("contagens e competências mais recentes", () => {
    const d = montarDiagnostico(
      [rateio({ competencia: "2026-04" }), rateio({ competencia: "2026-05" })],
      [fatura({ competencia: "2026-03" })],
      [uc()],
    );
    assert.equal(d.rateios, 2);
    assert.equal(d.faturas, 1);
    assert.equal(d.ucsCadastradas, 1);
    assert.equal(d.competenciaRateioRecente, "2026-05");
    assert.equal(d.competenciaFaturaRecente, "2026-03");
  });
});

// ===== #2 UC sem rateio =====

describe("regraUcSemRateio", () => {
  const gens = new Set(["900001"]);

  it("aponta UC ativa sem rateio na competência mais recente", () => {
    const fs = regraUcSemRateio(
      [
        rateio({ installation: "100001", competencia: "2026-05" }),
        rateio({ installation: "100002", competencia: "2026-04" }), // só na antiga
      ],
      [uc({ codigoInstalacao: "100001" }), uc({ codigoInstalacao: "100002", consumoMedioKwh: 1000 })],
      gens,
      OPTS,
    );
    assert.equal(fs.length, 1);
    assert.equal(fs[0].entidadeRef, "100002");
    assert.equal(fs[0].competencia, "2026-05");
    assert.equal(fs[0].severidade, "alta");
    assert.equal(fs[0].impactoFinanceiro, 147); // 1000 × 0,98 × 0,15
  });

  it("ignora UC inativa, geradora e consórcio", () => {
    const fs = regraUcSemRateio(
      [rateio({ installation: "100001" })],
      [
        uc({ codigoInstalacao: "200001", ativo: false }),
        uc({ codigoInstalacao: "900001" }), // é gerador
        uc({ codigoInstalacao: "200002", clienteNome: "Consórcio Solar X" }),
        uc({ codigoInstalacao: "200003", clienteNome: "Associação ASES" }),
      ],
      gens,
      OPTS,
    );
    assert.deepEqual(fs, []);
  });

  it("sem rateios não gera achados", () => {
    assert.deepEqual(regraUcSemRateio([], [uc()], gens, OPTS), []);
  });
});

describe("ehGeradoraOuConsorcio", () => {
  it("reconhece por número de gerador ou nome do cliente", () => {
    const gens = new Set(["900001"]);
    assert.equal(ehGeradoraOuConsorcio(uc({ codigoInstalacao: "900001" }), gens), true);
    assert.equal(ehGeradoraOuConsorcio(uc({ clienteNome: "CONSORCIO Y" }), gens), true);
    assert.equal(ehGeradoraOuConsorcio(uc({ clienteNome: "Padaria Bases" }), gens), false);
    assert.equal(ehGeradoraOuConsorcio(uc({ clienteNome: null }), gens), false);
  });
});

// ===== #7 Crédito × consumo =====

describe("regraConsumoCreditoIncompativel", () => {
  it("crédito até 3× o consumo não alerta", () => {
    assert.deepEqual(
      regraConsumoCreditoIncompativel([rateio({ consumoKwh: 100, creditosAcumulados: 300 })], OPTS),
      [],
    );
  });

  it("crédito alto sem excedente além de 60 meses → média, sem impacto", () => {
    const [f] = regraConsumoCreditoIncompativel(
      [rateio({ consumoKwh: 100, creditosAcumulados: 400 })],
      OPTS,
    );
    assert.equal(f.severidade, "media");
    assert.equal(f.impactoFinanceiro, 0);
    assert.equal(f.detalhe.mesesDeSaldo, 4);
  });

  it("excedente que expira (SCEE 60 meses) → alta, impacto = excedente × tarifa", () => {
    const [f] = regraConsumoCreditoIncompativel(
      [rateio({ consumoKwh: 100, creditosAcumulados: 7000 })],
      OPTS,
    );
    assert.equal(f.severidade, "alta");
    assert.equal(f.detalhe.excedenteExpiraKwh, 1000); // 7000 − 60 × 100
    assert.equal(f.impactoFinanceiro, 980);
  });

  it("UC em encerramento (-CANCEL) é informativa e sem impacto", () => {
    const [f] = regraConsumoCreditoIncompativel(
      [rateio({ installation: "100001-CANCEL", consumoKwh: 100, creditosAcumulados: 7000 })],
      OPTS,
    );
    assert.equal(f.severidade, "info");
    assert.equal(f.impactoFinanceiro, 0);
  });

  it("consumo zero não é avaliado", () => {
    assert.deepEqual(
      regraConsumoCreditoIncompativel([rateio({ consumoKwh: 0, creditosAcumulados: 7000 })], OPTS),
      [],
    );
  });

  it("titular com UCs em lockstep conta o saldo uma vez e soma o consumo", () => {
    const fs = regraConsumoCreditoIncompativel(
      [
        rateio({ installation: "A", ownerDocument: "123", consumoKwh: 50, creditosAcumulados: 7000 }),
        rateio({ installation: "B", ownerDocument: "1-2-3", consumoKwh: 50, creditosAcumulados: 6900 }),
      ],
      OPTS,
    );
    assert.equal(fs.length, 1);
    assert.equal(fs[0].entidadeRef, "123 (2 UCs)");
    assert.equal(fs[0].detalhe.creditosAcumulados, 7000);
    assert.equal(fs[0].detalhe.consumoMensalKwh, 100);
    assert.equal(fs[0].impactoFinanceiro, 980);
  });

  it("mesmo titular sem lockstep avalia cada UC separadamente", () => {
    const fs = regraConsumoCreditoIncompativel(
      [
        rateio({ installation: "A", ownerDocument: "123", consumoKwh: 100, creditosAcumulados: 7000 }),
        rateio({ installation: "B", ownerDocument: "123", consumoKwh: 100, creditosAcumulados: 1000 }),
      ],
      OPTS,
    );
    assert.deepEqual(fs.map((f) => f.entidadeRef).sort(), ["A", "B"]);
  });

  it("só olha a competência mais recente", () => {
    const fs = regraConsumoCreditoIncompativel(
      [
        rateio({ competencia: "2026-04", consumoKwh: 100, creditosAcumulados: 7000 }),
        rateio({ competencia: "2026-05", installation: "outra", consumoKwh: 100, creditosAcumulados: 0 }),
      ],
      OPTS,
    );
    assert.deepEqual(fs, []);
  });
});

// ===== FIN-1 Desconto abaixo do contratado =====

describe("regraDescontoAbaixoContratado", () => {
  // Base de energia = sem desconto (1000) − distribuidora (200) = 800
  const base = { agentDiscountPct: 20, totalSemDesconto: 1000, totalDistribuidor: 200 };

  it("desconto efetivo abaixo do contratado → alta, impacto = diferença", () => {
    const [f] = regraDescontoAbaixoContratado([fatura({ ...base, economia: 100 })], OPTS);
    assert.equal(f.regra, "desconto_abaixo_contratado");
    assert.equal(f.detalhe.descontoEfetivoPct, 12.5);
    assert.equal(f.detalhe.economiaEsperada, 160);
    assert.equal(f.impactoFinanceiro, 60);
  });

  it("dentro da tolerância (2 p.p.) não alerta", () => {
    // 150 / 800 = 18,75% ≥ 20 − 2
    assert.deepEqual(regraDescontoAbaixoContratado([fatura({ ...base, economia: 150 })], OPTS), []);
  });

  it("o desconto incide só sobre a energia, não sobre a conta inteira", () => {
    // 160 / 800 = 20% (ok). Sobre a conta inteira (1000) seria 16% → falso alerta.
    assert.deepEqual(regraDescontoAbaixoContratado([fatura({ ...base, economia: 160 })], OPTS), []);
  });

  it("pula encerramento (≥ 99%), base ≤ 0 e campos ausentes", () => {
    const fs = regraDescontoAbaixoContratado(
      [
        fatura({ ...base, agentDiscountPct: 99, economia: 0 }),
        fatura({ ...base, totalDistribuidor: 1000, economia: 0 }),
        fatura({ agentDiscountPct: null, totalSemDesconto: 1000 }),
        fatura({ agentDiscountPct: 20, totalSemDesconto: null }),
      ],
      OPTS,
    );
    assert.deepEqual(fs, []);
  });

  it("só avalia a competência mais recente", () => {
    const fs = regraDescontoAbaixoContratado(
      [
        fatura({ ...base, competencia: "2026-04", economia: 0 }),
        fatura({ ...base, competencia: "2026-05", economia: 160, dgBillId: 2 }),
      ],
      OPTS,
    );
    assert.deepEqual(fs, []);
  });
});

// ===== #10 / #11 / #12 Faturas =====

describe("regraFaturaSemUc", () => {
  it("um achado por instalação sem UC; ignora instalação vazia", () => {
    const fs = regraFaturaSemUc(
      [
        fatura({ installationNumber: "X", dgBillId: 1 }),
        fatura({ installationNumber: "X", dgBillId: 2 }),
        fatura({ installationNumber: "100001" }),
        fatura({ installationNumber: null }),
      ],
      [uc({ codigoInstalacao: "100001" })],
    );
    assert.equal(fs.length, 1);
    assert.equal(fs[0].entidadeRef, "X");
    assert.equal(fs[0].detalhe.exemploDgBillId, 1);
  });
});

describe("regraFaturaDuplicada", () => {
  it("mesma UC + competência → crítica; impacto = faturas além da primeira", () => {
    const fs = regraFaturaDuplicada([
      fatura({ dgBillId: 30, valorTotal: 120 }),
      fatura({ dgBillId: 10, valorTotal: 100 }),
      fatura({ dgBillId: 20, valorTotal: 110 }),
      fatura({ dgBillId: 40, competencia: "2026-04" }),
    ]);
    assert.equal(fs.length, 1);
    assert.equal(fs[0].severidade, "critica");
    assert.deepEqual(fs[0].detalhe.dgBillIds, [10, 20, 30]);
    assert.equal(fs[0].impactoFinanceiro, 230); // 110 + 120 (mantém a de menor id)
  });

  it("ignora faturas sem instalação ou sem competência", () => {
    assert.deepEqual(
      regraFaturaDuplicada([
        fatura({ installationNumber: null, dgBillId: 1 }),
        fatura({ installationNumber: null, dgBillId: 2 }),
        fatura({ competencia: "", dgBillId: 3 }),
        fatura({ competencia: "", dgBillId: 4 }),
      ]),
      [],
    );
  });
});

describe("regraCompetenciaIncorreta", () => {
  const venc = (competencia: string, vencimento: string | null) =>
    regraCompetenciaIncorreta([fatura({ competencia, vencimento })]);

  it("vencimento no mesmo mês ou até 2 meses depois é normal", () => {
    assert.deepEqual(venc("2026-05", "2026-05-20"), []);
    assert.deepEqual(venc("2026-05", "2026-07-01"), []);
    assert.deepEqual(venc("2025-12", "2026-01-10"), []); // virada de ano
  });

  it("vencimento 3+ meses depois ou antes da competência → info", () => {
    assert.equal(venc("2026-05", "2026-08-01")[0]?.severidade, "info");
    assert.equal(venc("2026-05", "2026-04-30")[0]?.titulo, "Vencimento distante da competência (-1 meses)");
  });

  it("fatura sem competência → info", () => {
    const [f] = venc("", "2026-05-20");
    assert.equal(f.competencia, null);
    assert.match(f.titulo, /sem competência/);
  });

  it("vencimento ausente ou fora do formato não é avaliado", () => {
    assert.deepEqual(venc("2026-05", null), []);
    assert.deepEqual(venc("2026-05", "20/08/2026"), []);
  });
});

// ===== #14 Crédito parado =====

describe("regraCreditoParado", () => {
  const serie = (creditos: number[], consumo = 100) =>
    creditos.map((c, i) =>
      rateio({ competencia: `2026-0${i + 1}`, creditosAcumulados: c, consumoKwh: consumo }),
    );

  it("saldo não-decrescente nas últimas 3 competências → alta", () => {
    const [f] = regraCreditoParado(serie([1000, 1000, 1200]), OPTS);
    assert.equal(f.regra, "credito_parado");
    assert.equal(f.competencia, "2026-03");
    assert.equal(f.impactoFinanceiro, 1176); // 1200 × 0,98
  });

  it("usa só a janela final (queda antiga não importa)", () => {
    assert.equal(regraCreditoParado(serie([5000, 1000, 1000, 1100]), OPTS).length, 1);
  });

  it("saldo caindo, série curta ou saldo baixo não alertam", () => {
    assert.deepEqual(regraCreditoParado(serie([1200, 1100, 1000]), OPTS), []);
    assert.deepEqual(regraCreditoParado(serie([1000, 1200]), OPTS), []);
    assert.deepEqual(regraCreditoParado(serie([150, 180, 200]), OPTS), []); // ≤ 2 × consumo
  });

  it("ordena a série por competência antes de avaliar", () => {
    const fora = serie([1000, 1000, 1200]).reverse();
    assert.equal(regraCreditoParado(fora, OPTS).length, 1);
  });
});

// ===== Regras desativadas em rodarRegras (mantidas para uso futuro) =====

describe("regras desativadas", () => {
  it("regraSomaPercentual aponta soma ≠ 100% com tolerância", () => {
    const fs = regraSomaPercentual(
      [rateio({ percentual: 60 }), rateio({ percentual: 60, installation: "2" })],
      OPTS,
    );
    assert.equal(fs[0].severidade, "alta");
    assert.equal(fs[0].detalhe.somaPercentual, 120);
    assert.deepEqual(
      regraSomaPercentual([rateio({ percentual: 50.5 }), rateio({ percentual: 50 })], OPTS),
      [],
    );
  });

  it("regraRateioDuplicado aponta UC com várias linhas na competência", () => {
    const fs = regraRateioDuplicado([rateio(), rateio({ usinaNome: "Usina B" })]);
    assert.equal(fs.length, 1);
    assert.deepEqual(fs[0].detalhe.usinas, ["Usina A", "Usina B"]);
  });

  it("diagUcSubalocada aponta cobertura < 90% do consumo", () => {
    assert.equal(diagUcSubalocada([rateio({ covering: 80, consumoKwh: 100 })]).length, 1);
    assert.deepEqual(diagUcSubalocada([rateio({ covering: 95, consumoKwh: 100 })]), []);
  });
});

// ===== Orquestração =====

describe("rodarRegras", () => {
  it("não roda as regras desativadas pela semântica do Digital Grid", () => {
    // Dados que disparariam soma_percentual, rateio_duplicado e uc_subalocada.
    const rateios = [
      rateio({ percentual: 100, covering: 1, consumoKwh: 100 }),
      rateio({ percentual: 100, usinaNome: "Usina B", generatorNumber: "900002", covering: 1 }),
    ];
    const fs = rodarRegras(rateios, [], [uc()], OPTS);
    const ativas = new Set(regras(fs));
    assert.equal(ativas.has("soma_percentual"), false);
    assert.equal(ativas.has("rateio_duplicado"), false);
    assert.equal(ativas.has("uc_subalocada"), false);
  });

  it("agrega os achados das regras ativas", () => {
    const fs = rodarRegras(
      [rateio({ installation: "100001", consumoKwh: 100, creditosAcumulados: 7000 })],
      [
        fatura({ dgBillId: 1, installationNumber: "SEMUC" }),
        fatura({ dgBillId: 2, installationNumber: "SEMUC" }),
      ],
      [uc({ codigoInstalacao: "100001" }), uc({ codigoInstalacao: "100002" })],
      OPTS,
    );
    assert.deepEqual(new Set(regras(fs)), new Set([
      "uc_sem_rateio",
      "consumo_credito_incompativel",
      "fatura_sem_uc",
      "fatura_duplicada",
    ]));
  });

  it("os geradores do rateio não viram 'UC sem rateio'", () => {
    const fs = rodarRegras(
      [rateio({ installation: "100001", generatorNumber: "900001" })],
      [],
      [uc({ codigoInstalacao: "100001" }), uc({ codigoInstalacao: "900001" })],
      OPTS,
    );
    assert.deepEqual(regras(fs), []);
  });
});
