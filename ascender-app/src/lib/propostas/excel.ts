// Exportação Excel da proposta (uso INTERNO — staff). Roda no navegador (xlsx via
// import dinâmico). Espelha o exportExcel() do gerador original: 4 abas —
// Resumo, Geração Mensal, Retorno 25 Anos e Custos Internos.
// A aba "Custos Internos" contém custo/margem (sensível) — é um export do staff,
// análogo ao painel interno de custos; NÃO é o PDF do cliente.

import { MESES } from "./constantes";
import type { CenarioResultado, GeradorResultado } from "./types";

export type ExcelProposta = {
  cliente: string;
  cidade?: string;
  responsavel?: string;
  concessionaria?: string;
  data: string;
  dataTabela?: string;
  consumoKwh: number;
  tarifa: number;
  hsp: number;
  resultado: GeradorResultado;
};

const r2 = (v: number) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : 0);
const r0 = (v: number) => (Number.isFinite(v) ? Math.round(v) : 0);

function kpisCenario(c: CenarioResultado): [string, number | string][] {
  return [
    ["Potência (kWp)", r2(c.potenciaKwp)],
    ["Módulos", `${c.qtdModulos} × ${c.moduloWp} Wp`],
    ["Inversor", `${c.inversor.label} · ${c.inversor.disjuntor}`],
    ["Geração média mensal (kWh)", r0(c.geracaoMensalKwh)],
    ["Geração média anual (kWh)", r0(c.geracaoAnualKwh)],
    ["Investimento (R$)", r0(c.precoFinal)],
    ["Preço por kWp (R$)", r0(c.precoPorKwp)],
    [c.cenario === "necessario" ? "Economia mensal (R$)" : "Receita mensal (R$)", r0(c.retornoMensal)],
    ["Excedente (kWh/mês)", r0(c.excedenteKwh)],
    ["Crédito do excedente (R$/mês)", r0(c.creditoExcedente)],
    ["Payback (anos)", r2(c.paybackAnos)],
    ["TIR (% a.a.)", r2(c.tirPercent)],
    ["Retorno em 25 anos (R$)", r0(c.economia25Anos)],
    ["CO₂ evitado (t, 25 anos)", r2(c.co2Toneladas)],
  ];
}

export async function baixarPropostaExcel(dados: ExcelProposta): Promise<void> {
  const XLSX = await import("xlsx");
  const { necessario: nec, rentavel: rent } = dados.resultado;
  const wb = XLSX.utils.book_new();

  // ── Aba 1: Resumo ──
  const cab: (string | number)[][] = [
    ["PROPOSTA ASCENDER SOLAR"],
    ["Cliente", dados.cliente],
    ["Cidade / UF", dados.cidade ?? ""],
    ["Concessionária", dados.concessionaria ?? ""],
    ["Responsável", dados.responsavel ?? ""],
    ["Data", dados.data],
    ["Tabela de preços", dados.dataTabela ?? dados.data],
    ["Consumo (kWh/mês)", dados.consumoKwh],
    ["Tarifa (R$/kWh)", dados.tarifa],
    ["HSP", dados.hsp],
    [],
  ];
  const kNec = kpisCenario(nec);
  const kRent = rent ? kpisCenario(rent) : null;
  const s1: (string | number)[][] = [...cab, ["Indicador", "Sistema Necessário", "Telhado Rentável"]];
  kNec.forEach((row, i) => {
    s1.push([String(row[0]), row[1] as string | number, kRent ? (kRent[i][1] as string | number) : "—"]);
  });
  const ws1 = XLSX.utils.aoa_to_sheet(s1);
  ws1["!cols"] = [{ wch: 32 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Resumo");

  // ── Aba 2: Geração Mensal (12 meses) ──
  const s2: (string | number)[][] = [["Mês", "Necessário (kWh)", "Telhado Rentável (kWh)"]];
  for (let i = 0; i < 12; i++) {
    s2.push([
      MESES[i],
      r0(nec.geracaoMensalPorMes[i] ?? 0),
      rent ? r0(rent.geracaoMensalPorMes[i] ?? 0) : "—",
    ]);
  }
  s2.push(["Total ano", r0(nec.geracaoAnualKwh), rent ? r0(rent.geracaoAnualKwh) : "—"]);
  const ws2 = XLSX.utils.aoa_to_sheet(s2);
  ws2["!cols"] = [{ wch: 8 }, { wch: 20 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Geração Mensal");

  // ── Aba 3: Retorno 25 Anos ──
  const s3: (string | number)[][] = [
    ["Ano", "Acum. Necessário (R$)", "Líquido Necessário (R$)", "Acum. Rentável (R$)", "Líquido Rentável (R$)"],
  ];
  for (let i = 0; i < nec.projecao25Anos.length; i++) {
    const pn = nec.projecao25Anos[i];
    const pr = rent?.projecao25Anos[i];
    s3.push([
      pn.ano,
      r0(pn.acumuladoRetorno),
      r0(pn.retornoLiquido),
      pr ? r0(pr.acumuladoRetorno) : "—",
      pr ? r0(pr.retornoLiquido) : "—",
    ]);
  }
  const ws3 = XLSX.utils.aoa_to_sheet(s3);
  ws3["!cols"] = [{ wch: 6 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Retorno 25 Anos");

  // ── Aba 4: Custos Internos (SENSÍVEL — staff) ──
  const custo = (c: CenarioResultado): [string, number][] => [
    ["Kit FV", r0(c.custo.kit)],
    ["Estrutura de solo", r0(c.custo.estruturaSolo)],
    ["Mão de obra", r0(c.custo.maoDeObra)],
    ["Materiais AC", r0(c.custo.materiaisAc)],
    ["Adequação trifásica", r0(c.custo.adequacao)],
    ["Base do imposto", r0(c.custo.baseImposto)],
    ["Imposto", r0(c.custo.imposto)],
    ["CUSTO TOTAL", r0(c.custo.custoTotal)],
    [`Margem (${r2(c.custo.margemPercent)}%)`, r0(c.custo.margemValor)],
    ["PREÇO FINAL", r0(c.precoFinal)],
  ];
  const cNec = custo(nec);
  const cRent = rent ? custo(rent) : null;
  const s4: (string | number)[][] = [
    ["USO INTERNO — não enviar ao cliente"],
    [],
    ["Item", "Sistema Necessário (R$)", "Telhado Rentável (R$)"],
  ];
  cNec.forEach((row, i) => {
    s4.push([row[0], row[1], cRent ? cRent[i][1] : "—"]);
  });
  const ws4 = XLSX.utils.aoa_to_sheet(s4);
  ws4["!cols"] = [{ wch: 26 }, { wch: 24 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, ws4, "Custos Internos");

  const nome = (dados.cliente || "cliente").replace(/\s+/g, "_");
  const dia = dados.data.replace(/\//g, "-");
  XLSX.writeFile(wb, `Proposta_${nome}_${dia}.xlsx`);
}
