import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { withSessionTenant } from "@/lib/auth/tenant";
import { SolisApiError, type SolisCredentials } from "./client";
import { getSolisCredentials } from "./credentials";

/**
 * Wrapper para route handlers de leitura da SolisCloud:
 * 1) exige sessão; 2) fixa o tenant da sessão (para resolver a credencial da
 * conta certa); 3) carrega credenciais (409 se não configurado); 4) executa
 * `fn` e converte erros da API em respostas adequadas.
 */
export async function withSolis<T>(
  fn: (creds: SolisCredentials) => Promise<T>,
): Promise<NextResponse> {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  return withSessionTenant(async () => {
    const creds = await getSolisCredentials();
    if (!creds) {
      return NextResponse.json(
        {
          error:
            "Integração SolisCloud não configurada. Cadastre as credenciais em Configurações > Integrações.",
          code: "NOT_CONFIGURED",
        },
        { status: 409 },
      );
    }

    try {
      const data = await fn(creds);
      return NextResponse.json(data);
    } catch (error) {
      if (error instanceof SolisApiError) {
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: 502 },
        );
      }
      return NextResponse.json(
        { error: "Erro inesperado ao consultar a SolisCloud." },
        { status: 500 },
      );
    }
  });
}
