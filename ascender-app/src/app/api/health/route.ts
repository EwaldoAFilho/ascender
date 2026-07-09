import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liveness pública (sem sessão) para o healthcheck do Docker: confirma que o
// servidor Next responde. Não toca no banco (evita reinício em blip do DB, que
// tem healthcheck próprio) e não expõe nenhum dado.
export function GET() {
  return NextResponse.json({ ok: true });
}
