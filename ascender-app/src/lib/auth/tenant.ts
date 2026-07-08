import { TENANT0_ID } from "@/lib/db/schema";
import { runWithTenant } from "@/lib/db/tenant-context";
import { getSession } from "./session";

/** Tenant da sessão atual (fallback = tenant 0 enquanto a sessão não o carrega). */
export async function getSessionTenantId(): Promise<string> {
  const session = await getSession();
  return session.tenantId ?? TENANT0_ID;
}

/**
 * Estabelece o contexto de tenant a partir da sessão e executa `fn`. Use no
 * limite de páginas/server actions que consultam o banco, para que as queries
 * fiquem escopadas ao tenant do usuário logado.
 */
export async function withSessionTenant<T>(fn: () => Promise<T>): Promise<T> {
  const tenantId = await getSessionTenantId();
  return runWithTenant(tenantId, fn);
}
