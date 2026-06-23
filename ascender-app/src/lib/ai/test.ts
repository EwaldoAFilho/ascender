import { AI_PROVIDERS, type AiProvider } from "./providers";

export type AiTestResult = {
  ok: boolean;
  modelCount?: number;
  error?: string;
};

// Valida a chave com um GET /v1/models — leve, sem instalar SDK. Funciona para
// Anthropic (header x-api-key) e OpenAI (Authorization: Bearer).
export async function testAiConnection(
  provider: AiProvider,
  apiKey: string,
  baseUrl?: string,
): Promise<AiTestResult> {
  const base = (baseUrl?.trim() || AI_PROVIDERS[provider].defaultBaseUrl).replace(
    /\/+$/,
    "",
  );
  const url = `${base}/v1/models`;
  const headers: Record<string, string> =
    provider === "anthropic"
      ? { "x-api-key": apiKey, "anthropic-version": "2023-06-01" }
      : { Authorization: `Bearer ${apiKey}` };

  try {
    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      const detail = body?.error?.message;
      return {
        ok: false,
        error: detail
          ? `${res.status}: ${detail}`
          : `Falha ao validar a chave (HTTP ${res.status}).`,
      };
    }
    const data = (await res.json().catch(() => null)) as {
      data?: unknown[];
    } | null;
    const modelCount = Array.isArray(data?.data) ? data!.data!.length : undefined;
    return { ok: true, modelCount };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro de rede ao validar.",
    };
  }
}
