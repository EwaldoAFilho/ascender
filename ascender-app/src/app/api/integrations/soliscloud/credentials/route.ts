import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { requireRoleResponse } from "@/lib/auth/rbac";
import { maskKey } from "@/lib/crypto/secrets";
import { SOLIS_DEFAULT_BASE_URL } from "@/lib/soliscloud/endpoints";
import {
  getSolisCredentialRow,
  saveSolisCredentials,
  updateSolisCredentialMeta,
} from "@/lib/soliscloud/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Nunca retorna o KeySecret — apenas o KeyId mascarado e metadados.
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const row = await getSolisCredentialRow();
  return NextResponse.json({
    configured: Boolean(row),
    keyIdMasked: row ? maskKey(row.keyId) : null,
    baseUrl: row?.baseUrl ?? SOLIS_DEFAULT_BASE_URL,
    lastTestAt: row?.lastTestAt ? row.lastTestAt.toISOString() : null,
    lastTestOk: row?.lastTestOk ?? null,
  });
}

const putSchema = z.object({
  keyId: z.string().min(1),
  keySecret: z.string().optional().default(""),
  baseUrl: z.string().optional(),
});

export async function PUT(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const deny = await requireRoleResponse("admin");
  if (deny) return deny;

  const parsed = putSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Informe ao menos o KeyId." },
      { status: 400 },
    );
  }

  const { keyId, keySecret, baseUrl } = parsed.data;
  const existing = await getSolisCredentialRow();

  if (keySecret.trim().length > 0) {
    // Novo segredo informado: cifra e salva (upsert).
    await saveSolisCredentials({ keyId, keySecret: keySecret.trim(), baseUrl });
  } else if (existing) {
    // Sem novo segredo: atualiza apenas keyId/baseUrl, preservando o cifrado.
    await updateSolisCredentialMeta({ keyId, baseUrl });
  } else {
    return NextResponse.json(
      { error: "Informe o KeySecret na primeira configuração." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
