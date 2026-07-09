import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { requireRoleResponse } from "@/lib/auth/rbac";
import { getDgRow, saveDgToken } from "@/lib/digitalgrid/credentials";
import { DG_BASE_URL } from "@/lib/digitalgrid/endpoints";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Nunca retorna o token — apenas status e metadados.
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const row = await getDgRow();
  return NextResponse.json({
    configured: Boolean(row),
    baseUrl: row?.baseUrl ?? DG_BASE_URL,
    scheme: row?.keyId ?? null,
    lastTestAt: row?.lastTestAt ? row.lastTestAt.toISOString() : null,
    lastTestOk: row?.lastTestOk ?? null,
  });
}

const putSchema = z.object({
  token: z.string().optional().default(""),
  baseUrl: z.string().optional(),
});

export async function PUT(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const deny = await requireRoleResponse("admin");
  if (deny) return deny;

  const parsed = putSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const { token, baseUrl } = parsed.data;
  if (!token.trim()) {
    return NextResponse.json({ error: "Informe o token." }, { status: 400 });
  }
  await saveDgToken(token.trim(), baseUrl);
  return NextResponse.json({ ok: true });
}
