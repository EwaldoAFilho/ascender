import type { AiProvider } from "@/lib/ai/providers";

export type AiProviderStatus = {
  provider: AiProvider;
  configured: boolean;
  active: boolean;
  model: string;
  baseUrl: string;
  lastTestAt: string | null;
  lastTestOk: boolean | null;
};

export type AiTestResult = {
  ok: boolean;
  modelCount?: number;
  error?: string;
};

export async function fetchAiStatus(): Promise<AiProviderStatus[]> {
  const res = await fetch("/api/integrations/ai/credentials", {
    credentials: "include",
  });
  const data = (await res.json().catch(() => null)) as
    | { providers?: AiProviderStatus[]; error?: string }
    | null;
  if (!res.ok) throw new Error(data?.error ?? `Erro ${res.status}.`);
  return data?.providers ?? [];
}

export async function saveAiProvider(input: {
  provider: AiProvider;
  apiKey?: string;
  model: string;
  baseUrl?: string;
  makeActive: boolean;
}): Promise<{ ok: boolean }> {
  const res = await fetch("/api/integrations/ai/credentials", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error ?? "Erro ao salvar a configuração.");
  return { ok: true };
}

export async function testAi(input: {
  provider: AiProvider;
  apiKey?: string;
  baseUrl?: string;
}): Promise<AiTestResult> {
  const res = await fetch("/api/integrations/ai/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 401) throw new Error("Sessão expirada. Entre novamente.");
  const data = (await res.json().catch(() => null)) as AiTestResult | null;
  return data ?? { ok: false, error: "Sem resposta do servidor." };
}
