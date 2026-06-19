import { CrudSection } from "@/components/cadastros/CrudSection";
import { SummaryStrip, type SummaryItem } from "@/components/SummaryStrip";
import { deleteDistribuidora, saveDistribuidora } from "@/lib/cadastros/actions";
import { listDistribuidoras } from "@/lib/cadastros/queries";

export const dynamic = "force-dynamic";

export default async function DistribuidorasCadastroPage() {
  const rows = await listDistribuidoras();

  const ufs = new Set(rows.map((d) => d.uf).filter(Boolean)).size;
  const resumo: SummaryItem[] = [
    { label: "Distribuidoras", value: String(rows.length), hint: "concessionárias" },
    { label: "UFs atendidas", value: String(ufs), hint: "estados com cobertura" },
  ];

  return (
    <>
      <SummaryStrip items={resumo} />
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
    </>
  );
}
