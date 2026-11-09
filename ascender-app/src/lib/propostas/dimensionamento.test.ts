// Testes do dimensionamento de engenharia (client-safe, sem custo).
// Valores esperados calculados à mão a partir das fórmulas e de MODS.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calcularInversor,
  dimensionarPorConsumo,
  empacotarTelhado,
  geracaoPorKwpMes,
  resolverInversor,
  totalTelhados,
} from "./dimensionamento";

const perto = (real: number, esperado: number, tol = 1e-6) =>
  assert.ok(Math.abs(real - esperado) <= tol, `esperado ≈ ${esperado}, obtido ${real}`);

describe("geracaoPorKwpMes", () => {
  it("HSP × PR × 30 dias", () => {
    perto(geracaoPorKwpMes(5.5, 0.79), 130.35);
  });
});

describe("dimensionarPorConsumo", () => {
  // gpk com segurança = 5,5 × 0,79 × 30 × 0,95 = 123,8325 kWh/kWp/mês
  it("arredonda módulos para cima e a geração cobre o consumo", () => {
    const r = dimensionarPorConsumo(500, 1.0, 5.5, 620, 0.79, 0.95);
    // 500 000 / 620 / 123,8325 = 6,51 → 7 módulos
    assert.equal(r.modulos, 7);
    perto(r.potenciaKwp, 4.34);
    perto(r.geracaoMensalKwh, 4.34 * 123.8325);
    assert.ok(r.geracaoMensalKwh >= 500);
  });

  it("compensação menor que 100% reduz o sistema", () => {
    const r = dimensionarPorConsumo(500, 0.8, 5.5, 620, 0.79, 0.95);
    // 400 000 / 620 / 123,8325 = 5,21 → 6 módulos
    assert.equal(r.modulos, 6);
  });

  it("módulo de 700 Wp exige menos módulos", () => {
    const r = dimensionarPorConsumo(500, 1.0, 5.5, 700, 0.79, 0.95);
    // 500 000 / 700 / 123,8325 = 5,77 → 6 módulos
    assert.equal(r.modulos, 6);
    perto(r.potenciaKwp, 4.2);
  });

  it("consumo zero ou geração zero devolvem sistema vazio", () => {
    const vazio = { modulos: 0, potenciaKwp: 0, geracaoMensalKwh: 0 };
    assert.deepEqual(dimensionarPorConsumo(0, 1, 5.5, 620, 0.79, 0.95), vazio);
    assert.deepEqual(dimensionarPorConsumo(500, 1, 0, 620, 0.79, 0.95), vazio);
  });
});

describe("empacotarTelhado", () => {
  it("empate retrato × paisagem escolhe Retrato", () => {
    // 620 Wp = 1,13 × 2,38 m. Retrato: 8 × 2 = 16; Paisagem: 4 × 4 = 16.
    const r = empacotarTelhado({ largura: 10, comprimento: 5, aproveitamento: 100 }, 620);
    assert.ok(r);
    assert.equal(r.orientacao, "Retrato");
    assert.equal(r.modulos, 16);
    perto(r.potenciaKwp, 9.92);
    perto(r.areaM2, 16 * 1.13 * 2.38);
    perto(r.ocupacaoPct, ((16 * 1.13 * 2.38) / 50) * 100);
  });

  it("escolhe Paisagem quando cabe mais", () => {
    // Retrato: 2 × 1 = 2; Paisagem: 1 × 4 = 4.
    const r = empacotarTelhado({ largura: 2.4, comprimento: 4.6, aproveitamento: 100 }, 620);
    assert.ok(r);
    assert.equal(r.orientacao, "Paisagem");
    assert.equal(r.modulos, 4);
  });

  it("aplica o aproveitamento arredondando para baixo", () => {
    const r = empacotarTelhado({ largura: 10, comprimento: 5, aproveitamento: 80 }, 620);
    assert.equal(r?.modulos, 12); // floor(16 × 0,8)
  });

  it("dimensão inválida devolve null", () => {
    assert.equal(empacotarTelhado({ largura: 0, comprimento: 5, aproveitamento: 100 }, 620), null);
    assert.equal(empacotarTelhado({ largura: 5, comprimento: -1, aproveitamento: 100 }, 620), null);
  });
});

describe("totalTelhados", () => {
  it("soma os telhados válidos e ignora os inválidos", () => {
    const r = totalTelhados(
      [
        { largura: 10, comprimento: 5, aproveitamento: 100 },
        { largura: 0, comprimento: 5, aproveitamento: 100 },
        { largura: 2.4, comprimento: 4.6, aproveitamento: 100 },
      ],
      620,
    );
    assert.equal(r.modulos, 20);
    perto(r.potenciaKwp, 12.4);
    assert.equal(r.detalhes.length, 2);
  });
});

describe("resolverInversor", () => {
  it("3 ou mais telhados forçam microinversor", () => {
    assert.equal(resolverInversor(3, "string"), "micro");
  });
  it("respeita o forçado quando há até 2 telhados", () => {
    assert.equal(resolverInversor(2, "micro"), "micro");
    assert.equal(resolverInversor(2, "string"), "string");
  });
  it("automático usa string", () => {
    assert.equal(resolverInversor(1, "auto"), "string");
    assert.equal(resolverInversor(0, "auto"), "string");
  });
});

describe("calcularInversor", () => {
  it("micro: unidades de 2,5 kW e disjuntor monofásico", () => {
    const r = calcularInversor(5, "micro");
    assert.equal(r.quantidade, 2);
    assert.equal(r.potenciaKw, 5);
    assert.equal(r.disjuntorA, 26); // ceil(5000 / (220 × 0,9))
    assert.equal(r.label, "2× micro 2,5kW");
  });

  it("string: faixas de 10 kW (≤15), 15 kW (≤22,5) e kWp/1,5 acima", () => {
    assert.equal(calcularInversor(15, "string").potenciaKw, 10);
    assert.equal(calcularInversor(15.01, "string").potenciaKw, 15);
    assert.equal(calcularInversor(22.5, "string").potenciaKw, 15);
    const grande = calcularInversor(30, "string");
    assert.equal(grande.potenciaKw, 20);
    assert.equal(grande.label, "Inv. 20kW");
    assert.equal(grande.quantidade, 1);
  });

  it("string: disjuntor trifásico", () => {
    // ceil(10 000 / (√3 × 220 × 0,9)) = ceil(29,16) = 30
    assert.equal(calcularInversor(10, "string").disjuntorA, 30);
    // ceil(15 000 / 342,95) = ceil(43,74) = 44
    assert.equal(calcularInversor(20, "string").disjuntorA, 44);
  });
});
