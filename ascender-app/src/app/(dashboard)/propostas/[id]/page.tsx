import { notFound, redirect } from "next/navigation";
import { DesktopOnly } from "@/components/DesktopOnly";
import {
  getPropostaGerador,
  opcoesClientes,
  opcoesDistribuidoras,
  opcoesUnidades,
} from "@/lib/cadastros/queries";
import { withSessionTenant } from "@/lib/auth/tenant";
import { getSessionRole, roleAtLeast } from "@/lib/auth/rbac";
import type { DadosGeradorSnapshot } from "@/lib/propostas/types";
import { GeradorProposta, type GeradorInicial } from "../gerador/GeradorProposta";

export const dynamic = "force-dynamic";

// Converte um número (ou 0/null) num valor pronto para input: 0/null → "".
function numStr(v: number | null | undefined): string {
  return v ? String(v) : "";
}

export default async function PropostaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // A tela expõe custo/margem (resultado + toggle interno) → operador+.
  if (!roleAtLeast(await getSessionRole(), "operador")) {
    redirect("/propostas");
  }

  const [proposta, clientes, unidades, distribuidoras] = await withSessionTenant(
    () =>
      Promise.all([
        getPropostaGerador(id),
        opcoesClientes(),
        opcoesUnidades(),
        opcoesDistribuidoras(),
      ]),
  );

  if (!proposta) notFound();

  const snap = proposta.dadosGerador as DadosGeradorSnapshot | null;
  const input = snap?.input;

  const inicial: GeradorInicial = {
    clienteNome: proposta.clienteNome ?? "",
    responsavel: snap?.responsavel ?? "",
    cidade: snap?.cidade ?? "",
    unidadeConsumidoraId: proposta.unidadeConsumidoraId ?? "",
    distribuidoraId: proposta.distribuidoraId ?? "",
    instalacao: input?.instalacao ?? "telhado",
    moduloWp: input ? String(input.moduloWp) : "620",
    inversorForcado: input?.inversorForcado ?? "auto",
    consumoKwh: input ? String(input.consumoKwh) : numStr(proposta.consumoEstimadoKwh),
    compensacaoPct: input ? String(input.compensacaoPct) : "1",
    hsp: input ? String(input.hsp) : "5.5",
    tarifa: input ? String(input.tarifa) : numStr(proposta.tarifaDistribuidora),
    padrao: snap?.padrao ?? "mono",
    adequacaoTrifasica: input?.adequacaoTrifasica ?? false,
    adequacaoValor: input ? String(input.adequacaoValor) : "3500",
    observacao: proposta.observacao ?? "",
    telhados: input?.telhados?.map((t) => ({
      largura: String(t.largura),
      comprimento: String(t.comprimento),
      aproveitamento: String(t.aproveitamento),
    })),
    status: proposta.status,
    tarifaAscender: numStr(proposta.tarifaAscender),
  };

  return (
    <DesktopOnly area="A edição de proposta">
      <GeradorProposta
        clientes={clientes}
        unidades={unidades}
        distribuidoras={distribuidoras}
        propostaId={proposta.id}
        inicial={inicial}
        resultadoInicial={snap?.resultado ?? null}
      />
    </DesktopOnly>
  );
}
