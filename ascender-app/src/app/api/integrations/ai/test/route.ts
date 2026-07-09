import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { requireRoleResponse } from "@/lib/auth/rbac";
import { withSessionTenant } from "@/lib/auth/tenant";
import { getAiApiKey, recordAiTestResult } from "@/lib/ai/credentials";
import { testAiConnection } from "@/lib/ai/test";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  provider: z.enum(["anthropic", "openai"]),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const deny = await requireRoleResponse("admin");
  if (deny) return deny;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { provider, baseUrl } = parsed.data;
  const typedKey = parsed.data.apiKey?.trim();
  const usingSaved = !typedKey;
  // Ler a chave salva é escopado ao tenant (getAiApiKey usa getCurrentTenantId).
  const apiKey =
    typedKey ?? (await withSessionTenant(() => getAiApiKey(provider)));
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error: "Configure a chave de API antes de testar.",
    });
  }

  const result = await testAiConnection(provider, apiKey, baseUrl);
  if (usingSaved) {
    await withSessionTenant(() => recordAiTestResult(provider, result.ok));
  }
  return NextResponse.json(result);
}
