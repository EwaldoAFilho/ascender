import { CrudSection } from "@/components/cadastros/CrudSection";
import { deleteUnidade, saveUnidade } from "@/lib/cadastros/actions";
import {
  listUnidades,
  opcoesClientes,
  opcoesDistribuidoras,
} from "@/lib/cadastros/queries";
import { numberFormatter } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function UnidadesCadastroPage() {
  const [rows, cliOpts, distOpts] = await Promise.all([
    listUnidades(),
    opcoesClientes(),
    opcoesDistribuidoras(),
  ]);

  return (
    <CrudSection
      singular="unidade consumidora"
      onSave={saveUnidade}
      onDelete={deleteUnidade}
      fields={[
        {
          name: "clienteId",
          label: "Cliente",
          type: "select",
          options: cliOpts,
          required: true,
        },
        {
          name: "codigoInstalacao",
          label: "Código de instalação",
          type: "text",
          required: true,
        },
        {
          name: "distribuidoraId",
          label: "Distribuidora",
          type: "select",
          options: distOpts,
        },
        {
          name: "consumoMedioKwh",
          label: "Consumo médio (kWh)",
          type: "number",
        },
      ]}
      columns={["UC", "Cliente", "Distribuidora", "Consumo médio"]}
      rows={rows.map((u) => ({
        id: u.id,
        cells: [
          u.codigoInstalacao,
          u.clienteNome ?? "-",
          u.distribuidoraNome ?? "-",
          `${numberFormatter.format(u.consumoMedioKwh)} kWh`,
        ],
        values: {
          clienteId: u.clienteId ?? "",
          codigoInstalacao: u.codigoInstalacao,
          distribuidoraId: u.distribuidoraId ?? "",
          consumoMedioKwh: String(u.consumoMedioKwh),
        },
      }))}
    />
  );
}
