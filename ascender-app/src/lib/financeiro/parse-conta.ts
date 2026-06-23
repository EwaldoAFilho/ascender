// Extrai campos de contas de energia da Neoenergia Brasília (DANFE) a partir do
// texto do PDF. Cobre DOIS layouts conhecidos:
//  - Layout A (beneficiário): SCEE "Excedente / créditos utilizados / saldo p/ próximo ciclo".
//  - Layout B (gerador/consórcio): SCEE "SALDO ANTERIOR / TRANSF / INJETADO / COMPENSADO / SALDO ATUAL".
// Usa cadeias de fallback por campo; campos não encontrados retornam null
// (e ficam editáveis manualmente na tela).

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
  cnpj: string | null; // só dígitos (CNPJ ou CPF do titular)
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
  // SCEE — layout A (beneficiário)
  sceeExcedenteKwh: number | null;
  sceeCreditosKwh: number | null;
  sceeSaldoProximoKwh: number | null;
  // SCEE — layout B (gerador/consórcio)
  sceeSaldoAnteriorKwh: number | null;
  sceeTransfKwh: number | null;
  sceeInjetadoKwh: number | null;
  sceeCompensadoKwh: number | null;
  sceeSaldoAtualKwh: number | null;
};

const MESES: Record<string, string> = {
  JAN: "01", FEV: "02", MAR: "03", ABR: "04", MAI: "05", JUN: "06",
  JUL: "07", AGO: "08", SET: "09", OUT: "10", NOV: "11", DEZ: "12",
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

/** Primeiro grupo capturado entre vários padrões (cadeia de fallback). */
function capAny(text: string, regexes: RegExp[]): string | null {
  for (const re of regexes) {
    const m = re.exec(text);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

function parseCompetencia(t: string): {
  competencia: string | null;
  ano: number | null;
  mes: number | null;
} {
  // Numérico: "REF:MÊS/ANO 05/2026"
  let m = /REF:?\s*M[ÊE]S\s*\/?\s*ANO\s*\n?\s*(\d{2})\/(\d{4})/i.exec(t);
  if (m) return { mes: Number(m[1]), ano: Number(m[2]), competencia: `${m[2]}-${m[1]}` };
  // Textual, em ordem de confiança:
  //  1) rótulo explícito "REF:MÊS/ANO ABR/2026"
  //  2) cabeçalho: "ABR/2026 159,24 23/04/2026" (mês + valor + vencimento)
  //  3) cabeçalho: "23/04/2026 159,24 ABR/2026"
  //  4) último recurso: primeiro MMM/AAAA do texto
  m =
    /REF:?\s*M[ÊE]S\s*\/?\s*ANO\s*\n?\s*([A-Za-z]{3})\/(\d{4})/i.exec(t) ??
    /([A-Za-z]{3})\/(\d{4})\s+[\d.,]+\s+\d{2}\/\d{2}\/\d{4}/.exec(t) ??
    /\d{2}\/\d{2}\/\d{4}\s+[\d.,]+\s+([A-Za-z]{3})\/(\d{4})/.exec(t) ??
    /\b([A-Za-z]{3})\/(\d{4})\b/.exec(t);
  if (m) {
    const mm = MESES[m[1].toUpperCase()];
    if (mm) return { mes: Number(mm), ano: Number(m[2]), competencia: `${m[2]}-${mm}` };
  }
  return { competencia: null, ano: null, mes: null };
}

function parseLeituras(t: string): {
  anterior: string | null;
  atual: string | null;
  proxima: string | null;
  dias: number | null;
} {
  // Layout A — rótulos explícitos
  let anterior = capAny(t, [/LEITURA ANTERIOR\s*(\d{2}\/\d{2}\/\d{4})/i]);
  let atual = capAny(t, [/LEITURA ATUAL\s*(\d{2}\/\d{2}\/\d{4})/i]);
  let proxima = capAny(t, [/PR[ÓO]XIMA LEITURA\s*(\d{2}\/\d{2}\/\d{4})/i]);
  let dias = capAny(t, [/N[°º.]?\s*DE DIAS\s*(\d+)/i]);

  // Layout B — três datas + nº de dias na mesma linha, sem rótulos
  if (!atual) {
    const m =
      /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{1,3})\s+(\d{2}\/\d{2}\/\d{4})/.exec(
        t,
      );
    if (m) {
      anterior = m[1];
      atual = m[2];
      dias = dias ?? m[3];
      proxima = m[4];
    }
  }
  return {
    anterior: isoDate(anterior),
    atual: isoDate(atual),
    proxima: isoDate(proxima),
    dias: dias ? Number(dias) : null,
  };
}

// Nome do cliente — junta uma 2ª linha de continuação quando o nome não tem
// sufixo societário na 1ª linha (ex.: "...ENERGETICAS" + "SUSTENTAVEIS ASES").
function extractCliente(t: string): string | null {
  const m =
    /NOME DO CLIENTE:?\s*\n?\s*([A-Z0-9À-Ú][^\n]+)/i.exec(t) ??
    /^[ \t]*(CONS[ÓO]RCIO[^\n]+|[A-ZÀ-Ú][^\n]*(?:LTDA|ASES|S\.?A\.?|EIRELI|ME)\b[^\n]*)/im.exec(t);
  if (!m || !m[1]) return null;
  let nome = m[1].trim();
  const temSufixo = /\b(LTDA|S\.?A\.?|ASES|EIRELI|ME|EPP)\b/i.test(nome);
  if (!temSufixo) {
    const resto = t.slice(m.index + m[0].length);
    const cont = /\n\s*([A-ZÀ-Ú][A-ZÀ-Ú .]{2,40})(?:\n|$)/.exec(resto)?.[1]?.trim();
    const ehRotulo =
      /^(CNPJ|CPF|ENDERE|INSCRI|CLASSIF|TIPO|C[ÓO]DIGO|RUA|AV|QUADRA|SMAS|SETOR|SCS|SBS)/i;
    if (cont && !ehRotulo.test(cont)) nome = `${nome} ${cont}`;
  }
  return nome;
}

// CNPJ/CPF do titular → só dígitos (11 = CPF, 14 = CNPJ); null caso contrário.
function extractCnpj(t: string): string | null {
  const m =
    /(?:CNPJ|CPF)(?:\s*\/\s*(?:CPF|CNPJ))?\.?\s*:?\s*([\d][\d.\-/]{9,20})/i.exec(
      t,
    );
  if (!m) return null;
  const digits = m[1].replace(/\D/g, "");
  return digits.length === 11 || digits.length === 14 ? digits : null;
}

export function parseContaNeoenergia(raw: string): ContaParsed {
  const t = raw.replace(/ /g, " ");

  const comp = parseCompetencia(t);
  const leituras = parseLeituras(t);

  // SCEE layout A
  const sceeA =
    /Excedente\s*([\d.,]+)\s*kWh.*?cr[ée]ditos\s+utilizados\s*([\d.,]+)\s*kWh.*?Saldo\s+para\s+o\s+pr[óo]ximo\s+ciclo\s*([\d.,]+)\s*kWh/is.exec(
      t,
    );

  const codBarras = /(\d{12}\s+\d{12}\s+\d{12}\s+\d{12})/.exec(t);

  const itemDefs: Array<{ desc: string; re: RegExp }> = [
    { desc: "Consumo-TUSD", re: /Consumo-?TUSD\s+kWh\s+[\d.,]+\s+[\d.,]+\s+([\d.,]+)/i },
    { desc: "Consumo-TE", re: /Consumo-?TE\s+kWh\s+[\d.,]+\s+[\d.,]+\s+([\d.,]+)/i },
    { desc: "Consumo", re: /\bCONSUMO\s+KWh\s+\d+\s+[\d.,]+\s+([\d.,]+)/i },
    { desc: "Custo TUSD Fio B", re: /CUSTO\s+TUSD\s+FIO\s+B\s+\d+\s+([\d.,]+)/i },
    { desc: "Acréscimo Bandeira", re: /Acr[ée]s\.?\s*Band\.?\s*\S+\s+([\d.,]+)/i },
    {
      desc: "Iluminação Pública",
      re: /(?:Ilum\.?\s*P[úu]b\.?|CONTRIBUI[ÇC][ÃA]O DE I\.?\s*P[ÚU]BLICA)\s*\S*\s*([\d.,]+)/i,
    },
  ];
  const itensFatura = itemDefs
    .map((d) => {
      const m = d.re.exec(t);
      return m ? { descricao: d.desc, valor: ptNum(m[1]) } : null;
    })
    .filter((x): x is ItemConta => x !== null);

  return {
    installationNumber: capAny(t, [
      /C[ÓO]DIGO DA INSTALA[ÇC][ÃA]O\s*\n?\s*(\d+)/i,
      /\n(\d{5,7})\s*\n\s*SALDO ANTERIOR/i,
    ]),
    competencia: comp.competencia,
    ano: comp.ano,
    mes: comp.mes,
    cliente: extractCliente(t),
    cnpj: extractCnpj(t),
    vencimento: isoDate(
      capAny(t, [
        /VENCIMENTO\s*\n?\s*(\d{2}\/\d{2}\/\d{4})/i,
        /[A-Za-z]{3}\/\d{4}\s+[\d.,]+\s+(\d{2}\/\d{2}\/\d{4})/,
      ]),
    ),
    valor: ptNum(capAny(t, [/TOTAL A PAGAR\s*(?:R\$)?\s*\n?\s*([\d.]+,\d{2})/i])),
    notaFiscal: capAny(t, [/NOTA FISCAL N[°º]?\s*(\d+)/i]),
    codigoBarras: codBarras ? codBarras[1].replace(/\s+/g, " ").trim() : null,
    leituraAnteriorData: leituras.anterior,
    leituraData: leituras.atual,
    leituraProximaData: leituras.proxima,
    numeroDias: leituras.dias,
    energiaKwh: ptNum(
      capAny(t, [
        /ENERGIA ATIVA\s+\S+\s+[\d.,]+\s+[\d.,]+\s+[\d.,]+\s+([\d.,]+)/i,
        /\bCONSUMO\s+KWh\s+(\d+)/i,
      ]),
    ),
    tributos: {
      pis: ptNum(capAny(t, [/\bPIS\s+[\d.,]+\s+[\d.,]+\s+([\d.,]+)/i])),
      cofins: ptNum(capAny(t, [/\bCOFINS\s+[\d.,]+\s+[\d.,]+\s+([\d.,]+)/i])),
      icms: ptNum(capAny(t, [/\bICMS\s+[\d.,]+\s+[\d.,]+\s+([\d.,]+)/i])),
    },
    itensFatura,
    aviso: capAny(t, [
      /INFORMA[ÇC][ÕO]ES IMPORTANTES\s*([\s\S]{0,400}?)(?:\n\s*\d{2}\/\d{4}\s|C[ÓO]DIGO DO CLIENTE|PARA CADASTRAR|$)/i,
    ]),
    // SCEE A
    sceeExcedenteKwh: sceeA ? ptNum(sceeA[1]) : null,
    sceeCreditosKwh: sceeA ? ptNum(sceeA[2]) : null,
    sceeSaldoProximoKwh: sceeA ? ptNum(sceeA[3]) : null,
    // SCEE B
    sceeSaldoAnteriorKwh: ptNum(capAny(t, [/SALDO ANTERIOR[^\d-]*(-?[\d.,]+)/i])),
    sceeTransfKwh: ptNum(capAny(t, [/TRANSF\s*\(CRED-?DEB\)[^\d-]*(-?[\d.,]+)/i])),
    sceeInjetadoKwh: ptNum(capAny(t, [/INJETADO[^\d-]*(-?[\d.,]+)/i])),
    sceeCompensadoKwh: ptNum(capAny(t, [/COMPENSADO[^\d-]*(-?[\d.,]+)/i])),
    sceeSaldoAtualKwh: ptNum(capAny(t, [/SALDO ATUAL[^\d-]*(-?[\d.,]+)/i])),
  };
}
