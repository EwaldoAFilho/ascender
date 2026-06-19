import { CrudSection } from "@/components/cadastros/CrudSection";
import { deleteContrato, saveContrato } from "@/lib/cadastros/actions";
import {
  listContratos,
  opcoesClientes,
  opcoesUnidades,
  opcoesUsinas,
} from "@/lib/cadastros/queries";

export const dynamic = "force-dynamic";

function tarifa(value: number): string {
  return `R$ ${value.toFixed(3).replace(".", ",")}`;
}

export default async function ContratosCadastroPage() {
  const [rows, cliOpts, ucOpts, usinaOpts] = await Promise.all([
    listContratos(),
    opcoesClientes(),
    opcoesUnidades(),
    opcoesUsinas(),
  ]);

  return (
    <CrudSection
      singular="contrato"
      onSave={saveContrato}
      onDelete={deleteContrato}
      fields={[
        {
          name: "clienteId",
          label: "Cliente",
          type: "select",
          options: cliOpts,
          required: true,
        },
        {
          name: "unidadeConsumidoraId",
          label: "Unidade consumidora",
          type: "select",
          options: ucOpts,
        },
        {
          name: "usinaId",
          label: "Usina",
          type: "select",
          options: usinaOpts,
        },
        {
          name: "tarifaDistribuidora",
          label: "Tarifa distribuidora (R$/kWh)",
          type: "number",
          step: "0.001",
        },
        {
          name: "tarifaAscender",
          label: "Tarifa ASCENDER (R$/kWh)",
          type: "number",
          step: "0.001",
        },
        {
          name: "percentualDesconto",
          label: "Desconto (%)",
          type: "number",
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "simulacao", label: "simulacao" },
            { value: "em-analise", label: "em-analise" },
            { value: "ativo", label: "ativo" },
          ],
        },
      ]}
      columns={[
        "Cliente",
        "UC",
        "Usina",
        "Tarifa distrib.",
        "Tarifa ASCENDER",
        "Desconto",
        "Status",
      ]}
      rows={rows.map((c) => ({
        id: c.id,
        cells: [
          c.clienteNome ?? "-",
          c.unidadeCodigo ?? "-",
          c.usinaNome ?? "-",
          tarifa(c.tarifaDistribuidora),
          tarifa(c.tarifaAscender),
          `${c.percentualDesconto}%`,
          c.status,
        ],
        values: {
          clienteId: c.clienteId ?? "",
          unidadeConsumidoraId: c.unidadeConsumidoraId ?? "",
          usinaId: c.usinaId ?? "",
          tarifaDistribuidora: String(c.tarifaDistribuidora),
          tarifaAscender: String(c.tarifaAscender),
          percentualDesconto: String(c.percentualDesconto),
          status: c.status,
        },
      }))}
    />
  );
}
