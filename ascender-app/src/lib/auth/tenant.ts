import { TENANT0_ID } from "@/lib/db/schema";
import { withTenant } from "@/lib/db";
import { getSession } from "./session";

/** Tenant da sessão atual (fallback = tenant 0 enquanto a sessão não o carrega). */
export async function getSessionTenantId(): Promise<string> {
  const session = await getSession();
  return session.tenantId || TENANT0_ID;
}

/**
 * Estabelece o contexto de tenant a partir da sessão (abre transação com
 * `app.current_tenant` para a RLS) e executa `fn`. Use no limite de páginas/
 * server actions que consultam o banco, para escopar tudo ao tenant do usuário.
 */
export async function withSessionTenant<T>(fn: () => Promise<T>): Promise<T> {
  return withTenant(await getSessionTenantId(), fn);
}
