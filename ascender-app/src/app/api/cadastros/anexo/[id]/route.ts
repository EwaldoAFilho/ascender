import { requireSession } from "@/lib/auth/guard";
import { withSessionTenant } from "@/lib/auth/tenant";
import { getAnexoFile } from "@/lib/cadastros/anexos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  return withSessionTenant(async () => {
    const file = await getAnexoFile(id);
    if (!file) return new Response("Anexo não encontrado.", { status: 404 });

    const baixar = new URL(request.url).searchParams.get("download") === "1";
    const disposicao = baixar ? "attachment" : "inline";
    const nomeSeguro = (file.nome || "anexo").replace(/"/g, "");

    return new Response(new Uint8Array(file.conteudo), {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `${disposicao}; filename="${nomeSeguro}"`,
        "Cache-Control": "private, no-store",
      },
    });
  });
}
