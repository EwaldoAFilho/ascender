import "dotenv/config";
import { syncRateioDg } from "@/lib/digitalgrid/sync";

async function main() {
  console.log("Sincronizando rateio do Digital Grid...");
  const r = await syncRateioDg();
  console.log(`OK: ${r.rateios} cota(s) em ${r.paginas} página(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Falha ao sincronizar rateio do Digital Grid:", e);
    process.exit(1);
  });
