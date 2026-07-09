import { and, eq } from "drizzle-orm";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";
import { getDb } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/db/tenant-context";
import { integrationCredentials } from "@/lib/db/schema";
import { DG_BASE_URL } from "./endpoints";

export const DG_PROVIDER = "digital_grid";

function whereDg() {
  return and(
    eq(integrationCredentials.tenantId, getCurrentTenantId()),
    eq(integrationCredentials.provider, DG_PROVIDER),
  );
}

// Reusa a tabela integration_credentials: keyId guarda o esquema do header
// ("Bearer"/"Token"); keySecretEnc guarda o token cifrado.
export async function getDgRow() {
  const rows = await getDb().select().from(integrationCredentials).where(whereDg());
  return rows[0] ?? null;
}

export async function getDgCredential(): Promise<{
  token: string;
  scheme: string;
  baseUrl: string;
} | null> {
  const row = await getDgRow();
  if (!row || !row.isActive) return null;
  return {
    token: decryptSecret(row.keySecretEnc),
    scheme: row.keyId || "Bearer",
    baseUrl: row.baseUrl || DG_BASE_URL,
  };
}

export async function saveDgToken(token: string, baseUrl?: string): Promise<void> {
  const keySecretEnc = encryptSecret(token);
  const url = baseUrl?.trim() || DG_BASE_URL;
  await getDb()
    .insert(integrationCredentials)
    .values({
      tenantId: getCurrentTenantId(),
      provider: DG_PROVIDER,
      keyId: "Bearer",
      keySecretEnc,
      baseUrl: url,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: [integrationCredentials.tenantId, integrationCredentials.provider],
      set: { keySecretEnc, baseUrl: url, updatedAt: new Date() },
    });
}

export async function recordDgTest(ok: boolean, scheme?: string): Promise<void> {
  await getDb()
    .update(integrationCredentials)
    .set({
      lastTestAt: new Date(),
      lastTestOk: ok,
      ...(scheme ? { keyId: scheme } : {}),
      updatedAt: new Date(),
    })
    .where(whereDg());
}
