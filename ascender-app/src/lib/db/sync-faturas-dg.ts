import "dotenv/config";
import { registrarSyncRun } from "@/lib/db/sync-run";
import { syncFaturasDg } from "@/lib/digitalgrid/sync";

async function main() {
  console.log("Sincronizando faturas do Digital Grid...");
  const r = await registrarSyncRun("faturas_dg", syncFaturasDg, (r) => ({
    itens: r.faturas,
    mensagem: `${r.faturas} fatura(s) em ${r.paginas} página(s)`,
  }));
  console.log(`OK: ${r.faturas} fatura(s) em ${r.paginas} página(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Falha ao sincronizar faturas do Digital Grid:", e);
    process.exit(1);
  });
