import { getDb } from "@/lib/db";
import { syncRuns } from "@/lib/db/schema";

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
  const iniciadoEm = new Date();
  try {
    const r = await fn();
    const { itens, mensagem } = resumo(r);
    await db.insert(syncRuns).values({
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
