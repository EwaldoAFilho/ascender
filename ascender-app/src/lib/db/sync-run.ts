import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/db/tenant-context";
import { syncRuns } from "@/lib/db/schema";

export type SyncRunResumo = {
  job: string;
  status: string;
  itens: number;
  terminadoEm: string | null;
  mensagem: string | null;
};

/** Último run de cada job — para o painel de saúde da sincronização. */
export async function getSyncRunsResumo(): Promise<SyncRunResumo[]> {
  const db = getDb();
  const rows = await db
    .selectDistinctOn([syncRuns.job], {
      job: syncRuns.job,
      status: syncRuns.status,
      itens: syncRuns.itens,
      terminadoEm: syncRuns.terminadoEm,
      mensagem: syncRuns.mensagem,
    })
    .from(syncRuns)
    .where(eq(syncRuns.tenantId, getCurrentTenantId()))
    .orderBy(syncRuns.job, desc(syncRuns.iniciadoEm));
  return rows.map((r) => ({
    job: r.job,
    status: r.status,
    itens: r.itens,
    terminadoEm: r.terminadoEm ? new Date(r.terminadoEm).toISOString() : null,
    mensagem: r.mensagem,
  }));
}

/**
 * Executa um job de sincronização e registra a execução em `sync_runs` (início,
 * fim, status, itens, mensagem) — observabilidade unificada para a tela
 * Integrações e o "atualizado há X". Relança o erro após registrar.
 */
export async function registrarSyncRun<T>(
  job: string,
  fn: () => Promise<T>,
  resumo: (r: T) => { itens: number; mensagem?: string },
): Promise<T> {
  const db = getDb();
  const tenantId = getCurrentTenantId();
  const iniciadoEm = new Date();
  try {
    const r = await fn();
    const { itens, mensagem } = resumo(r);
    await db.insert(syncRuns).values({
      tenantId,
      job,
      iniciadoEm,
      terminadoEm: new Date(),
      status: "ok",
      itens,
      mensagem: mensagem ?? null,
    });
    return r;
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : String(error);
    await db
      .insert(syncRuns)
      .values({
        tenantId,
        job,
        iniciadoEm,
        terminadoEm: new Date(),
        status: "erro",
        itens: 0,
        mensagem,
      })
      .catch(() => {});
    throw error;
  }
}
