import { CrudSection } from "@/components/cadastros/CrudSection";
import { deleteDistribuidora, saveDistribuidora } from "@/lib/cadastros/actions";
import { listDistribuidoras } from "@/lib/cadastros/queries";

export const dynamic = "force-dynamic";

export default async function DistribuidorasCadastroPage() {
  const rows = await listDistribuidoras();

  return (
    <CrudSection
      singular="distribuidora"
      onSave={saveDistribuidora}
      onDelete={deleteDistribuidora}
      fields={[
        {
          name: "nome",
          label: "Nome da distribuidora",
          type: "text",
          required: true,
        },
        { name: "uf", label: "UF", type: "text", placeholder: "Ex.: DF, GO, MG" },
      ]}
      columns={["Distribuidora", "UF"]}
      rows={rows.map((d) => ({
        id: d.id,
        cells: [d.nome, d.uf ?? "-"],
        values: { nome: d.nome, uf: d.uf ?? "" },
      }))}
    />
  );
}
