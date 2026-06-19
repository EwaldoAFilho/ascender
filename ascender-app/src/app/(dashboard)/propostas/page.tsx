import { CrudSection } from "@/components/cadastros/CrudSection";
import { SummaryStrip, type SummaryItem } from "@/components/SummaryStrip";
import { deleteProposta, saveProposta } from "@/lib/cadastros/actions";
import {
  listPropostas,
  opcoesClientes,
  opcoesDistribuidoras,
  opcoesUnidades,
} from "@/lib/cadastros/queries";
import { moneyFormatter, numberFormatter } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

function tarifa(value: number): string {
  return `R$ ${value.toFixed(3).replace(".", ",")}`;
}

function statusClasse(s: string): string {
  if (s === "aprovada") return "status-online";
  if (s === "recusada") return "status-offline";
  if (s === "em-analise") return "status-aguardando";
  return "";
}

export default async function PropostasPage() {
  const [props, cliOpts, ucOpts, distOpts] = await Promise.all([
    listPropostas(),
    opcoesClientes(),
    opcoesUnidades(),
    opcoesDistribuidoras(),
  ]);

  const economiaMes = (p: (typeof props)[number]) =>
    p.consumoEstimadoKwh * (p.tarifaDistribuidora - p.tarifaAscender);
  const economiaAnualTotal = props.reduce(
    (s, p) => s + economiaMes(p) * 12,
    0,
  );
  const ticket = props.length ? economiaAnualTotal / props.length : 0;
  const aprovadas = props.filter((p) => p.status === "aprovada").length;

  const kpis: SummaryItem[] = [
    {
      label: "Propostas",
      value: numberFormatter.format(props.length),
      hint: "cadastradas",
    },
    {
      label: "Aprovadas",
      value: numberFormatter.format(aprovadas),
      hint: `de ${props.length} proposta(s)`,
      tone: aprovadas > 0 ? "ok" : "default",
    },
    {
      label: "Economia anual potencial",
      value: moneyFormatter.format(economiaAnualTotal),
      hint: "soma das propostas",
      tone: "ok",
    },
    {
      label: "Ticket médio (ano)",
      value: moneyFormatter.format(ticket),
      hint: "economia por proposta",
    },
  ];

  return (
    <>
      <SummaryStrip items={kpis} />

      <CrudSection
        singular="proposta"
        onSave={saveProposta}
        onDelete={deleteProposta}
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
            name: "distribuidoraId",
            label: "Distribuidora",
            type: "select",
            options: distOpts,
          },
          {
            name: "consumoEstimadoKwh",
            label: "Consumo estimado (kWh/mês)",
            type: "number",
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
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "simulacao", label: "simulacao" },
              { value: "em-analise", label: "em-analise" },
              { value: "aprovada", label: "aprovada" },
              { value: "recusada", label: "recusada" },
            ],
          },
          { name: "observacao", label: "Observação", type: "text" },
        ]}
        columns={[
          "Cliente",
          "UC",
          "Consumo",
          "Tarifa distrib.",
          "Tarifa ASCENDER",
          "Economia/mês",
          "Status",
        ]}
        rows={props.map((p) => ({
          id: p.id,
          cells: [
            p.clienteNome ?? "-",
            p.unidadeCodigo ?? "-",
            `${numberFormatter.format(p.consumoEstimadoKwh)} kWh`,
            tarifa(p.tarifaDistribuidora),
            tarifa(p.tarifaAscender),
            moneyFormatter.format(economiaMes(p)),
            <span key="s" className={`status ${statusClasse(p.status)}`}>
              {p.status}
            </span>,
          ],
          sortValues: [
            p.clienteNome ?? "-",
            p.unidadeCodigo ?? "-",
            p.consumoEstimadoKwh,
            p.tarifaDistribuidora,
            p.tarifaAscender,
            economiaMes(p),
            p.status,
          ],
          values: {
            clienteId: p.clienteId ?? "",
            unidadeConsumidoraId: p.unidadeConsumidoraId ?? "",
            distribuidoraId: p.distribuidoraId ?? "",
            consumoEstimadoKwh: String(p.consumoEstimadoKwh),
            tarifaDistribuidora: String(p.tarifaDistribuidora),
            tarifaAscender: String(p.tarifaAscender),
            status: p.status,
            observacao: p.observacao ?? "",
          },
        }))}
      />
    </>
  );
}
