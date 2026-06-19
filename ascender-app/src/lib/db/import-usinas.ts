import "dotenv/config";
import { importStationsFromSolis } from "@/lib/cadastros/sync";

// Importa/atualiza as usinas a partir das estações reais da SolisCloud.
// Requer credenciais salvas no banco (Configurações > Integrações).
async function main() {
  const result = await importStationsFromSolis();
  console.log(
    `[import-usinas] ${result.criadas} criada(s), ${result.atualizadas} atualizada(s) de ${result.total} estações.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[import-usinas] Falhou:", error);
    process.exit(1);
  });
