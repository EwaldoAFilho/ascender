import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { withSessionTenant } from "@/lib/auth/tenant";
import { geracaoDiariaFrota } from "@/lib/soliscloud/telemetria-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Geração diária da frota (realizado × meta) dos últimos 14 dias, do banco.
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  return withSessionTenant(async () =>
    NextResponse.json(await geracaoDiariaFrota(14)),
  );
}
