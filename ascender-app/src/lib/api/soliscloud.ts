import type {
  InverterTelemetry,
  SolisAlarm,
  SolisTelemetry,
} from "@/types/soliscloud";

// Client de browser para os route handlers internos (/api/soliscloud/*).
// O front nunca fala direto com a SolisCloud — assinatura/segredo ficam no
// servidor.

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  const data = (await res.json().catch(() => null)) as
    | (T & { error?: string; code?: string })
    | null;
  if (!res.ok) {
    const message =
      (data && "error" in data && data.error) || `Erro ${res.status}.`;
    throw new ApiError(message, res.status, data?.code);
  }
  return data as T;
}

export function fetchStations() {
  return getJson<SolisTelemetry[]>("/api/soliscloud/stations");
}

export function fetchStationDetail(id: string) {
  return getJson<SolisTelemetry>(
    `/api/soliscloud/stations/${encodeURIComponent(id)}`,
  );
}

export function fetchInverters(stationId?: string) {
  const qs = stationId ? `?stationId=${encodeURIComponent(stationId)}` : "";
  return getJson<InverterTelemetry[]>(`/api/soliscloud/inverters${qs}`);
}

export function fetchAlarms(stationId?: string) {
  const qs = stationId ? `?stationId=${encodeURIComponent(stationId)}` : "";
  return getJson<SolisAlarm[]>(`/api/soliscloud/alarms${qs}`);
}

export type IntegrationStatus = {
  configured: boolean;
  connected: boolean;
  lastSyncAt: string | null;
  keyIdMasked: string | null;
  baseUrl: string | null;
};

export function fetchIntegrationStatus() {
  return getJson<IntegrationStatus>("/api/soliscloud/status");
}

export type CredentialsStatus = {
  configured: boolean;
  keyIdMasked: string | null;
  baseUrl: string;
  lastTestAt: string | null;
  lastTestOk: boolean | null;
};

export function fetchCredentials() {
  return getJson<CredentialsStatus>(
    "/api/integrations/soliscloud/credentials",
  );
}

export async function saveCredentials(input: {
  keyId: string;
  keySecret?: string;
  baseUrl?: string;
}) {
  const res = await fetch("/api/integrations/soliscloud/credentials", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => null)) as {
    ok?: boolean;
    error?: string;
    code?: string;
  } | null;
  if (!res.ok) {
    throw new ApiError(data?.error ?? "Erro ao salvar.", res.status, data?.code);
  }
  return data;
}

export type TestResult = {
  ok: boolean;
  stationCount?: number;
  error?: string;
  code?: string;
};

export async function testConnection(input?: {
  keyId?: string;
  keySecret?: string;
  baseUrl?: string;
}): Promise<TestResult> {
  const res = await fetch("/api/integrations/soliscloud/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input ?? {}),
  });
  const data = (await res.json().catch(() => null)) as TestResult | null;
  if (res.status === 401) {
    throw new ApiError("Sessão expirada. Entre novamente.", 401);
  }
  return data ?? { ok: false, error: "Sem resposta do servidor." };
}

export type GenerationPeriod = "day" | "month" | "year";

export type GenerationSeries = {
  period: GenerationPeriod;
  unit: "kW" | "kWh";
  points: { label: string; value: number; money: number | null }[];
  totalKwh: number | null;
  totalMoney: number | null;
  peakKw: number | null;
};

export function fetchGeneration(stationId: string, period: GenerationPeriod) {
  return getJson<GenerationSeries>(
    `/api/soliscloud/stations/${encodeURIComponent(stationId)}/generation?period=${period}`,
  );
}
