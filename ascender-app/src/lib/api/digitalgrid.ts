export type DgStatus = {
  configured: boolean;
  baseUrl: string;
  scheme: string | null;
  lastTestAt: string | null;
  lastTestOk: boolean | null;
};

export type DgTestResult = {
  ok: boolean;
  scheme?: string;
  count?: number;
  error?: string;
};

export async function fetchDgStatus(): Promise<DgStatus> {
  const res = await fetch("/api/integrations/digitalgrid/credentials", {
    credentials: "include",
  });
  const data = (await res.json().catch(() => null)) as
    | (DgStatus & { error?: string })
    | null;
  if (!res.ok) throw new Error(data?.error ?? `Erro ${res.status}.`);
  return data as DgStatus;
}

export async function saveDgToken(input: {
  token: string;
  baseUrl?: string;
}): Promise<{ ok: boolean }> {
  const res = await fetch("/api/integrations/digitalgrid/credentials", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error ?? "Erro ao salvar o token.");
  return { ok: true };
}

export async function testDg(input?: {
  token?: string;
  baseUrl?: string;
}): Promise<DgTestResult> {
  const res = await fetch("/api/integrations/digitalgrid/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input ?? {}),
  });
  if (res.status === 401) throw new Error("Sessão expirada. Entre novamente.");
  const data = (await res.json().catch(() => null)) as DgTestResult | null;
  return data ?? { ok: false, error: "Sem resposta do servidor." };
}
