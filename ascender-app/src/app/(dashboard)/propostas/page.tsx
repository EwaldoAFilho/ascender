import Link from "next/link";
import { Calculator } from "lucide-react";
import { CrudSection } from "@/components/cadastros/CrudSection";
import { DesktopOnly } from "@/components/DesktopOnly";
import { SummaryStrip, type SummaryItem } from "@/components/SummaryStrip";
import { deleteProposta } from "@/lib/cadastros/actions";
import { listPropostas } from "@/lib/cadastros/queries";
import { withSessionTenant } from "@/lib/auth/tenant";
import { getSessionRole, roleAtLeast } from "@/lib/auth/rbac";
import { moneyFormatter, numberFormatter } from "@/lib/dashboard-data";
import {
  PropostaPdfButton,
  PropostaStatusSelect,
} from "./PropostaRowControls";

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
  const props = await withSessionTenant(() => listPropostas());
  // Leitura é só-leitura: sem Editar/Excluir nem troca de status (só baixar PDF).
  const podeEditar = roleAtLeast(await getSessionRole(), "operador");

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

  const kwp = (v: number | null) =>
    v != null ? `${numberFormatter.format(v)} kWp` : "—";
  const preco = (v: number | null) => (v != null ? moneyFormatter.format(v) : "—");
  const payback = (v: number | null) =>
    v != null && Number.isFinite(v) ? `${v.toFixed(1).replace(".", ",")} anos` : "—";

  return (
    <DesktopOnly area="As propostas">
      <SummaryStrip items={kpis} />

      <div style={{ display: "flex", justifyContent: "flex-end", margin: "0 0 14px" }}>
        <Link href="/propostas/gerador" className="btn-primary">
          <Calculator size={16} /> Gerar proposta (dimensionamento)
        </Link>
      </div>

      <CrudSection
        singular="proposta"
        hideAdd
        onDelete={deleteProposta}
        editBasePath="/propostas"
        readOnly={!podeEditar}
        columns={[
          "Cliente",
          "UC",
          "Consumo",
          "Potência",
          "Preço",
          "Payback",
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
            kwp(p.potenciaKwp),
            preco(p.precoFinal),
            payback(p.paybackAnos),
            tarifa(p.tarifaDistribuidora),
            tarifa(p.tarifaAscender),
            moneyFormatter.format(economiaMes(p)),
            podeEditar ? (
              <PropostaStatusSelect key="s" id={p.id} status={p.status} />
            ) : (
              <span key="s" className={`status ${statusClasse(p.status)}`}>
                {p.status}
              </span>
            ),
          ],
          sortValues: [
            p.clienteNome ?? "-",
            p.unidadeCodigo ?? "-",
            p.consumoEstimadoKwh,
            p.potenciaKwp ?? 0,
            p.precoFinal ?? 0,
            p.paybackAnos ?? 0,
            p.tarifaDistribuidora,
            p.tarifaAscender,
            economiaMes(p),
            p.status,
          ],
          values: {},
          actions: <PropostaPdfButton id={p.id} temPdf={p.temDadosGerador} />,
        }))}
      />
    </DesktopOnly>
  );
}
