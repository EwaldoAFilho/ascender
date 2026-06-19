import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import * as schema from "./schema";

// Singleton do pool/db (preguiçoso) — evita múltiplas conexões em hot-reload
// no dev e adia a leitura de DATABASE_URL até o runtime (não quebra o build).
const globalForDb = globalThis as unknown as {
  __ascenderDb?: NodePgDatabase<typeof schema>;
  __ascenderPool?: Pool;
};

export function getDb(): NodePgDatabase<typeof schema> {
  if (!globalForDb.__ascenderDb) {
    const pool =
      globalForDb.__ascenderPool ??
      new Pool({ connectionString: env.databaseUrl() });
    globalForDb.__ascenderPool = pool;
    globalForDb.__ascenderDb = drizzle(pool, { schema });
  }
  return globalForDb.__ascenderDb;
}
