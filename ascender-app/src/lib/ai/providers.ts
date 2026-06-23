// Constantes compartilhadas (cliente + servidor) dos provedores de IA usados na
// leitura automática de PDFs (faturas). NÃO importar nada de servidor aqui — este
// módulo é consumido também por componentes client.

export type AiProvider = "anthropic" | "openai";

export type AiModelOption = { id: string; label: string };

export type AiProviderInfo = {
  label: string;
  defaultBaseUrl: string;
  defaultModel: string;
  models: AiModelOption[];
};

export const AI_PROVIDERS: Record<AiProvider, AiProviderInfo> = {
  anthropic: {
    label: "Claude (Anthropic)",
    defaultBaseUrl: "https://api.anthropic.com",
    defaultModel: "claude-sonnet-4-6",
    models: [
      { id: "claude-opus-4-8", label: "Claude Opus 4.8 (máxima precisão)" },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (recomendado)" },
      { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 (mais barato)" },
    ],
  },
  openai: {
    label: "OpenAI",
    defaultBaseUrl: "https://api.openai.com",
    defaultModel: "gpt-4o",
    models: [
      { id: "gpt-4o", label: "GPT-4o (recomendado)" },
      { id: "gpt-4o-mini", label: "GPT-4o mini (mais barato)" },
      { id: "gpt-4.1", label: "GPT-4.1" },
      { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
    ],
  },
};

export const AI_PROVIDER_LIST: AiProvider[] = ["anthropic", "openai"];

export function isAiProvider(value: string): value is AiProvider {
  return value === "anthropic" || value === "openai";
}

/** Valor da coluna `provider` em integration_credentials para um provedor de IA. */
export function aiRowKey(provider: AiProvider): string {
  return `ai_${provider}`;
}

/** Modelo válido para o provedor (cai no default se vier algo fora da lista). */
export function normalizeAiModel(provider: AiProvider, model?: string): string {
  const info = AI_PROVIDERS[provider];
  const wanted = model?.trim();
  if (wanted && info.models.some((m) => m.id === wanted)) return wanted;
  return info.defaultModel;
}
