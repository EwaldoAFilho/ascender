import { test } from "node:test";
import assert from "node:assert/strict";
import { textoPdf } from "./pdf";

// As fontes padrão do jsPDF só cobrem Latin-1: qualquer caractere acima de
// U+00FF desalinha a linha inteira no PDF (letras espaçadas, estouro de margem).
const soLatin1 = (s: string) => [...s].every((c) => c.codePointAt(0)! <= 0xff);

test("textoPdf: rótulos do inversor com ≤ viram 'até'", () => {
  assert.equal(textoPdf("Inv. 10kW (≤15kWp) · Disj. 30A"), "Inv. 10kW (até 15kWp) · Disj. 30A");
  assert.equal(textoPdf("Inv. 15kW tri (≤22,5kWp)"), "Inv. 15kW tri (até 22,5kWp)");
});

test("textoPdf: subscrito de CO₂ vira dígito comum", () => {
  assert.equal(textoPdf("CO₂ evitado (25 anos)"), "CO2 evitado (25 anos)");
});

test("textoPdf: preserva acentos, ×, · e símbolos Latin-1", () => {
  const s = "Potência · Módulos 6 × 620 Wp · Geração média · R$ 8.772 · 25 m² · Responsável";
  assert.equal(textoPdf(s), s);
});

test("textoPdf: pontuação tipográfica de nomes livres vira ASCII", () => {
  assert.equal(textoPdf("Hotel Cerrado — “Matriz” … ’"), `Hotel Cerrado - "Matriz" ... '`);
});

test("textoPdf: saída é sempre Latin-1 (emoji/CJK são descartados)", () => {
  const out = textoPdf("Cliente 😀 太阳 ≥ 10 kWp ok");
  assert.ok(soLatin1(out), out);
  assert.equal(out, "Cliente   a partir de  10 kWp ok");
});
