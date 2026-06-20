import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { historicoPotenciaFrota } from "@/lib/soliscloud/telemetria-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Curva de potência da frota nas últimas 24h, do histórico de snapshots no banco.
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await historicoPotenciaFrota(24));
}
