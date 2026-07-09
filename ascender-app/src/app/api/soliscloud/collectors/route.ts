import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { withSessionTenant } from "@/lib/auth/tenant";
import { lerColetoresDoBanco } from "@/lib/soliscloud/telemetria-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lê os coletores/dataloggers do banco (worker sync-telemetria a cada ~10 min).
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  return withSessionTenant(async () =>
    NextResponse.json(await lerColetoresDoBanco()),
  );
}
