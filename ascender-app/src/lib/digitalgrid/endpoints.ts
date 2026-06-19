// Digital Grid — Billing API v1 (somente leitura).
export const DG_BASE_URL = "https://gestao.dg.energy/api/v1";

export const DG_ENDPOINTS = {
  agents: "/agents/",
  bills: "/bills/",
  estimatedQuota: "/estimated-quota/",
  financialCredits: "/financial-credits/",
  installations: "/installations/",
  entities: "/entities/",
  generators: "/generators/",
  monthlyGeneration: "/monthly-generation/",
} as const;
