import "dotenv/config";
import { getDb } from "@/lib/db";
import { syncRuns } from "@/lib/db/schema";
import { syncTelemetria } from "@/lib/soliscloud/telemetria-sync";

// Coleta a telemetria da SolisCloud (estações, inversores, coletores, alarmes)
// para o banco. Usado pelo serviço de cron (a cada ~10 min) e manualmente.
async function main() {
  const db = getDb();
  const iniciadoEm = new Date();
  try {
    const r = await syncTelemetria();
    const itens = r.estacoes + r.inversores + r.coletores + r.alarmes;
    await db.insert(syncRuns).values({
      job: "telemetria",
      iniciadoEm,
      terminadoEm: new Date(),
      status: "ok",
      itens,
      mensagem: `${r.estacoes} est · ${r.inversores} inv · ${r.coletores} col · ${r.alarmes} alm`,
    });
    console.log(
      `[sync-telemetria] ${r.estacoes} estação(ões), ${r.inversores} inversor(es), ${r.coletores} coletor(es), ${r.alarmes} alarme(s).`,
    );
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : String(error);
    await db
      .insert(syncRuns)
      .values({
        job: "telemetria",
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

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[sync-telemetria] Falhou:", error);
    process.exit(1);
  });
