import "dotenv/config";
import PgBoss from "pg-boss";
import { listarTenantsComCredencial } from "@/lib/db/tenants";
import { env } from "@/lib/env";
import { rodarJobParaTenant, SYNC_JOBS, type SyncJobName } from "@/lib/sync/jobs";

// Worker único de sincronização, sobre pg-boss (fila + cron + lock, no próprio
// Postgres — sem infra nova). Substitui os 3 loops shell do docker-compose.
//
// Fluxo: cada tipo de job tem uma fila de "fanout" agendada por cron; o handler
// do fanout enumera os tenants ativos com credencial do provider e enfileira 1
// job de execução por tenant na fila `sync-run`, com singletonKey = job:tenant.
// O singletonKey é o LOCK: se o sync anterior daquele (tenant, job) ainda está
// na fila/rodando, o novo tick não duplica.

// Cadências — mesmos intervalos dos loops shell anteriores (telemetria 10 min,
// DG 15 min, geração 6h). rateio desencontrado das faturas para não competirem.
const AGENDAMENTOS: { job: SyncJobName; cron: string }[] = [
  { job: "telemetria", cron: "*/10 * * * *" },
  { job: "faturas_dg", cron: "*/15 * * * *" },
  { job: "rateio_dg", cron: "5-59/15 * * * *" },
  { job: "geracao", cron: "30 */6 * * *" },
];

// Fila de execução de 1 job para 1 tenant.
const FILA_EXEC = "sync-run";

async function main() {
  const boss = new PgBoss({ connectionString: env.databaseUrl(), schema: "pgboss" });
  boss.on("error", (e) => console.error("[worker] pg-boss erro:", e));
  await boss.start();

  // Execução por tenant. Política 'stately' + singletonKey = job:tenant = lock:
  // no máximo 1 job por (tenant, job) em cada estado até 'active' — ou seja, no
  // máximo um rodando e um na fila. Impede sobreposição (dois syncs do mesmo
  // tenant ao mesmo tempo) e acúmulo de backlog quando um ciclo demora mais que
  // o intervalo do cron. (Em v10 o dedup vem da política da fila, não só da key.)
  await boss.createQueue(FILA_EXEC, { name: FILA_EXEC, policy: "stately" });
  await boss.work<{ job: SyncJobName; tenantId: string }>(FILA_EXEC, async (jobs) => {
    for (const j of jobs) {
      await rodarJobParaTenant(j.data.job, j.data.tenantId);
    }
  });

  // Uma fila de fanout por tipo de job, agendada por cron.
  for (const { job, cron } of AGENDAMENTOS) {
    const filaFanout = `fanout-${job}`;
    await boss.createQueue(filaFanout);
    await boss.work(filaFanout, async () => {
      const def = SYNC_JOBS[job];
      const tenantIds = await listarTenantsComCredencial(def.provider);
      for (const tenantId of tenantIds) {
        await boss.send(
          FILA_EXEC,
          { job, tenantId },
          { singletonKey: `${job}:${tenantId}`, retryLimit: 0 },
        );
      }
      console.log(`[fanout:${job}] ${tenantIds.length} tenant(s) enfileirado(s).`);
    });
    await boss.schedule(filaFanout, cron);
  }

  console.log(
    `[worker] pg-boss iniciado. Agendamentos: ${AGENDAMENTOS.map(
      (a) => `${a.job}(${a.cron})`,
    ).join(", ")}.`,
  );

  // Encerramento gracioso (docker envia SIGTERM ao recriar o container): para de
  // puxar jobs, deixa os em andamento terminarem e fecha as conexões.
  const parar = async (sig: string) => {
    console.log(`[worker] ${sig} recebido; parando pg-boss...`);
    try {
      await boss.stop({ graceful: true, wait: true });
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGTERM", () => void parar("SIGTERM"));
  process.on("SIGINT", () => void parar("SIGINT"));
}

main().catch((e) => {
  console.error("[worker] falha fatal ao iniciar:", e);
  process.exit(1);
});
