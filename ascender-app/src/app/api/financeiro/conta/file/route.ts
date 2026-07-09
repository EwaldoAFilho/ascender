import { requireSession } from "@/lib/auth/guard";
import { withSessionTenant } from "@/lib/auth/tenant";
import { getContaFile } from "@/lib/financeiro/conta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const faturaDgId = new URL(request.url).searchParams.get("faturaDgId");
  if (!faturaDgId) {
    return new Response("faturaDgId obrigatório.", { status: 400 });
  }

  return withSessionTenant(async () => {
    const file = await getContaFile(faturaDgId);
    if (!file) return new Response("Conta não encontrada.", { status: 404 });

    const bytes = Buffer.from(file.base64, "base64");
    return new Response(bytes, {
      headers: {
        "Content-Type": file.mimeType || "application/pdf",
        "Content-Disposition": `inline; filename="${file.nome ?? "conta.pdf"}"`,
        "Cache-Control": "private, no-store",
      },
    });
  });
}
