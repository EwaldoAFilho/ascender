import "dotenv/config";
import { syncGeracaoMensal } from "@/lib/cadastros/sync";

// Sincroniza o histórico mensal de geração da SolisCloud para o banco.
// Usado pelo serviço de cron (docker-compose) e disponível manualmente.
async function main() {
  const r = await syncGeracaoMensal();
  console.log(
    `[sync-geracao] ${r.usinas} usina(s), ${r.competencias} competência(s) sincronizada(s).`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[sync-geracao] Falhou:", error);
    process.exit(1);
  });
