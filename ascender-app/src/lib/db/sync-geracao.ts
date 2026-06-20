import "dotenv/config";
import { syncGeracaoMensal } from "@/lib/cadastros/sync";
import { registrarSyncRun } from "@/lib/db/sync-run";

// Sincroniza o histórico mensal de geração da SolisCloud para o banco.
// Usado pelo serviço de cron (docker-compose) e disponível manualmente.
async function main() {
  const r = await registrarSyncRun("geracao", syncGeracaoMensal, (r) => ({
    itens: r.competencias,
    mensagem: `${r.usinas} usina(s), ${r.competencias} competência(s)`,
  }));
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
