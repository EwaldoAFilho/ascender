import "dotenv/config";
import { registrarSyncRun } from "@/lib/db/sync-run";
import { syncTelemetria } from "@/lib/soliscloud/telemetria-sync";

// Coleta a telemetria da SolisCloud (estações, inversores, coletores, alarmes)
// para o banco. Usado pelo serviço de cron (a cada ~10 min) e manualmente.
async function main() {
  const r = await registrarSyncRun("telemetria", syncTelemetria, (r) => ({
    itens: r.estacoes + r.inversores + r.coletores + r.alarmes,
    mensagem: `${r.estacoes} est · ${r.inversores} inv · ${r.coletores} col · ${r.alarmes} alm`,
  }));
  console.log(
    `[sync-telemetria] ${r.estacoes} estação(ões), ${r.inversores} inversor(es), ${r.coletores} coletor(es), ${r.alarmes} alarme(s).`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[sync-telemetria] Falhou:", error);
    process.exit(1);
  });
