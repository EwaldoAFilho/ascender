import { AsyncLocalStorage } from "node:async_hooks";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { TENANT0_ID } from "./schema";
import type * as schema from "./schema";

// Contexto de tenant por requisicao (multi-tenant). Alem do tenantId (usado no
// escopo por WHERE das queries), pode carregar a TRANSACAO ativa (`tx`) — aberta
// por withTenant() com `app.current_tenant` setado para a RLS. getDb() usa essa
// tx quando presente, para que a RLS do Postgres aplique.
type Store = { tenantId: string; tx?: NodePgDatabase<typeof schema> };

export const tenantAls = new AsyncLocalStorage<Store>();

/**
 * Tenant do contexto atual. Fallback = tenant 0 quando nao ha contexto (scripts/
 * workers) — mantem a app funcionando durante o rollout.
 */
export function getCurrentTenantId(): string {
  return tenantAls.getStore()?.tenantId ?? TENANT0_ID;
}

/** Transacao com o tenant fixado (para a RLS), se dentro de withTenant. */
export function getTenantTx(): NodePgDatabase<typeof schema> | undefined {
  return tenantAls.getStore()?.tx;
}

/** Fixa apenas o tenantId no contexto (sem transacao/RLS). */
export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  return tenantAls.run({ tenantId }, fn);
}
