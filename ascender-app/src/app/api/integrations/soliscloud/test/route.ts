import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { requireRoleResponse } from "@/lib/auth/rbac";
import { withSessionTenant } from "@/lib/auth/tenant";
import { callSolis, SolisApiError, type SolisCredentials } from "@/lib/soliscloud/client";
import {
  getSolisCredentials,
  recordSolisTestResult,
} from "@/lib/soliscloud/credentials";
import {
  SOLIS_DEFAULT_BASE_URL,
  SOLIS_ENDPOINTS,
} from "@/lib/soliscloud/endpoints";
import { extractRecords } from "@/lib/soliscloud/mappers";
import type { SolisPaged, SolisStationRecord } from "@/lib/soliscloud/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    keyId: z.string().optional(),
    keySecret: z.string().optional(),
    baseUrl: z.string().optional(),
  })
  .nullable();

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const deny = await requireRoleResponse("admin");
  if (deny) return deny;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  const provided = parsed.success ? parsed.data : null;

  // Testa credenciais recém-digitadas (keyId + keySecret) ou as já salvas.
  const testingTyped = Boolean(provided?.keyId && provided?.keySecret);

  // As operações de BANCO (ler a credencial salva; gravar o resultado do teste)
  // são escopadas ao tenant em withSessionTenant. A chamada externa à SolisCloud
  // roda FORA da transação — não segurar conexão do pool durante o I/O de rede.
  let creds: SolisCredentials | null;
  if (testingTyped) {
    creds = {
      keyId: provided!.keyId!,
      keySecret: provided!.keySecret!,
      baseUrl: provided!.baseUrl?.trim() || SOLIS_DEFAULT_BASE_URL,
    };
  } else {
    creds = await withSessionTenant(() => getSolisCredentials());
    if (!creds) {
      return NextResponse.json(
        { ok: false, error: "Nenhuma credencial salva para testar." },
        { status: 400 },
      );
    }
  }

  try {
    const data = await callSolis<SolisPaged<SolisStationRecord>>(
      creds,
      SOLIS_ENDPOINTS.userStationList,
      { pageNo: 1, pageSize: 100 },
      { cache: false },
    );
    const stationCount = extractRecords(data).length;
    if (!testingTyped) await withSessionTenant(() => recordSolisTestResult(true));
    return NextResponse.json({ ok: true, stationCount });
  } catch (error) {
    if (!testingTyped) await withSessionTenant(() => recordSolisTestResult(false));
    const message =
      error instanceof SolisApiError
        ? error.message
        : "Falha ao testar a conexão com a SolisCloud.";
    const code = error instanceof SolisApiError ? error.code : undefined;
    return NextResponse.json({ ok: false, error: message, code });
  }
}
