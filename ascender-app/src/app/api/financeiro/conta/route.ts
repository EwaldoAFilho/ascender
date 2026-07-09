import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { requireRoleResponse } from "@/lib/auth/rbac";
import { withSessionTenant } from "@/lib/auth/tenant";
import {
  excluirContaEnergia,
  getContaEnergia,
  salvarContaEnergia,
} from "@/lib/financeiro/conta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export async function GET(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const faturaDgId = new URL(request.url).searchParams.get("faturaDgId");
  if (!faturaDgId) {
    return NextResponse.json({ error: "faturaDgId obrigatório." }, { status: 400 });
  }
  return withSessionTenant(async () => {
    const conta = await getContaEnergia(faturaDgId);
    return NextResponse.json({ conta });
  });
}

export async function DELETE(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const deny = await requireRoleResponse("operador");
  if (deny) return deny;

  const faturaDgId = new URL(request.url).searchParams.get("faturaDgId");
  if (!faturaDgId) {
    return NextResponse.json({ error: "faturaDgId obrigatório." }, { status: 400 });
  }
  return withSessionTenant(async () => {
    try {
      await excluirContaEnergia(faturaDgId);
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json(
        { error: "Falha ao excluir a conta." },
        { status: 500 },
      );
    }
  });
}

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

  const faturaDgId = String(form.get("faturaDgId") ?? "");
  const force = String(form.get("force") ?? "") === "true";
  const file = form.get("file");
  if (!faturaDgId) {
    return NextResponse.json({ error: "faturaDgId obrigatório." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecione o PDF da conta." }, { status: 400 });
  }
  const nome = file.name || "conta.pdf";
  const mimeType = file.type || "application/pdf";
  if (!mimeType.includes("pdf") && !nome.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "O arquivo precisa ser um PDF." }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength === 0) {
    return NextResponse.json({ error: "Arquivo vazio." }, { status: 400 });
  }
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "PDF acima de 15 MB." }, { status: 400 });
  }

  return withSessionTenant(async () => {
    try {
      const result = await salvarContaEnergia(
        faturaDgId,
        nome,
        mimeType,
        buffer,
        force,
      );
      if (result.status === "divergencia") {
        return NextResponse.json({
          ok: true,
          divergencia: result.divergencia,
          parsed: result.parsed,
        });
      }
      return NextResponse.json({ ok: true, parsed: result.parsed });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? `Falha ao processar o PDF: ${error.message}`
              : "Falha ao processar o PDF.",
        },
        { status: 500 },
      );
    }
  });
}
