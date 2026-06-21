import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { uptimeColetores } from "@/lib/soliscloud/telemetria-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Disponibilidade (uptime) dos coletores nas últimas 24h, do histórico no banco.
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await uptimeColetores(24));
}
