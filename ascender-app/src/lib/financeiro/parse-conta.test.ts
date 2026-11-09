// Testes do parser regex de contas Neoenergia (texto extraído do PDF).
// Os textos abaixo são SINTÉTICOS: reproduzem só os trechos que cada regex
// procura nos dois layouts conhecidos. Não há dados de clientes reais aqui.
// Ao calibrar o parser com uma conta real, acrescente o trecho (anonimizado)
// como novo caso.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseContaNeoenergia } from "./parse-conta";

// Layout A — beneficiário (rótulos explícitos + SCEE "Excedente/créditos/saldo").
const LAYOUT_A = `
NOME DO CLIENTE:
EMPRESA EXEMPLO LTDA
CNPJ: 12.345.678/0001-90
CÓDIGO DA INSTALAÇÃO
1234567
REF:MÊS/ANO
05/2026
VENCIMENTO
20/06/2026
TOTAL A PAGAR R$
1.234,56
NOTA FISCAL Nº 987654
LEITURA ANTERIOR 10/04/2026
LEITURA ATUAL 11/05/2026
PRÓXIMA LEITURA 10/06/2026
Nº DE DIAS 31
ENERGIA ATIVA kWh 1000 1500 1 500
Consumo-TUSD kWh 500 0,45 225,00
Consumo-TE kWh 500 0,30 150,00
Ilum. Púb. Municipal 25,90
PIS 375,00 1,10 4,13
COFINS 375,00 5,07 19,01
ICMS 375,00 21,00 78,75
Excedente 120,5 kWh, créditos utilizados 80 kWh.
Saldo para o próximo ciclo 1.040,25 kWh
836200000012 345678901234 567890123456 789012345678
`;

// Layout B — gerador/consórcio (cabeçalho sem rótulos + SCEE "SALDO ...").
const LAYOUT_B = `
CONSÓRCIO SOLAR EXEMPLO
CNPJ 12.345.678/0001-90
ABR/2026 159,24 23/04/2026
10/03/2026 09/04/2026 30 11/05/2026
1234567
SALDO ANTERIOR 1.500,00
TRANSF (CRED-DEB) -200,00
INJETADO 3.000,50
COMPENSADO 800
SALDO ATUAL 3.500,50
`;

describe("parseContaNeoenergia — layout A (beneficiário)", () => {
  const c = parseContaNeoenergia(LAYOUT_A);

  it("identificação", () => {
    assert.equal(c.installationNumber, "1234567");
    assert.equal(c.cliente, "EMPRESA EXEMPLO LTDA");
    assert.equal(c.cnpj, "12345678000190");
    assert.equal(c.notaFiscal, "987654");
  });

  it("competência numérica e vencimento em ISO", () => {
    assert.equal(c.competencia, "2026-05");
    assert.equal(c.ano, 2026);
    assert.equal(c.mes, 5);
    assert.equal(c.vencimento, "2026-06-20");
  });

  it("valor em formato brasileiro (milhar com ponto, decimal com vírgula)", () => {
    assert.equal(c.valor, 1234.56);
  });

  it("leituras com rótulo", () => {
    assert.equal(c.leituraAnteriorData, "2026-04-10");
    assert.equal(c.leituraData, "2026-05-11");
    assert.equal(c.leituraProximaData, "2026-06-10");
    assert.equal(c.numeroDias, 31);
    assert.equal(c.energiaKwh, 500);
  });

  it("tributos e itens da fatura", () => {
    assert.deepEqual(c.tributos, { pis: 4.13, cofins: 19.01, icms: 78.75 });
    assert.deepEqual(c.itensFatura, [
      { descricao: "Consumo-TUSD", valor: 225 },
      { descricao: "Consumo-TE", valor: 150 },
      { descricao: "Iluminação Pública", valor: 25.9 },
    ]);
  });

  it("código de barras com espaços normalizados", () => {
    assert.equal(c.codigoBarras, "836200000012 345678901234 567890123456 789012345678");
  });

  it("SCEE do layout A preenchido; campos do layout B nulos", () => {
    assert.equal(c.sceeExcedenteKwh, 120.5);
    assert.equal(c.sceeCreditosKwh, 80);
    assert.equal(c.sceeSaldoProximoKwh, 1040.25);
    assert.equal(c.sceeSaldoAnteriorKwh, null);
    assert.equal(c.sceeInjetadoKwh, null);
    assert.equal(c.sceeSaldoAtualKwh, null);
  });
});

