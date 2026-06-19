// Extrai campos de uma conta de energia da Neoenergia Brasília (DANFE) a partir
// do texto do PDF. Tolerante a variações de espaçamento; campos não encontrados
// retornam null (e ficam editáveis manualmente na tela).

export type TributosConta = {
  pis: number | null;
  cofins: number | null;
  icms: number | null;
};

export type ItemConta = { descricao: string; valor: number | null };

export type ContaParsed = {
  installationNumber: string | null;
  competencia: string | null; // "AAAA-MM"
  ano: number | null;
  mes: number | null;
  cliente: string | null;
  vencimento: string | null; // "AAAA-MM-DD"
  valor: number | null;
  notaFiscal: string | null;
  codigoBarras: string | null;
  leituraAnteriorData: string | null;
  leituraData: string | null;
  leituraProximaData: string | null;
  numeroDias: number | null;
  energiaKwh: number | null;
  tributos: TributosConta;
  itensFatura: ItemConta[];
  aviso: string | null;
  sceeExcedenteKwh: number | null;
  sceeCreditosKwh: number | null;
  sceeSaldoProximoKwh: number | null;
};

function ptNum(s: string | null | undefined): number | null {
  if (s == null) return null;
  const cleaned = s.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function isoDate(br: string | null | undefined): string | null {
  const m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(br ?? "");
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function cap(text: string, re: RegExp): string | null {
  const m = re.exec(text);
  return m ? m[1].trim() : null;
}

export function parseContaNeoenergia(raw: string): ContaParsed {
  // Normaliza espaços não separáveis; mantém quebras de linha.
  const t = raw.replace(/ /g, " ");

  const mesAno = /REF:?\s*M[ÊE]S\/ANO\s*\n?\s*(\d{2})\/(\d{4})/i.exec(t);
  const mes = mesAno ? Number(mesAno[1]) : null;
  const ano = mesAno ? Number(mesAno[2]) : null;
  const competencia = mesAno ? `${mesAno[2]}-${mesAno[1]}` : null;

  const scee =
    /Excedente\s*([\d.,]+)\s*kWh.*?cr[ée]ditos\s+utilizados\s*([\d.,]+)\s*kWh.*?Saldo\s+para\s+o\s+pr[óo]ximo\s+ciclo\s*([\d.,]+)\s*kWh/is.exec(
      t,
    );

  const codBarras = /(\d{12}\s+\d{12}\s+\d{12}\s+\d{12})/.exec(t);

  const item = (desc: string, re: RegExp): ItemConta | null => {
    const m = re.exec(t);
    return m ? { descricao: desc, valor: ptNum(m[1]) } : null;
  };
  const itens = [
    item("Consumo-TUSD", /Consumo-?TUSD\s+kWh\s+[\d.,]+\s+[\d.,]+\s+([\d.,]+)/i),
    item("Consumo-TE", /Consumo-?TE\s+kWh\s+[\d.,]+\s+[\d.,]+\s+([\d.,]+)/i),
    item("Acréscimo Bandeira", /Acr[ée]s\.?\s*Band\.?\s*\S+\s+([\d.,]+)/i),
    item("Iluminação Pública", /Ilum\.?\s*P[úu]b\.?\s*\S+\s+([\d.,]+)/i),
  ].filter((x): x is ItemConta => x !== null);

  return {
    installationNumber: cap(t, /C[ÓO]DIGO DA INSTALA[ÇC][ÃA]O\s*\n?\s*(\d+)/i),
    competencia,
    ano,
    mes,
    cliente: cap(t, /NOME DO CLIENTE:?\s*\n?\s*([A-Z0-9À-Ú][^\n]+)/i),
    vencimento: isoDate(cap(t, /VENCIMENTO\s*\n?\s*(\d{2}\/\d{2}\/\d{4})/i)),
    valor: ptNum(cap(t, /TOTAL A PAGAR\s*R\$\s*\n?\s*([\d.]+,\d{2})/i)),
    notaFiscal: cap(t, /NOTA FISCAL N[°º]?\s*(\d+)/i),
    codigoBarras: codBarras ? codBarras[1].replace(/\s+/g, " ").trim() : null,
    leituraAnteriorData: isoDate(cap(t, /LEITURA ANTERIOR\s*(\d{2}\/\d{2}\/\d{4})/i)),
    leituraData: isoDate(cap(t, /LEITURA ATUAL\s*(\d{2}\/\d{2}\/\d{4})/i)),
    leituraProximaData: isoDate(cap(t, /PR[ÓO]XIMA LEITURA\s*(\d{2}\/\d{2}\/\d{4})/i)),
    numeroDias: (() => {
      const v = cap(t, /N[°º]?\s*DE DIAS\s*(\d+)/i);
      return v ? Number(v) : null;
    })(),
    energiaKwh: ptNum(
      cap(
        t,
        /Energia Ativa\s+\S+\s+[\d.,]+\s+[\d.,]+\s+[\d.,]+\s+([\d.,]+)/i,
      ),
    ),
    tributos: {
      pis: ptNum(cap(t, /\bPIS\s+[\d.,]+\s+[\d.,]+\s+([\d.,]+)/i)),
      cofins: ptNum(cap(t, /\bCOFINS\s+[\d.,]+\s+[\d.,]+\s+([\d.,]+)/i)),
      icms: ptNum(cap(t, /\bICMS\s+[\d.,]+\s+[\d.,]+\s+([\d.,]+)/i)),
    },
    itensFatura: itens,
    aviso: cap(
      t,
      /INFORMA[ÇC][ÕO]ES IMPORTANTES\s*([\s\S]{0,400}?)(?:\n\s*\d{2}\/\d{4}\s|C[ÓO]DIGO DO CLIENTE|PARA CADASTRAR|$)/i,
    ),
    sceeExcedenteKwh: scee ? ptNum(scee[1]) : null,
    sceeCreditosKwh: scee ? ptNum(scee[2]) : null,
    sceeSaldoProximoKwh: scee ? ptNum(scee[3]) : null,
  };
}
