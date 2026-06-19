import { CrudSection } from "@/components/cadastros/CrudSection";
import { deleteCliente, saveCliente } from "@/lib/cadastros/actions";
import { listClientes } from "@/lib/cadastros/queries";

export const dynamic = "force-dynamic";

export default async function ClientesCadastroPage() {
  const rows = await listClientes();

  return (
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
      columns={["Cliente", "Documento", "Tipo", "Status"]}
      rows={rows.map((c) => ({
        id: c.id,
        cells: [c.nome, c.documento || "-", c.tipo, c.status],
        values: {
          nome: c.nome,
          documento: c.documento ?? "",
          tipo: c.tipo,
          status: c.status,
          email: c.email ?? "",
          responsavel: c.responsavel ?? "",
        },
      }))}
    />
  );
}
