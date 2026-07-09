import { syncGeracaoMensal } from "@/lib/cadastros/sync";
import { registrarSyncRun } from "@/lib/db/sync-run";
import { listarTenantsComCredencial } from "@/lib/db/tenants";
import { runWithTenant } from "@/lib/db/tenant-context";
import { DG_PROVIDER } from "@/lib/digitalgrid/credentials";
import { syncFaturasDg, syncRateioDg } from "@/lib/digitalgrid/sync";
import { SOLIS_PROVIDER } from "@/lib/soliscloud/credentials";
import { syncTelemetria } from "@/lib/soliscloud/telemetria-sync";

// Registro central dos jobs de sincronização. Cada job declara:
// - `provider`: qual credencial (integration_credentials.provider) habilita um
//   tenant para esse job — usado para enumerar os tenants a processar.
// - `executar`: roda o sync no contexto de tenant atual e devolve itens/mensagem
//   (para sync_runs) + um `log` amigável.
// Este módulo é a ÚNICA fonte de verdade dos jobs: os entrypoints (npm run
// db:sync-*) e a fila (pg-boss, Fase 6d) reusam `rodarJobParaTenant` /
// `rodarJobTodosTenants`, sem duplicar a lógica de contexto/iteração.

export type SyncJobName = "telemetria" | "geracao" | "faturas_dg" | "rateio_dg";

type ResultadoJob = { itens: number; mensagem: string; log: string };

type JobDef = {
  provider: string;
  executar: () => Promise<ResultadoJob>;
};

export const SYNC_JOBS: Record<SyncJobName, JobDef> = {
  telemetria: {
    provider: SOLIS_PROVIDER,
    executar: async () => {
      const r = await syncTelemetria();
      return {
        itens: r.estacoes + r.inversores + r.coletores + r.alarmes,
        mensagem: `${r.estacoes} est · ${r.inversores} inv · ${r.coletores} col · ${r.alarmes} alm`,
        log: `${r.estacoes} estação(ões), ${r.inversores} inversor(es), ${r.coletores} coletor(es), ${r.alarmes} alarme(s)`,
      };
    },
  },
  geracao: {
    provider: SOLIS_PROVIDER,
    executar: async () => {
      const r = await syncGeracaoMensal();
      return {
        itens: r.competencias,
        mensagem: `${r.usinas} usina(s), ${r.competencias} competência(s)`,
        log: `${r.usinas} usina(s), ${r.competencias} competência(s)`,
      };
    },
  },
  faturas_dg: {
    provider: DG_PROVIDER,
    executar: async () => {
      const r = await syncFaturasDg();
      return {
        itens: r.faturas,
        mensagem: `${r.faturas} fatura(s) em ${r.paginas} página(s)`,
        log: `${r.faturas} fatura(s) em ${r.paginas} página(s)`,
      };
    },
  },
  rateio_dg: {
    provider: DG_PROVIDER,
    executar: async () => {
      const r = await syncRateioDg();
      return {
        itens: r.rateios,
        mensagem: `${r.rateios} cota(s) em ${r.paginas} página(s)`,
        log: `${r.rateios} cota(s) em ${r.paginas} página(s)`,
      };
    },
  },
};

/**
 * Roda um job para UM tenant, com o contexto fixado (`runWithTenant`), de modo
 * que `getCurrentTenantId()` — usado nas credenciais, nos WHERE de leitura e no
 * `tenant_id` das escritas — resolva para o tenant certo. Registra a execução
 * em `sync_runs` (por tenant). Usa `runWithTenant` (só ALS, sem transação) e
 * não `withTenant`, para NÃO manter uma transação aberta durante o I/O de rede
 * do sync (chamadas SolisCloud/Digital Grid podem levar segundos a minutos).
 */
export async function rodarJobParaTenant(
  job: SyncJobName,
  tenantId: string,
): Promise<ResultadoJob> {
  const def = SYNC_JOBS[job];
  const r = await runWithTenant(tenantId, () =>
    registrarSyncRun(job, def.executar, (x) => ({
      itens: x.itens,
      mensagem: x.mensagem,
    })),
  );
  console.log(`[sync:${job}] tenant ${tenantId}: ${r.log}`);
  return r;
}

/**
 * Enumera os tenants ativos com credencial do provider do job e roda o sync para
 * cada um, isolando falha por tenant — um tenant com credencial inválida/erro de
 * API não derruba os demais (cada um tem seu próprio `sync_runs`). Usado pelos
 * entrypoints `npm run db:sync-*` (execução sequencial de todos os tenants).
 */
export async function rodarJobTodosTenants(
  job: SyncJobName,
): Promise<{ tenants: number; ok: number; erros: number }> {
  const def = SYNC_JOBS[job];
  const tenantIds = await listarTenantsComCredencial(def.provider);
  let ok = 0;
  let erros = 0;
  for (const tenantId of tenantIds) {
    try {
      await rodarJobParaTenant(job, tenantId);
      ok++;
    } catch (e) {
      erros++;
      console.error(
        `[sync:${job}] tenant ${tenantId} falhou:`,
        e instanceof Error ? e.message : e,
      );
    }
  }
  console.log(
    `[sync:${job}] ${ok} ok, ${erros} erro(s) em ${tenantIds.length} tenant(s).`,
  );
  return { tenants: tenantIds.length, ok, erros };
}
