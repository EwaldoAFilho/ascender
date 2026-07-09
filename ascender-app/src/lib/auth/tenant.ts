import { withTenant } from "@/lib/db";
import { getSession } from "./session";

/** Erro quando uma sessão autenticada tenta operar sem uma empresa ativa. */
export class SemEmpresaAtivaError extends Error {
  constructor() {
    super(
      "Nenhuma empresa ativa na sessão. Um operador da plataforma precisa 'Acessar' uma empresa antes de usar o app.",
    );
    this.name = "SemEmpresaAtivaError";
  }
}

/**
 * Tenant (empresa) da sessão atual. FAIL-CLOSED: se a sessão está autenticada mas
 * sem empresa (operador da plataforma que ainda não "Acessou" uma empresa), NEGA em
 * vez de cair no tenant 0 (Ascender real) — o operador só toca dados de uma empresa
 * via impersonação auditada (`acessarEmpresaAction`). O fallback para o tenant 0
 * fica só no contexto SEM sessão (workers/scripts), via `getCurrentTenantId`.
 */
export async function getSessionTenantId(): Promise<string> {
  const session = await getSession();
  if (session.tenantId) return session.tenantId;
  throw new SemEmpresaAtivaError();
}

/**
 * Estabelece o contexto de tenant a partir da sessão (abre transação com
 * `app.current_tenant` para a RLS) e executa `fn`. Use no limite de páginas/
 * server actions que consultam o banco, para escopar tudo ao tenant do usuário.
 */
export async function withSessionTenant<T>(fn: () => Promise<T>): Promise<T> {
  return withTenant(await getSessionTenantId(), fn);
}
