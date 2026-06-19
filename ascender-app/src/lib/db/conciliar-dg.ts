import "dotenv/config";
import { importarCadastrosDg } from "@/lib/digitalgrid/cadastros";

async function main() {
  console.log("Conciliando cadastros com o Digital Grid...");
  const r = await importarCadastrosDg();
  console.log(
    `OK: ${r.clientesCriados} cliente(s) novo(s), ${r.usinasVinculadas} usina(s) vinculada(s), ${r.usinasSemVinculo} usina(s) sem vínculo automático, ${r.ucsCriadas} UC(s) nova(s).`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Falha na conciliação:", e);
    process.exit(1);
  });
