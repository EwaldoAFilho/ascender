import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { withSessionTenant } from "@/lib/auth/tenant";
import { historicoAlarmes } from "@/lib/soliscloud/telemetria-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Linha do tempo de alarmes (histórico no banco), mais recentes primeiro.
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  return withSessionTenant(async () =>
    NextResponse.json(await historicoAlarmes(60)),
  );
}
