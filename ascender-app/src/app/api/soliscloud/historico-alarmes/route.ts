import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { historicoAlarmes } from "@/lib/soliscloud/telemetria-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Linha do tempo de alarmes (histórico no banco), mais recentes primeiro.
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await historicoAlarmes(60));
}
