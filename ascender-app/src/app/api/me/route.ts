import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { isPlatformAdmin } from "@/lib/auth/platform";
import { getSessionRole } from "@/lib/auth/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dados do usuário logado para a UI (ex.: mostrar o link do painel do operador só
// para quem é operador da plataforma). Não expõe segredo.
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const [platform, role] = await Promise.all([
    isPlatformAdmin(),
    getSessionRole(),
  ]);
  return NextResponse.json({
    email: auth.session.email ?? null,
    role,
    isPlatformAdmin: platform,
  });
}
