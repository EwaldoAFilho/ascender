import { CrudSection } from "@/components/cadastros/CrudSection";
import { ImportarUsinasSolis } from "@/components/cadastros/ImportarUsinasSolis";
import { deleteUsina, saveUsina } from "@/lib/cadastros/actions";
import {
  listUsinas,
  opcoesDistribuidoras,
  opcoesEstacoesSolis,
} from "@/lib/cadastros/queries";
import { numberFormatter } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function UsinasCadastroPage() {
  const [rows, distOpts, solisOpts] = await Promise.all([
    listUsinas(),
    opcoesDistribuidoras(),
    opcoesEstacoesSolis(),
  ]);

  return (
    <>
      <ImportarUsinasSolis />
      <CrudSection
      singular="usina"
      onSave={saveUsina}
      onDelete={deleteUsina}
      fields={[
        { name: "nome", label: "Nome da usina", type: "text", required: true },
        {
          name: "distribuidoraId",
          label: "Distribuidora",
          type: "select",
          options: distOpts,
        },
        { name: "potenciaKwp", label: "Potência (kWp)", type: "number" },
        {
          name: "geracaoEsperadaKwhMes",
          label: "Geração esperada (kWh/mês)",
          type: "number",
        },
        {
          name: "codigoDigitalGrid",
          label: "Código Digital Grid",
          type: "text",
        },
        {
          name: "stationIdSoliscloud",
          label: "Station ID SolisCloud",
          type: "datalist",
          options: solisOpts,
          placeholder: solisOpts.length
            ? "Selecione da lista real ou digite"
            : "Configure a SolisCloud p/ listar — ou digite o ID",
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "ativa", label: "ativa" },
            { value: "atencao", label: "atencao" },
            { value: "inativa", label: "inativa" },
          ],
        },
      ]}
      columns={[
        "Usina",
        "Distribuidora",
        "Potência",
        "Esperado/mês",
        "SolisCloud",
        "Status",
      ]}
      rows={rows.map((u) => ({
        id: u.id,
        cells: [
          u.nome,
          u.distribuidoraNome ?? "-",
          `${u.potenciaKwp} kWp`,
          `${numberFormatter.format(u.geracaoEsperadaKwhMes)} kWh`,
          u.stationIdSoliscloud ?? "-",
          u.status,
        ],
        sortValues: [
          u.nome,
          u.distribuidoraNome ?? "-",
          u.potenciaKwp,
          u.geracaoEsperadaKwhMes,
          u.stationIdSoliscloud ?? "-",
          u.status,
        ],
        values: {
          nome: u.nome,
          distribuidoraId: u.distribuidoraId ?? "",
          potenciaKwp: String(u.potenciaKwp),
          geracaoEsperadaKwhMes: String(u.geracaoEsperadaKwhMes),
          codigoDigitalGrid: u.codigoDigitalGrid ?? "",
          stationIdSoliscloud: u.stationIdSoliscloud ?? "",
          status: u.status,
        },
      }))}
      />
    </>
  );
}
