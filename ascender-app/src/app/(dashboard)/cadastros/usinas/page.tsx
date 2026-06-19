import { CrudSection } from "@/components/cadastros/CrudSection";
import { ImportarUsinasSolis } from "@/components/cadastros/ImportarUsinasSolis";
import { SummaryStrip, type SummaryItem } from "@/components/SummaryStrip";
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

  const totalKwp = rows.reduce((s, u) => s + u.potenciaKwp, 0);
  const naSolis = rows.filter((u) => u.stationIdSoliscloud).length;
  const noDg = rows.filter((u) => u.codigoDigitalGrid).length;
  const tomSolis: SummaryItem["tone"] =
    rows.length === 0 ? "default" : naSolis === rows.length ? "ok" : "warn";

  const resumo: SummaryItem[] = [
    { label: "Usinas", value: numberFormatter.format(rows.length), hint: "cadastradas" },
    {
      label: "Potência do parque",
      value: `${numberFormatter.format(totalKwp)} kWp`,
      hint: "soma das potências",
    },
    {
      label: "Na SolisCloud",
      value: `${naSolis}/${rows.length}`,
      hint: "vinculadas por Station ID",
      tone: tomSolis,
    },
    {
      label: "No Digital Grid",
      value: `${noDg}/${rows.length}`,
      hint: "com código DG",
    },
  ];

  return (
    <>
      <SummaryStrip items={resumo} />
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
