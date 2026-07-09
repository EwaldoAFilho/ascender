import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { requireRoleResponse } from "@/lib/auth/rbac";
import { withSessionTenant } from "@/lib/auth/tenant";
import { salvarAnexo } from "@/lib/cadastros/anexos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const ENTIDADES = new Set(["cliente"]);

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const deny = await requireRoleResponse("operador");
  if (deny) return deny;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  const entidade = String(form.get("entidade") ?? "");
  const entidadeId = String(form.get("entidadeId") ?? "");
  const file = form.get("file");

  if (!ENTIDADES.has(entidade) || !entidadeId) {
    return NextResponse.json({ error: "Entidade inválida." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecione um arquivo." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength === 0) {
    return NextResponse.json({ error: "Arquivo vazio." }, { status: 400 });
  }
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo acima de 25 MB." }, { status: 400 });
  }

  const nome = file.name || "anexo";
  const mimeType = file.type || "application/octet-stream";

  return withSessionTenant(async () => {
    try {
      const id = await salvarAnexo(entidade, entidadeId, nome, mimeType, buffer);
      return NextResponse.json({ ok: true, id });
    } catch {
      return NextResponse.json({ error: "Falha ao salvar o anexo." }, { status: 500 });
    }
  });
}
