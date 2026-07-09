import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { withSessionTenant } from "@/lib/auth/tenant";
import { getDocumentoPorInstalacao } from "@/lib/digitalgrid/queries";
import { conciliarBoleto, type ConciliacaoBoleto } from "@/lib/financeiro/conta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB por arquivo
const MAX_ARQUIVOS = 60;

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  const arquivos = form
    .getAll("files")
    .filter((f): f is File => f instanceof File);
  if (arquivos.length === 0) {
    return NextResponse.json({ error: "Selecione os PDFs." }, { status: 400 });
  }
  if (arquivos.length > MAX_ARQUIVOS) {
    return NextResponse.json(
      { error: `Máximo de ${MAX_ARQUIVOS} arquivos por lote.` },
      { status: 400 },
    );
  }

  return withSessionTenant(async () => {
    // Carrega o mapa UC→documento uma vez por lote (evita 1 query por arquivo).
    const docMap = await getDocumentoPorInstalacao();

    const resultados: ConciliacaoBoleto[] = [];
    for (const file of arquivos) {
      const nome = file.name || "conta.pdf";
      const mimeType = file.type || "application/pdf";
      if (!mimeType.includes("pdf") && !nome.toLowerCase().endsWith(".pdf")) {
        resultados.push({
          arquivo: nome,
          status: "erro",
          uc: null,
          competencia: null,
          cliente: null,
          detalhe: "Não é um PDF.",
        });
        continue;
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) {
        resultados.push({
          arquivo: nome,
          status: "erro",
          uc: null,
          competencia: null,
          cliente: null,
          detalhe: buffer.byteLength === 0 ? "Arquivo vazio." : "Acima de 15 MB.",
        });
        continue;
      }
      try {
        resultados.push(await conciliarBoleto(nome, mimeType, buffer, docMap));
      } catch {
        resultados.push({
          arquivo: nome,
          status: "erro",
          uc: null,
          competencia: null,
          cliente: null,
          detalhe: "Falha ao processar.",
        });
      }
    }

    return NextResponse.json({ ok: true, resultados });
  });
}
