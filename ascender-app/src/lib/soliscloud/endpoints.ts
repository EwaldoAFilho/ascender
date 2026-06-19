// Caminhos (resourcePath) dos endpoints SolisCloud usados pelo sistema.
export const SOLIS_ENDPOINTS = {
  userStationList: "/v1/api/userStationList",
  stationDetail: "/v1/api/stationDetail",
  stationDay: "/v1/api/stationDay",
  stationMonth: "/v1/api/stationMonth",
  stationYear: "/v1/api/stationYear",
  inverterList: "/v1/api/inverterList",
  inverterDetail: "/v1/api/inverterDetail",
  alarmList: "/v1/api/alarmList",
  collectorList: "/v1/api/collectorList",
} as const;

export const SOLIS_DEFAULT_BASE_URL = "https://www.soliscloud.com:13333";

/**
 * Normaliza a URL base: garante o protocolo (assume https:// se ausente) e
 * remove barras finais. Evita "fetch failed" quando o usuário digita só
 * "www.soliscloud.com:13333".
 */
export function normalizeBaseUrl(base: string | null | undefined): string {
  const trimmed = (base ?? "").trim();
  if (!trimmed) return SOLIS_DEFAULT_BASE_URL;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

// Códigos de erro conhecidos → mensagens amigáveis (chunk 121 da base).
export const SOLIS_ERROR_MESSAGES: Record<string, string> = {
  I0012: "Credenciais inválidas (KeyId/KeySecret).",
  R0000: "Sem permissão de acesso na API SolisCloud.",
};
