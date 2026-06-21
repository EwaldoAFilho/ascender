import type { ReactNode } from "react";
import { CrudSection } from "@/components/cadastros/CrudSection";
import { OrigemBanner } from "@/components/cadastros/OrigemBanner";
import { SummaryStrip, type SummaryItem } from "@/components/SummaryStrip";
import { deleteCliente, saveCliente } from "@/lib/cadastros/actions";
import { listClientes } from "@/lib/cadastros/queries";
import { numberFormatter } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function ClientesCadastroPage() {
  const rows = await listClientes();

  // Banner de proveniência no modal: só para registros vindos de integração.
  const extras: Record<string, ReactNode> = {};
  for (const c of rows) {
    if (c.origem && c.origem !== "manual") {
      extras[c.id] = (
        <OrigemBanner
          origem={c.origem}
          sincronizadoEm={c.origemSincronizadoEm?.toISOString() ?? null}
          camposIntegracao={["Nome / Razão social", "Documento (CPF/CNPJ)"]}
        />
      );
    }
  }

  const ativos = rows.filter((c) => c.status === "ativo").length;
  const prosumidores = rows.filter((c) => c.tipo === "prosumidor").length;
  const investidores = rows.filter((c) => c.tipo === "investidor").length;
  const resumo: SummaryItem[] = [
    { label: "Clientes", value: numberFormatter.format(rows.length), hint: "na carteira" },
    {
      label: "Ativos",
      value: numberFormatter.format(ativos),
      hint: `${rows.length - ativos} inativo(s)`,
      tone: rows.length > 0 && ativos === rows.length ? "ok" : "default",
    },
    { label: "Prosumidores", value: numberFormatter.format(prosumidores), hint: "geram e consomem" },
    { label: "Investidores", value: numberFormatter.format(investidores), hint: "donos de usina" },
  ];

  return (
    <>
      <SummaryStrip items={resumo} />
      <CrudSection
        singular="cliente"
        onSave={saveCliente}
        onDelete={deleteCliente}
        fields={[
          {
            name: "nome",
            label: "Nome / Razão social",
            type: "text",
            required: true,
          },
          { name: "documento", label: "Documento (CPF/CNPJ)", type: "text" },
          {
            name: "tipo",
            label: "Tipo",
            type: "select",
            options: [
              { value: "cliente", label: "cliente" },
              { value: "prosumidor", label: "prosumidor" },
              { value: "investidor", label: "investidor" },
            ],
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "ativo", label: "ativo" },
              { value: "inativo", label: "inativo" },
            ],
          },
          { name: "email", label: "E-mail financeiro", type: "text" },
          { name: "responsavel", label: "Responsável", type: "text" },
        ]}
        columns={["Cliente", "Documento", "Tipo", "Status", "Origem"]}
        rows={rows.map((c) => ({
          id: c.id,
          cells: [
            c.nome,
            c.documento || "-",
            c.tipo,
            c.status,
            c.origem === "manual" ? "manual" : c.origem,
          ],
          values: {
            nome: c.nome,
            documento: c.documento ?? "",
            tipo: c.tipo,
            status: c.status,
            email: c.email ?? "",
            responsavel: c.responsavel ?? "",
          },
        }))}
        extras={extras}
        />
    </>
  );
}
