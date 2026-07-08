import { AsyncLocalStorage } from "node:async_hooks";
import { TENANT0_ID } from "./schema";

// Contexto de tenant por requisição (multi-tenant, Fase 2). Estabelecido no
// limite da requisição (página/action) a partir da sessão; as funções de query
// leem o tenant atual sem precisar recebê-lo por parâmetro.
const als = new AsyncLocalStorage<{ tenantId: string }>();

/** Executa `fn` com o tenant atual fixado no contexto. */
export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  return als.run({ tenantId }, fn);
}

/**
 * Tenant do contexto atual. Fallback = tenant 0 quando não há contexto (módulos
 * ainda não convertidos, scripts/workers) — mantém a app não-quebrada durante o
 * rollout incremental do escopo por tenant.
 */
export function getCurrentTenantId(): string {
  return als.getStore()?.tenantId ?? TENANT0_ID;
}
