import { DesktopOnly } from "@/components/DesktopOnly";
import {
  opcoesClientes,
  opcoesDistribuidoras,
  opcoesUnidades,
} from "@/lib/cadastros/queries";
import { GeradorProposta } from "./GeradorProposta";

export const dynamic = "force-dynamic";

export default async function GeradorPropostaPage() {
  const [clientes, unidades, distribuidoras] = await Promise.all([
    opcoesClientes(),
    opcoesUnidades(),
    opcoesDistribuidoras(),
  ]);

  return (
    <DesktopOnly area="O gerador de propostas">
      <GeradorProposta
        clientes={clientes}
        unidades={unidades}
        distribuidoras={distribuidoras}
      />
    </DesktopOnly>
  );
}
