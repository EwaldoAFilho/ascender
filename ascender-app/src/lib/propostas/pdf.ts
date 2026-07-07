// Geração do PDF da proposta para o CLIENTE.
// Roda no navegador (jspdf via import dinâmico). Recebe apenas dados
// client-safe: NÃO inclui custo, margem nem tabela de kit — só o preço final e
// os números de engenharia/financeiro que o cliente pode ver.

export type PdfCenario = {
  titulo: string;
  potenciaKwp: number;
  qtdModulos: number;
  moduloWp: number;
  geracaoMensalKwh: number;
  geracaoAnualKwh: number;
  inversorLabel: string;
  precoFinal: number;
  precoPorKwp: number;
  paybackAnos: number;
  tirPercent: number;
  economia25Anos: number;
  co2Toneladas: number;
  retornoMensal: number;
  retornoLabel: string; // "Economia mensal" | "Receita mensal"
  excedenteKwh?: number;
  creditoExcedente?: number;
};

export type PdfProposta = {
  cliente: string;
  cidade?: string;
  responsavel?: string;
  concessionaria?: string;
  data: string;
  necessario: PdfCenario;
  rentavel?: PdfCenario | null;
};

const NAVY: [number, number, number] = [11, 31, 58];
const GOLD: [number, number, number] = [200, 155, 60];

const brl = (v: number) =>
  Number.isFinite(v)
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    : "—";
const num = (v: number, d = 0) =>
  Number.isFinite(v) ? v.toLocaleString("pt-BR", { maximumFractionDigits: d }) : "—";
const anos = (v: number) => (Number.isFinite(v) ? `${v.toFixed(1).replace(".", ",")} anos` : "—");

function linhasCenario(c: PdfCenario): [string, string][] {
  const linhas: [string, string][] = [
    ["Potência do sistema", `${num(c.potenciaKwp, 2)} kWp`],
    ["Módulos", `${num(c.qtdModulos)} × ${c.moduloWp} Wp`],
    ["Inversor", c.inversorLabel],
    ["Geração média mensal", `${num(c.geracaoMensalKwh)} kWh`],
    ["Geração média anual", `${num(c.geracaoAnualKwh)} kWh`],
    ["Investimento", brl(c.precoFinal)],
    ["Preço por kWp", brl(c.precoPorKwp)],
    [c.retornoLabel, brl(c.retornoMensal)],
    ["Payback simples", anos(c.paybackAnos)],
    ["TIR estimada", `${num(c.tirPercent, 1)}% a.a.`],
    ["Retorno em 25 anos", brl(c.economia25Anos)],
    ["CO₂ evitado (25 anos)", `${num(c.co2Toneladas, 1)} toneladas`],
  ];
  if (c.excedenteKwh && c.excedenteKwh > 0) {
    linhas.splice(5, 0, ["Excedente injetado", `${num(c.excedenteKwh)} kWh/mês`]);
    linhas.splice(6, 0, ["Crédito do excedente", `${brl(c.creditoExcedente ?? 0)}/mês`]);
  }
  return linhas;
}

export async function baixarPropostaPdf(dados: PdfProposta): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();

  // Cabeçalho branded.
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, w, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("ASCENDER SOLAR", 14, 15);
  doc.setTextColor(...GOLD);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Proposta de Sistema Fotovoltaico", 14, 23);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(dados.data, w - 14, 15, { align: "right" });

  // Dados do cliente.
  let y = 42;
  doc.setTextColor(...NAVY);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(dados.cliente, 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  const sub = [
    dados.cidade,
    dados.concessionaria,
    dados.responsavel ? `Responsável: ${dados.responsavel}` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
  if (sub) {
    y += 6;
    doc.text(sub, 14, y);
  }
  y += 8;

  const secao = (c: PdfCenario, startY: number): number => {
    doc.setFillColor(...GOLD);
    doc.rect(14, startY, w - 28, 8, "F");
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(c.titulo, 17, startY + 5.5);
    autoTable(doc, {
      startY: startY + 10,
      body: linhasCenario(c),
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: (w - 28) * 0.6, textColor: [60, 60, 60] },
        1: { fontStyle: "bold", textColor: [...NAVY] },
      },
      margin: { left: 14, right: 14 },
    });
    // @ts-expect-error jspdf-autotable acrescenta lastAutoTable ao doc.
    return (doc.lastAutoTable?.finalY ?? startY + 60) + 8;
  };

  y = secao(dados.necessario, y);
  if (dados.rentavel) {
    // Nova página se não couber.
    if (y > 210) {
      doc.addPage();
      y = 20;
    }
    y = secao(dados.rentavel, y);
  }

  // Rodapé / observações.
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  const obs =
    "Valores estimados. A geração real depende de irradiação, sombreamento e condições da " +
    "instalação. Créditos de energia (SCEE) são compensados em kWh conforme a Lei 14.300/2022. " +
    "Proposta gerada pelo sistema ASCENDER — validade sujeita a confirmação técnica.";
  doc.text(doc.splitTextToSize(obs, w - 28), 14, 285);

  const nome = dados.cliente.replace(/\s+/g, "_") || "cliente";
  doc.save(`Proposta_Ascender_${nome}.pdf`);
}
