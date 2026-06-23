// Extração de campos de conta de energia via IA (provedor ativo configurado em
// Configurações → Integrações). Suporta Anthropic (Claude) e OpenAI por fetch
// cru — sem SDK. Retorna o mesmo formato ContaParsed do parser regex, para o
// orquestrador em conta.ts mesclar os dois. Devolve null quando não há provedor
// de IA ativo (o chamador então usa só o regex).

import { getActiveAiConfig } from "@/lib/ai/credentials";
import type { AiProvider } from "@/lib/ai/providers";
import type { ContaParsed, ItemConta } from "@/lib/financeiro/parse-conta";

export type AiUsage = { inputTokens: number | null; outputTokens: number | null };

export type AiExtractResult = {
  conta: ContaParsed;
  provider: AiProvider;
  model: string;
  usage: AiUsage;
};

const NUM = { type: ["number", "null"] } as const;
const STR = { type: ["string", "null"] } as const;

// Schema espelhando ContaParsed. Compatível com structured outputs da Anthropic
// e da OpenAI (additionalProperties:false e todos os campos em "required").
const CONTA_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    installationNumber: STR,
    competencia: STR,
    ano: NUM,
    mes: NUM,
    cliente: STR,
    vencimento: STR,
    valor: NUM,
    notaFiscal: STR,
    codigoBarras: STR,
    leituraAnteriorData: STR,
    leituraData: STR,
    leituraProximaData: STR,
    numeroDias: NUM,
    energiaKwh: NUM,
    tributos: {
      type: "object",
      additionalProperties: false,
      properties: { pis: NUM, cofins: NUM, icms: NUM },
      required: ["pis", "cofins", "icms"],
    },
    itensFatura: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { descricao: { type: "string" }, valor: NUM },
        required: ["descricao", "valor"],
      },
    },
    aviso: STR,
    sceeExcedenteKwh: NUM,
    sceeCreditosKwh: NUM,
    sceeSaldoProximoKwh: NUM,
    sceeSaldoAnteriorKwh: NUM,
    sceeTransfKwh: NUM,
    sceeInjetadoKwh: NUM,
    sceeCompensadoKwh: NUM,
    sceeSaldoAtualKwh: NUM,
  },
  required: [
    "installationNumber",
    "competencia",
    "ano",
    "mes",
    "cliente",
    "vencimento",
    "valor",
    "notaFiscal",
    "codigoBarras",
    "leituraAnteriorData",
    "leituraData",
    "leituraProximaData",
    "numeroDias",
    "energiaKwh",
    "tributos",
    "itensFatura",
    "aviso",
    "sceeExcedenteKwh",
    "sceeCreditosKwh",
    "sceeSaldoProximoKwh",
    "sceeSaldoAnteriorKwh",
    "sceeTransfKwh",
    "sceeInjetadoKwh",
    "sceeCompensadoKwh",
    "sceeSaldoAtualKwh",
  ],
} as const;

const INSTRUCAO = [
  "Você recebe o PDF de uma conta/fatura de energia elétrica brasileira",
  "(qualquer distribuidora: Neoenergia, Equatorial, Cemig, CPFL, Enel, Energisa,",
  "Light, Copel, etc.), com 1 ou 2 páginas. Extraia os campos no schema fornecido.",
  "Regras: datas no formato AAAA-MM-DD; competência (mês de referência) em AAAA-MM;",
  "números como número decimal com ponto (sem separador de milhar, sem 'R$' e sem 'kWh');",
  "use null quando o campo não existir na fatura.",
  "installationNumber = número da unidade consumidora (UC), apenas os dígitos.",
  "valor = TOTAL A PAGAR da fatura.",
  "Para o SCEE (geração distribuída/créditos), preencha os campos do layout que",
  "existir na fatura — excedente/créditos/saldo OU saldo anterior/transf/injetado/",
  "compensado/saldo atual — deixando null os do outro layout.",
  "itensFatura = principais itens cobrados (descrição + valor).",
].join(" ");

const TIMEOUT_MS = 60_000;

async function fetchJson(
  url: string,
  init: RequestInit,
): Promise<{ ok: boolean; status: number; body: unknown; raw: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const raw = await res.text();
    let body: unknown = null;
    try {
      body = JSON.parse(raw);
    } catch {
      body = null;
    }
    return { ok: res.ok, status: res.status, body, raw };
  } finally {
    clearTimeout(timer);
  }
}

