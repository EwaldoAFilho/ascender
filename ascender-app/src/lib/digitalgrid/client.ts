import { getDgCredential, recordDgTest } from "./credentials";
import { DG_BASE_URL, DG_ENDPOINTS } from "./endpoints";

const SCHEMES = ["Bearer", "Token"] as const;

/** GET autenticado a um recurso do Digital Grid (somente leitura). */
export async function dgGet<T = unknown>(
  path: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const c = await getDgCredential();
  if (!c) throw new Error("Integração Digital Grid não configurada.");
  const qs = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ).toString()
    : "";
  const url = `${c.baseUrl.replace(/\/$/, "")}${path}${qs}`;
  const r = await fetch(url, {
    headers: { Authorization: `${c.scheme} ${c.token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Digital Grid HTTP ${r.status} em ${path}`);
  return (await r.json()) as T;
}

export type DgTestResult = {
  ok: boolean;
  scheme?: string;
  count?: number;
  error?: string;
};

/**
 * Testa a conexão com o Digital Grid em `GET /agents/`. Tenta os esquemas de
 * header "Bearer" e "Token" (a doc usa "Bearer"; DRF às vezes usa "Token") e,
 * quando testa o token salvo, grava qual esquema funcionou.
 */
export async function testDigitalGridConnection(input?: {
  token?: string;
  baseUrl?: string;
}): Promise<DgTestResult> {
  const usingSaved = !input?.token;
  let token: string;
  let baseUrl: string;
  if (input?.token) {
    token = input.token;
    baseUrl = input.baseUrl?.trim() || DG_BASE_URL;
  } else {
    const c = await getDgCredential();
    if (!c) return { ok: false, error: "Nenhum token salvo para testar." };
    token = c.token;
    baseUrl = c.baseUrl;
  }

  const url = `${baseUrl.replace(/\/$/, "")}${DG_ENDPOINTS.agents}?page=1`;
  let lastStatus = 0;

  for (const scheme of SCHEMES) {
    try {
      const r = await fetch(url, {
        headers: {
          Authorization: `${scheme} ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });
      lastStatus = r.status;
      if (r.ok) {
        const j = (await r.json().catch(() => null)) as
          | { count?: number }
          | unknown[]
          | null;
        const count = Array.isArray(j)
          ? j.length
          : j && typeof j === "object" && typeof j.count === "number"
            ? j.count
            : undefined;
        if (usingSaved) await recordDgTest(true, scheme);
        return { ok: true, scheme, count };
      }
      // Erro que não é de autenticação: não adianta tentar outro esquema.
      if (r.status !== 401 && r.status !== 403) break;
    } catch {
      if (usingSaved) await recordDgTest(false);
      return { ok: false, error: "Falha de conexão com o Digital Grid." };
    }
  }

  if (usingSaved) await recordDgTest(false);
  return {
    ok: false,
    error:
      lastStatus === 401 || lastStatus === 403
        ? "Token inválido ou sem permissão (401/403)."
        : `Digital Grid respondeu HTTP ${lastStatus}.`,
  };
}
