import { getCached, setCached } from "@/lib/cache/ttlCache";
import { normalizeBaseUrl, SOLIS_ERROR_MESSAGES } from "./endpoints";
import { buildAuthHeaders } from "./sign";
import type { SolisEnvelope } from "./types";

export type SolisCredentials = {
  keyId: string;
  keySecret: string;
  baseUrl: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000; // dados SolisCloud atualizam a cada ~5 min
// Espaçamento GLOBAL entre chamadas. A SolisCloud aplica rate limit por conta
// (não por endpoint), então telas que disparam várias chamadas ao mesmo tempo
// (estações + inversores + alarmes + coletores) precisam compartilhar a fila.
const MIN_INTERVAL_MS = 600; // ~1,6 req/s, com folga sobre o limite da conta
const MAX_RETRIES = 2; // tentativas extras para erros transitórios (rede/5xx/429)

let lastCallAt = 0;
let queue: Promise<unknown> = Promise.resolve();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reserva um "slot" de envio na fila global, garantindo MIN_INTERVAL_MS entre o
 * início de duas chamadas quaisquer à SolisCloud — mesmo de requisições
 * concorrentes. Sem isso, abrir a tela (4 chamadas paralelas) estoura o rate
 * limit e a 1ª carga falha; só depois, com o cache quente, ela passa.
 */
function reserveSlot(): Promise<void> {
  const run = queue.then(async () => {
    const wait = Math.max(0, lastCallAt + MIN_INTERVAL_MS - Date.now());
    if (wait > 0) await sleep(wait);
    lastCallAt = Date.now();
  });
  // A próxima chamada espera esta reservar o slot, mesmo que ela falhe depois.
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function isTransientStatus(status: number): boolean {
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

export class SolisApiError extends Error {
  code?: string;
  status?: number;
  constructor(message: string, opts?: { code?: string; status?: number }) {
    super(message);
    this.name = "SolisApiError";
    this.code = opts?.code;
    this.status = opts?.status;
  }
}

function friendlyError(code: string, fallback: string): string {
  return SOLIS_ERROR_MESSAGES[code] ?? fallback;
}

/**
 * Faz uma chamada assinada (POST) a um endpoint SolisCloud e devolve `data`.
 * O `keySecret` é usado apenas aqui (servidor) para assinar; nunca é exposto.
 *
 * As chamadas passam por uma fila global (reserveSlot) e fazem retry com
 * backoff em falhas transitórias. Erros lógicos da API (credencial/permissão)
 * não são repetidos — são determinísticos.
 */
export async function callSolis<T>(
  creds: SolisCredentials,
  resourcePath: string,
  payload: Record<string, unknown>,
  opts?: { cache?: boolean },
): Promise<T> {
  const body = JSON.stringify(payload);
  const cacheKey = `${resourcePath}:${body}`;
  const useCache = opts?.cache ?? true;

  if (useCache) {
    const hit = getCached<T>(cacheKey);
    if (hit !== undefined) return hit;
  }

  const url = `${normalizeBaseUrl(creds.baseUrl)}${resourcePath}`;
  let lastError: SolisApiError = new SolisApiError(
    "Falha ao consultar a SolisCloud.",
  );

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) await sleep(800 * attempt); // backoff linear: 0,8s / 1,6s
    await reserveSlot();

    // Assinatura refeita a cada tentativa: o Date (±15 min) fica sempre fresco.
    const headers = buildAuthHeaders({
      keyId: creds.keyId,
      keySecret: creds.keySecret,
      resourcePath,
      body,
    });

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers,
        body,
        cache: "no-store",
      });
    } catch {
      lastError = new SolisApiError("Falha de conexão com a SolisCloud.");
      continue; // erro de rede é transitório → tenta de novo
    }

    if (!res.ok) {
      lastError = new SolisApiError(`SolisCloud respondeu HTTP ${res.status}.`, {
        status: res.status,
      });
      if (isTransientStatus(res.status) && attempt < MAX_RETRIES) continue;
      throw lastError;
    }

    const json = (await res.json().catch(() => null)) as SolisEnvelope<T> | null;
    if (!json) {
      lastError = new SolisApiError("Resposta inválida da SolisCloud.");
      if (attempt < MAX_RETRIES) continue;
      throw lastError;
    }

    const code = String(json.code ?? "");
    const ok =
      json.success === true ||
      code === "0" ||
      code === "1" ||
      code === "1000000";
    if (!ok) {
      // Erro lógico (credencial, permissão, parâmetro) — determinístico.
      throw new SolisApiError(
        friendlyError(code, json.msg || "Erro retornado pela SolisCloud."),
        { code },
      );
    }

    const data = json.data as T;
    if (useCache) setCached(cacheKey, data, CACHE_TTL_MS);
    return data;
  }

  throw lastError;
}
