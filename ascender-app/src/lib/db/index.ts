import { sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import * as schema from "./schema";
import { getTenantTx, tenantAls } from "./tenant-context";

// Singleton do pool/db (preguiçoso) — evita múltiplas conexões em hot-reload
// no dev e adia a leitura de DATABASE_URL até o runtime (não quebra o build).
const globalForDb = globalThis as unknown as {
  __ascenderDb?: NodePgDatabase<typeof schema>;
  __ascenderPool?: Pool;
};

function poolDb(): NodePgDatabase<typeof schema> {
  if (!globalForDb.__ascenderDb) {
    const pool =
      globalForDb.__ascenderPool ??
      new Pool({ connectionString: env.databaseUrl() });
    globalForDb.__ascenderPool = pool;
    globalForDb.__ascenderDb = drizzle(pool, { schema });
  }
  return globalForDb.__ascenderDb;
}

/**
 * Handle do banco. Dentro de withTenant() retorna a TRANSAÇÃO com
 * `app.current_tenant` setado (a RLS filtra por tenant); fora, o pool.
 * Transparente para os call sites — todos continuam chamando getDb().
 */
export function getDb(): NodePgDatabase<typeof schema> {
  return getTenantTx() ?? poolDb();
}

/**
 * Abre uma transação, fixa o tenant (GUC `app.current_tenant`, transaction-local,
 * para a RLS) e executa `fn` com getDb() apontando para essa transação. Use no
 * limite de páginas/handlers para escopar o acesso ao banco a um tenant.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: () => Promise<T>,
): Promise<T> {
  return poolDb().transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_tenant', ${tenantId}, true)`);
    return tenantAls.run(
      { tenantId, tx: tx as unknown as NodePgDatabase<typeof schema> },
      fn,
    );
  });
}
