import { CrudSection } from "@/components/cadastros/CrudSection";
import { SummaryStrip, type SummaryItem } from "@/components/SummaryStrip";
import { deleteContrato, saveContrato } from "@/lib/cadastros/actions";
import {
  listContratos,
  opcoesClientes,
  opcoesUnidades,
  opcoesUsinas,
} from "@/lib/cadastros/queries";
import { withSessionTenant } from "@/lib/auth/tenant";
import { numberFormatter } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

function tarifa(value: number): string {
  return `R$ ${value.toFixed(3).replace(".", ",")}`;
}

export default async function ContratosCadastroPage() {
  // Escopa a leitura ao tenant do usuário logado (multi-tenant, Fase 2).
  const [rows, cliOpts, ucOpts, usinaOpts] = await withSessionTenant(() =>
    Promise.all([
      listContratos(),
      opcoesClientes(),
      opcoesUnidades(),
      opcoesUsinas(),
    ]),
  );

  const ativos = rows.filter((c) => c.status === "ativo").length;
  const descontoMedio = rows.length
    ? rows.reduce((s, c) => s + c.percentualDesconto, 0) / rows.length
    : 0;
  const resumo: SummaryItem[] = [
    { label: "Contratos", value: numberFormatter.format(rows.length), hint: "no total" },
    {
      label: "Ativos",
      value: numberFormatter.format(ativos),
      hint: `${rows.length - ativos} em simulação/análise`,
      tone: rows.length > 0 && ativos === rows.length ? "ok" : "default",
    },
    {
      label: "Desconto médio",
      value: `${descontoMedio.toFixed(1).replace(".", ",")}%`,
      hint: "sobre a tarifa",
    },
  ];

  return (
    <>
      <SummaryStrip items={resumo} />
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
          sortValues: [
            c.clienteNome ?? "-",
            c.unidadeCodigo ?? "-",
            c.usinaNome ?? "-",
            c.tarifaDistribuidora,
            c.tarifaAscender,
            c.percentualDesconto,
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
    </>
  );
}
