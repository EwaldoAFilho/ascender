import "dotenv/config";
import { registrarSyncRun } from "@/lib/db/sync-run";
import { syncRateioDg } from "@/lib/digitalgrid/sync";

async function main() {
  console.log("Sincronizando rateio do Digital Grid...");
  const r = await registrarSyncRun("rateio_dg", syncRateioDg, (r) => ({
    itens: r.rateios,
    mensagem: `${r.rateios} cota(s) em ${r.paginas} página(s)`,
  }));
  console.log(`OK: ${r.rateios} cota(s) em ${r.paginas} página(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Falha ao sincronizar rateio do Digital Grid:", e);
    process.exit(1);
  });