async function callAnthropic(
  cfg: { apiKey: string; model: string; baseUrl: string },
  base64: string,
): Promise<{ text: string; usage: AiUsage }> {
  const base = cfg.baseUrl.replace(/\/+$/, "");
  const { ok, status, body, raw } = await fetchJson(`${base}/v1/messages`, {
    method: "POST",
    headers: {
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            { type: "text", text: INSTRUCAO },
          ],
        },
      ],
      output_config: { format: { type: "json_schema", schema: CONTA_SCHEMA } },
    }),
  });
  if (!ok) throw new Error(`Anthropic ${status}: ${raw.slice(0, 200)}`);
  const data = body as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const text = (data?.content ?? [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("");
  if (!text) throw new Error("Resposta vazia da Anthropic.");
  return {
    text,
    usage: {
      inputTokens: data?.usage?.input_tokens ?? null,
      outputTokens: data?.usage?.output_tokens ?? null,
    },
  };
}

async function callOpenAI(
  cfg: { apiKey: string; model: string; baseUrl: string },
  base64: string,
): Promise<{ text: string; usage: AiUsage }> {
  const base = cfg.baseUrl.replace(/\/+$/, "");
  const { ok, status, body, raw } = await fetchJson(`${base}/v1/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: cfg.model,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: INSTRUCAO },
            {
              type: "input_file",
              filename: "conta.pdf",
              file_data: `data:application/pdf;base64,${base64}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "conta_energia",
          schema: CONTA_SCHEMA,
          strict: true,
        },
      },
    }),
  });
  if (!ok) throw new Error(`OpenAI ${status}: ${raw.slice(0, 200)}`);
  const data = body as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type: string; text?: string }> }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  let text = typeof data?.output_text === "string" ? data.output_text : "";
  if (!text && Array.isArray(data?.output)) {
    for (const item of data.output) {
      for (const c of item?.content ?? []) {
        if (c?.type === "output_text" && typeof c.text === "string") {
          text += c.text;
        }
      }
    }
  }
  if (!text) throw new Error("Resposta vazia da OpenAI.");
  return {
    text,
    usage: {
      inputTokens: data?.usage?.input_tokens ?? null,
      outputTokens: data?.usage?.output_tokens ?? null,
    },
  };
}

// ---- normalização defensiva do JSON da IA para ContaParsed ----

function asNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(
      v.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""),
    );
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asInt(v: unknown): number | null {
  const n = asNum(v);
  return n == null ? null : Math.round(n);
}

function asStr(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function asComp(v: unknown): string | null {
  const s = asStr(v);
  return s && /^\d{4}-\d{2}$/.test(s) ? s : null;
}

function asDate(v: unknown): string | null {
  const s = asStr(v);
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function toContaParsed(obj: Record<string, unknown>): ContaParsed {
  const competencia = asComp(obj.competencia);
  let ano = asInt(obj.ano);
  let mes = asInt(obj.mes);
  if (competencia && (ano == null || mes == null)) {
    ano = Number(competencia.slice(0, 4));
    mes = Number(competencia.slice(5, 7));
  }

  const ucRaw = asStr(obj.installationNumber);
  const installationNumber = ucRaw ? ucRaw.replace(/\D/g, "") || null : null;

  const trib = (obj.tributos ?? {}) as Record<string, unknown>;
  const itens = Array.isArray(obj.itensFatura) ? obj.itensFatura : [];
  const itensFatura: ItemConta[] = itens
    .map((it) => {
      const o = (it ?? {}) as Record<string, unknown>;
      const descricao = asStr(o.descricao);
      return descricao ? { descricao, valor: asNum(o.valor) } : null;
    })
    .filter((x): x is ItemConta => x !== null);

  return {
    installationNumber,
    competencia,
    ano,
    mes,
    cliente: asStr(obj.cliente),
    vencimento: asDate(obj.vencimento),
    valor: asNum(obj.valor),
    notaFiscal: asStr(obj.notaFiscal),
    codigoBarras: asStr(obj.codigoBarras),
    leituraAnteriorData: asDate(obj.leituraAnteriorData),
    leituraData: asDate(obj.leituraData),
    leituraProximaData: asDate(obj.leituraProximaData),
    numeroDias: asInt(obj.numeroDias),
    energiaKwh: asNum(obj.energiaKwh),
    tributos: {
      pis: asNum(trib.pis),
      cofins: asNum(trib.cofins),
      icms: asNum(trib.icms),
    },
    itensFatura,
    aviso: asStr(obj.aviso),
    sceeExcedenteKwh: asNum(obj.sceeExcedenteKwh),
    sceeCreditosKwh: asNum(obj.sceeCreditosKwh),
    sceeSaldoProximoKwh: asNum(obj.sceeSaldoProximoKwh),
    sceeSaldoAnteriorKwh: asNum(obj.sceeSaldoAnteriorKwh),
    sceeTransfKwh: asNum(obj.sceeTransfKwh),
    sceeInjetadoKwh: asNum(obj.sceeInjetadoKwh),
    sceeCompensadoKwh: asNum(obj.sceeCompensadoKwh),
    sceeSaldoAtualKwh: asNum(obj.sceeSaldoAtualKwh),
  };
}

/**
 * Extrai os campos da conta via provedor de IA ativo. Retorna null quando não há
 * IA configurada/ativa. Lança em erro de rede/HTTP/resposta inválida — cabe ao
 * chamador cair para o regex.
 */
export async function parseContaComIA(
  buffer: Buffer,
): Promise<AiExtractResult | null> {
  const cfg = await getActiveAiConfig();
  if (!cfg) return null;

  const base64 = buffer.toString("base64");
  const { text, usage } =
    cfg.provider === "anthropic"
      ? await callAnthropic(cfg, base64)
      : await callOpenAI(cfg, base64);

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("JSON inválido retornado pela IA.");
  }
  if (!json || typeof json !== "object") {
    throw new Error("Resposta da IA não é um objeto.");
  }
  return {
    conta: toContaParsed(json as Record<string, unknown>),
    provider: cfg.provider,
    model: cfg.model,
    usage,
  };
}
