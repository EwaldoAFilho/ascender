import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { requireRoleResponse } from "@/lib/auth/rbac";
import { withSessionTenant } from "@/lib/auth/tenant";
import { getAiStatus, saveAiProvider } from "@/lib/ai/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Nunca retorna a chave — apenas status e metadados de cada provedor.
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  return withSessionTenant(async () => {
    const providers = await getAiStatus();
    return NextResponse.json({ providers });
  });
}

const putSchema = z.object({
  provider: z.enum(["anthropic", "openai"]),
  apiKey: z.string().optional(),
  model: z.string().min(1),
  baseUrl: z.string().optional(),
  makeActive: z.boolean().optional().default(true),
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

  return withSessionTenant(async () => {
    try {
      await saveAiProvider({
        provider: parsed.data.provider,
        apiKey: parsed.data.apiKey,
        model: parsed.data.model,
        baseUrl: parsed.data.baseUrl,
        makeActive: parsed.data.makeActive,
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Erro ao salvar." },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true });
  });
}
