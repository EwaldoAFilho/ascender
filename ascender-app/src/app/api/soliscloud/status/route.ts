import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { withSessionTenant } from "@/lib/auth/tenant";
import { maskKey } from "@/lib/crypto/secrets";
import { getSolisCredentialRow } from "@/lib/soliscloud/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  return withSessionTenant(async () => {
    const row = await getSolisCredentialRow();
    return NextResponse.json({
      configured: Boolean(row),
      connected: row?.lastTestOk ?? false,
      lastSyncAt: row?.lastTestAt ? row.lastTestAt.toISOString() : null,
      keyIdMasked: row ? maskKey(row.keyId) : null,
      baseUrl: row?.baseUrl ?? null,
    });
  });
}
