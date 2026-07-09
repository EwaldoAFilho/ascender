import "dotenv/config";
import { rodarJobTodosTenants } from "@/lib/sync/jobs";

// Sincroniza as faturas do Digital Grid de TODOS os tenants com credencial DG
// ativa. Usado pelo serviço de cron (sync-dg) e manualmente.
rodarJobTodosTenants("faturas_dg")
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[sync-faturas-dg] Falhou:", e);
    process.exit(1);
  });
