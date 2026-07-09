import { and, eq, inArray } from "drizzle-orm";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";
import { getDb } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/db/tenant-context";
import { integrationCredentials } from "@/lib/db/schema";
import {
  AI_PROVIDER_LIST,
  AI_PROVIDERS,
  aiRowKey,
  isAiProvider,
  normalizeAiModel,
  type AiProvider,
} from "./providers";

// Reusa a tabela integration_credentials (linhas de IA por tenant, provider =
// "ai_anthropic" | "ai_openai"):
//   - keyId        → modelo selecionado (não é segredo)
//   - keySecretEnc → chave de API cifrada (AES-256-GCM)
//   - isActive     → provedor ativo p/ extração (no máximo um true por tenant)

const AI_ROW_KEYS = AI_PROVIDER_LIST.map(aiRowKey);

export type AiProviderStatus = {
  provider: AiProvider;
  configured: boolean;
  active: boolean;
  model: string;
  baseUrl: string;
  lastTestAt: string | null;
  lastTestOk: boolean | null;
};

function tenantEq() {
  return eq(integrationCredentials.tenantId, getCurrentTenantId());
}

function providerFromRowKey(rowKey: string): AiProvider | null {
  const raw = rowKey.startsWith("ai_") ? rowKey.slice(3) : rowKey;
  return isAiProvider(raw) ? raw : null;
}

async function getAiRows() {
  return getDb()
    .select()
    .from(integrationCredentials)
    .where(and(tenantEq(), inArray(integrationCredentials.provider, AI_ROW_KEYS)));
}

/** Status de ambos os provedores (nunca expõe a chave). */
export async function getAiStatus(): Promise<AiProviderStatus[]> {
  const rows = await getAiRows();
  const byProvider = new Map<AiProvider, (typeof rows)[number]>();
  for (const row of rows) {
    const provider = providerFromRowKey(row.provider);
    if (provider) byProvider.set(provider, row);
  }
  return AI_PROVIDER_LIST.map((provider) => {
    const row = byProvider.get(provider);
    const info = AI_PROVIDERS[provider];
    return {
      provider,
      configured: Boolean(row),
      active: row?.isActive ?? false,
      model: normalizeAiModel(provider, row?.keyId),
      baseUrl: row?.baseUrl || info.defaultBaseUrl,
      lastTestAt: row?.lastTestAt ? row.lastTestAt.toISOString() : null,
      lastTestOk: row?.lastTestOk ?? null,
    } satisfies AiProviderStatus;
  });
}

/** Chave decifrada de um provedor (uso interno no servidor). Nunca expor. */
export async function getAiApiKey(provider: AiProvider): Promise<string | null> {
  const rows = await getDb()
    .select()
    .from(integrationCredentials)
    .where(and(tenantEq(), eq(integrationCredentials.provider, aiRowKey(provider))));
  const row = rows[0];
  return row ? decryptSecret(row.keySecretEnc) : null;
}

/** Configuração do provedor ativo, decifrada — para a etapa de extração. */
export async function getActiveAiConfig(): Promise<{
  provider: AiProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
} | null> {
  const rows = await getAiRows();
  const active = rows.find((row) => row.isActive);
  if (!active) return null;
  const provider = providerFromRowKey(active.provider);
  if (!provider) return null;
  return {
    provider,
    apiKey: decryptSecret(active.keySecretEnc),
    model: normalizeAiModel(provider, active.keyId),
    baseUrl: active.baseUrl || AI_PROVIDERS[provider].defaultBaseUrl,
  };
}

export async function saveAiProvider(input: {
  provider: AiProvider;
  apiKey?: string;
  model: string;
  baseUrl?: string;
  makeActive: boolean;
}): Promise<void> {
  const rowKey = aiRowKey(input.provider);
  const info = AI_PROVIDERS[input.provider];
  const model = normalizeAiModel(input.provider, input.model);
  const baseUrl = input.baseUrl?.trim() || info.defaultBaseUrl;

  const existing = await getDb()
    .select()
    .from(integrationCredentials)
    .where(and(tenantEq(), eq(integrationCredentials.provider, rowKey)));
  const current = existing[0];

  let keySecretEnc: string;
  const typedKey = input.apiKey?.trim();
  if (typedKey) {
    keySecretEnc = encryptSecret(typedKey);
  } else if (current) {
    keySecretEnc = current.keySecretEnc; // mantém a chave já cifrada
  } else {
    throw new Error("Informe a chave de API.");
  }

  await getDb()
    .insert(integrationCredentials)
    .values({
      tenantId: getCurrentTenantId(),
      provider: rowKey,
      keyId: model,
      keySecretEnc,
      baseUrl,
      isActive: input.makeActive,
    })
    .onConflictDoUpdate({
      target: [integrationCredentials.tenantId, integrationCredentials.provider],
      set: {
        keyId: model,
        keySecretEnc,
        baseUrl,
        isActive: input.makeActive,
        updatedAt: new Date(),
      },
    });

  if (input.makeActive) {
    const others = AI_ROW_KEYS.filter((key) => key !== rowKey);
    if (others.length > 0) {
      await getDb()
        .update(integrationCredentials)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(tenantEq(), inArray(integrationCredentials.provider, others)));
    }
  }
}

export async function recordAiTestResult(
  provider: AiProvider,
  ok: boolean,
): Promise<void> {
  await getDb()
    .update(integrationCredentials)
    .set({ lastTestAt: new Date(), lastTestOk: ok, updatedAt: new Date() })
    .where(and(tenantEq(), eq(integrationCredentials.provider, aiRowKey(provider))));
}
