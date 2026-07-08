import { DesktopOnly } from "@/components/DesktopOnly";
import {
  opcoesClientes,
  opcoesDistribuidoras,
  opcoesUnidades,
} from "@/lib/cadastros/queries";
import { withSessionTenant } from "@/lib/auth/tenant";
import { GeradorProposta } from "./GeradorProposta";

export const dynamic = "force-dynamic";

export default async function GeradorPropostaPage() {
  const [clientes, unidades, distribuidoras] = await withSessionTenant(() =>
    Promise.all([
      opcoesClientes(),
      opcoesUnidades(),
      opcoesDistribuidoras(),
    ]),
  );

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
