import { and, eq } from "drizzle-orm";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";
import { getDb } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/db/tenant-context";
import { integrationCredentials } from "@/lib/db/schema";
import type { SolisCredentials } from "./client";
import { normalizeBaseUrl, SOLIS_DEFAULT_BASE_URL } from "./endpoints";

export const SOLIS_PROVIDER = "soliscloud";

// Filtro (tenant atual, provider) — credenciais são por tenant.
function whereSolis() {
  return and(
    eq(integrationCredentials.tenantId, getCurrentTenantId()),
    eq(integrationCredentials.provider, SOLIS_PROVIDER),
  );
}

export async function getSolisCredentialRow() {
  const rows = await getDb().select().from(integrationCredentials).where(whereSolis());
  return rows[0] ?? null;
}

/** Credenciais decifradas para uso no servidor (assinatura). Nunca expor. */
export async function getSolisCredentials(): Promise<SolisCredentials | null> {
  const row = await getSolisCredentialRow();
  if (!row || !row.isActive) return null;
  return {
    keyId: row.keyId,
    keySecret: decryptSecret(row.keySecretEnc),
    baseUrl: row.baseUrl || SOLIS_DEFAULT_BASE_URL,
  };
}

export async function saveSolisCredentials(input: {
  keyId: string;
  keySecret: string;
  baseUrl?: string;
}): Promise<void> {
  const keySecretEnc = encryptSecret(input.keySecret);
  const baseUrl = normalizeBaseUrl(input.baseUrl);
  await getDb()
    .insert(integrationCredentials)
    .values({
      tenantId: getCurrentTenantId(),
      provider: SOLIS_PROVIDER,
      keyId: input.keyId,
      keySecretEnc,
      baseUrl,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: [integrationCredentials.tenantId, integrationCredentials.provider],
      set: { keyId: input.keyId, keySecretEnc, baseUrl, updatedAt: new Date() },
    });
}

/** Atualiza apenas keyId/baseUrl, preservando o segredo já cifrado. */
export async function updateSolisCredentialMeta(input: {
  keyId: string;
  baseUrl?: string;
}): Promise<void> {
  await getDb()
    .update(integrationCredentials)
    .set({
      keyId: input.keyId,
      baseUrl: normalizeBaseUrl(input.baseUrl),
      updatedAt: new Date(),
    })
    .where(whereSolis());
}

export async function recordSolisTestResult(ok: boolean): Promise<void> {
  await getDb()
    .update(integrationCredentials)
    .set({ lastTestAt: new Date(), lastTestOk: ok, updatedAt: new Date() })
    .where(whereSolis());
}
