import "dotenv/config";
import { rodarJobTodosTenants } from "@/lib/sync/jobs";

// Sincroniza o histórico mensal de geração da SolisCloud para o banco, de TODOS
// os tenants com credencial Solis ativa. Cron (docker-compose) e manual.
rodarJobTodosTenants("geracao")
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[sync-geracao] Falhou:", error);
    process.exit(1);
  });
