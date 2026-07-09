import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { withSessionTenant } from "@/lib/auth/tenant";
import { ultimaTelemetriaEm } from "@/lib/soliscloud/telemetria-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Momento da última coleta de telemetria no banco (para o selo "atualizado há X").
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  return withSessionTenant(async () =>
    NextResponse.json({ iso: await ultimaTelemetriaEm() }),
  );
}
