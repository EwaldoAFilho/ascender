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
const MIN_INTERVAL_MS = 600; // respeita ~2 req/s por endpoint, com folga

const lastCallAt = new Map<string, number>();

async function throttle(resourcePath: string): Promise<void> {
  const last = lastCallAt.get(resourcePath) ?? 0;
  const wait = Math.max(0, last + MIN_INTERVAL_MS - Date.now());
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastCallAt.set(resourcePath, Date.now());
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

  await throttle(resourcePath);

  const headers = buildAuthHeaders({
    keyId: creds.keyId,
    keySecret: creds.keySecret,
    resourcePath,
    body,
  });
  const url = `${normalizeBaseUrl(creds.baseUrl)}${resourcePath}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    throw new SolisApiError("Falha de conexão com a SolisCloud.");
  }

  if (!res.ok) {
    throw new SolisApiError(`SolisCloud respondeu HTTP ${res.status}.`, {
      status: res.status,
    });
  }

  const json = (await res.json().catch(() => null)) as SolisEnvelope<T> | null;
  if (!json) {
    throw new SolisApiError("Resposta inválida da SolisCloud.");
  }

  const code = String(json.code ?? "");
  const ok =
    json.success === true || code === "0" || code === "1" || code === "1000000";
  if (!ok) {
    throw new SolisApiError(
      friendlyError(code, json.msg || "Erro retornado pela SolisCloud."),
      { code },
    );
  }

  const data = json.data as T;
  if (useCache) setCached(cacheKey, data, CACHE_TTL_MS);
  return data;
}
