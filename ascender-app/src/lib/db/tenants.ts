import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { integrationCredentials, tenants } from "@/lib/db/schema";

/**
 * Tenants ATIVOS (não suspensos) que têm credencial ativa do `provider` dado —
 * a lista que os workers de sync devem percorrer.
 *
 * IMPORTANTE: chame FORA de `withTenant`/`runWithTenant` (sem contexto de
 * tenant). É o ponto de entrada do worker: precisa enxergar TODOS os tenants
 * para então fixar o contexto de cada um. Rodando sem `app.current_tenant`
 * setado, a policy de RLS é permissiva (e o worker conecta como dono), então a
 * enumeração vê todos os tenants.
 */
export async function listarTenantsComCredencial(
  provider: string,
): Promise<string[]> {
  const rows = await getDb()
    .selectDistinct({ tenantId: integrationCredentials.tenantId })
    .from(integrationCredentials)
    .innerJoin(tenants, eq(tenants.id, integrationCredentials.tenantId))
    .where(
      and(
        eq(integrationCredentials.provider, provider),
        eq(integrationCredentials.isActive, true),
        ne(tenants.status, "suspenso"),
      ),
    );
  return rows.map((r) => r.tenantId);
}