describe("parseContaNeoenergia — layout B (gerador/consórcio)", () => {
  const c = parseContaNeoenergia(LAYOUT_B);

  it("competência textual e vencimento pelo cabeçalho", () => {
    assert.equal(c.competencia, "2026-04");
    assert.equal(c.mes, 4);
    assert.equal(c.vencimento, "2026-04-23");
  });

  it("instalação na linha antes de SALDO ANTERIOR", () => {
    assert.equal(c.installationNumber, "1234567");
  });

  it("consórcio identificado como cliente", () => {
    assert.equal(c.cliente, "CONSÓRCIO SOLAR EXEMPLO");
    assert.equal(c.cnpj, "12345678000190");
  });

  it("leituras sem rótulo: três datas + nº de dias na mesma linha", () => {
    assert.equal(c.leituraAnteriorData, "2026-03-10");
    assert.equal(c.leituraData, "2026-04-09");
    assert.equal(c.numeroDias, 30);
    assert.equal(c.leituraProximaData, "2026-05-11");
  });

  it("SCEE do layout B (inclui transferência negativa); layout A nulo", () => {
    assert.equal(c.sceeSaldoAnteriorKwh, 1500);
    assert.equal(c.sceeTransfKwh, -200);
    assert.equal(c.sceeInjetadoKwh, 3000.5);
    assert.equal(c.sceeCompensadoKwh, 800);
    assert.equal(c.sceeSaldoAtualKwh, 3500.5);
    assert.equal(c.sceeExcedenteKwh, null);
  });
});

describe("parseContaNeoenergia — variações e bordas", () => {
  it("competência textual com rótulo REF:MÊS/ANO", () => {
    assert.equal(parseContaNeoenergia("REF:MÊS/ANO ABR/2026").competencia, "2026-04");
  });

  it("competência com mês inválido → nula", () => {
    const c = parseContaNeoenergia("REF:MÊS/ANO XYZ/2026");
    assert.equal(c.competencia, null);
    assert.equal(c.mes, null);
  });

  it("CPF com 11 dígitos é aceito; documento com tamanho inválido é descartado", () => {
    assert.equal(parseContaNeoenergia("CPF: 123.456.789-09").cnpj, "12345678909");
    assert.equal(parseContaNeoenergia("CNPJ: 12.345.678").cnpj, null);
  });

  it("nome sem sufixo societário junta a linha de continuação", () => {
    const c = parseContaNeoenergia(
      "NOME DO CLIENTE:\nASSOCIACAO DE ENERGIAS\nSUSTENTAVEIS ASES\n",
    );
    assert.equal(c.cliente, "ASSOCIACAO DE ENERGIAS SUSTENTAVEIS ASES");
  });

  it("não junta um rótulo como continuação do nome", () => {
    const c = parseContaNeoenergia("NOME DO CLIENTE:\nFULANO DE TAL\nENDERECO\n");
    assert.equal(c.cliente, "FULANO DE TAL");
  });

  it("texto vazio → todos os campos nulos e sem itens", () => {
    const c = parseContaNeoenergia("");
    assert.equal(c.installationNumber, null);
    assert.equal(c.competencia, null);
    assert.equal(c.valor, null);
    assert.equal(c.cnpj, null);
    assert.equal(c.codigoBarras, null);
    assert.deepEqual(c.tributos, { pis: null, cofins: null, icms: null });
    assert.deepEqual(c.itensFatura, []);
  });
});
