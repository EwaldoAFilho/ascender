import { NextResponse } from "next/server";
import { getSession, type SessionData } from "./session";

/**
 * Garante que a requisição tem sessão válida. Retorna a sessão ou uma
 * `NextResponse` 401 — para usar em route handlers como defesa em profundidade
 * (além da checagem leve do middleware).
 */
export async function requireSession(): Promise<
  | { ok: true; session: SessionData }
  | { ok: false; response: NextResponse }
> {
  const session = await getSession();
  if (!session.authenticated) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 },
      ),
    };
  }
  return { ok: true, session };
}
