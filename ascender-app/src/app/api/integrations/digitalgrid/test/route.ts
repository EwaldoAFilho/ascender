import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { requireRoleResponse } from "@/lib/auth/rbac";
import { withSessionTenant } from "@/lib/auth/tenant";
import { testDigitalGridConnection } from "@/lib/digitalgrid/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({ token: z.string().optional(), baseUrl: z.string().optional() })
  .nullable();

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const deny = await requireRoleResponse("admin");
  if (deny) return deny;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  const provided = parsed.success ? parsed.data : null;
  // Token digitado testa direto; sem token, testa o SALVO — escopado ao tenant
  // (testDigitalGridConnection lê a credencial via getCurrentTenantId).
  const result = provided?.token
    ? await testDigitalGridConnection({
        token: provided.token,
        baseUrl: provided.baseUrl,
      })
    : await withSessionTenant(() => testDigitalGridConnection(undefined));
  return NextResponse.json(result);
}
