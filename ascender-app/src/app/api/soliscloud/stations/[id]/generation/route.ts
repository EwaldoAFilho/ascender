import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { curvaGeracaoBanco } from "@/lib/soliscloud/telemetria-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Curva de geração da estação, lida do banco (sync-first): dia/mês dos snapshots
// de telemetria; ano de medicoes_geracao. Não bate mais na SolisCloud ao vivo.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const p = new URL(request.url).searchParams.get("period");
  const period = p === "month" || p === "year" ? p : "day";

  return NextResponse.json(await curvaGeracaoBanco(id, period));
}
