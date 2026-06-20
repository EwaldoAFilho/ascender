import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { lerEstacoesDoBanco } from "@/lib/soliscloud/telemetria-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lê a telemetria das estações do banco (worker sync-telemetria a cada ~10 min).
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await lerEstacoesDoBanco());
}
