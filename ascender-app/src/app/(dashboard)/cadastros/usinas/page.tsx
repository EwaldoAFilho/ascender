import type { ReactNode } from "react";
import { CrudSection } from "@/components/cadastros/CrudSection";
import { ImportarUsinasSolis } from "@/components/cadastros/ImportarUsinasSolis";
import { OrigemBanner } from "@/components/cadastros/OrigemBanner";
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

  // Banner de proveniência no modal: usinas que vieram da SolisCloud/DG.
  const extras: Record<string, ReactNode> = {};
  for (const u of rows) {
    if (u.origem && u.origem !== "manual") {
      extras[u.id] = (
        <OrigemBanner
          origem={u.origem}
          sincronizadoEm={u.origemSincronizadoEm?.toISOString() ?? null}
          camposIntegracao={[
            "Nome da usina",
            "Potência (kWp)",
            "Station ID SolisCloud",
          ]}
        />
      );
    }
  }

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
      clickableFirstColumn
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
        { name: "endereco", label: "Endereço", type: "text" },
        { name: "bairro", label: "Bairro", type: "text" },
        { name: "estado", label: "Estado (UF)", type: "text" },
        { name: "cep", label: "CEP", type: "text" },
        {
          name: "latitude",
          label: "Latitude (-90 a 90)",
          type: "number",
          placeholder: "ex.: -15.793889",
        },
        {
          name: "longitude",
          label: "Longitude (-180 a 180)",
          type: "number",
          placeholder: "ex.: -47.882778",
        },
        { name: "codigoCliente", label: "Cód. cliente", type: "text" },
        {
          name: "codigoInstalacao",
          label: "Cód. instalação (UC)",
          type: "text",
        },
        { name: "potenciaKwp", label: "Potência (kWp)", type: "number" },
        {
          name: "modulos",
          label: "Módulos",
          type: "text",
          placeholder: "ex.: 164 × 600 W",
        },
        {
          name: "inversores",
          label: "Inversores",
          type: "text",
          placeholder: "ex.: Solis 30 kW + Solis 37,5 kW",
        },
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
        "Geo",
        "Status",
      ]}
      rows={rows.map((u) => {
        const temCoords = u.latitude != null && u.longitude != null;
        return {
        id: u.id,
        cells: [
          u.nome,
          u.distribuidoraNome ?? "-",
          `${u.potenciaKwp} kWp`,
          `${numberFormatter.format(u.geracaoEsperadaKwhMes)} kWh`,
          u.stationIdSoliscloud ?? "-",
          temCoords ? "📍" : "—",
          u.status,
        ],
        sortValues: [
          u.nome,
          u.distribuidoraNome ?? "-",
          u.potenciaKwp,
          u.geracaoEsperadaKwhMes,
          u.stationIdSoliscloud ?? "-",
          temCoords ? 1 : 0,
          u.status,
        ],
        values: {
          nome: u.nome,
          distribuidoraId: u.distribuidoraId ?? "",
          endereco: u.endereco ?? "",
          bairro: u.bairro ?? "",
          estado: u.estado ?? "",
          cep: u.cep ?? "",
          latitude: u.latitude != null ? String(u.latitude) : "",
          longitude: u.longitude != null ? String(u.longitude) : "",
          codigoCliente: u.codigoCliente ?? "",
          codigoInstalacao: u.codigoInstalacao ?? "",
          potenciaKwp: String(u.potenciaKwp),
          modulos: u.modulos ?? "",
          inversores: u.inversores ?? "",
          geracaoEsperadaKwhMes: String(u.geracaoEsperadaKwhMes),
          codigoDigitalGrid: u.codigoDigitalGrid ?? "",
          stationIdSoliscloud: u.stationIdSoliscloud ?? "",
          status: u.status,
        },
        };
      })}
      extras={extras}
      />
    </>
  );
}
