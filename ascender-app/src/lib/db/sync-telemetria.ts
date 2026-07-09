import "dotenv/config";
import { rodarJobTodosTenants } from "@/lib/sync/jobs";

// Coleta a telemetria da SolisCloud (estações, inversores, coletores, alarmes)
// para o banco, de TODOS os tenants com credencial Solis ativa. Usado pelo
// serviço de cron (a cada ~10 min) e manualmente.
rodarJobTodosTenants("telemetria")
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[sync-telemetria] Falhou:", error);
    process.exit(1);
  });
