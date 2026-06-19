import { ImportarCadastrosDg } from "@/components/cadastros/ImportarCadastrosDg";
import { SummaryStrip, type SummaryItem } from "@/components/SummaryStrip";
import {
  getConciliacaoReport,
  type ConciliacaoReport,
} from "@/lib/digitalgrid/cadastros";
import { getDgCredential } from "@/lib/digitalgrid/credentials";

export const dynamic = "force-dynamic";

function CategoriaCard({
  titulo,
  dados,
  acaoLabel = "a importar",
  hint,
}: {
  titulo: string;
  dados: ConciliacaoReport["clientes"];
  acaoLabel?: string;
  hint?: string;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>{titulo}</h2>
          <p>
            {dados.dgTotal} no Digital Grid · {dados.vinculados} já vinculado(s) ·{" "}
            <strong style={{ color: dados.aImportar > 0 ? "var(--warning)" : "var(--success)" }}>
              {dados.aImportar} {acaoLabel}
            </strong>
            {hint ? ` — ${hint}` : ""}
          </p>
        </div>
      </div>
      {dados.preview.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)" }}>
          {dados.preview.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
          {dados.aImportar > dados.preview.length ? (
            <li>+{dados.aImportar - dados.preview.length} outro(s)…</li>
          ) : null}
        </ul>
      ) : (
        <p style={{ color: "var(--success)", fontWeight: 700 }}>
          Tudo já está no cadastro. ✓
        </p>
      )}
    </section>
  );
}

export default async function ConciliacaoPage() {
  const cred = await getDgCredential();
  if (!cred) {
    return (
      <section className="panel">
        <div className="panel-header">
          <h2>Conciliação com o Digital Grid</h2>
        </div>
        <p style={{ color: "var(--muted)" }}>
          Configure o token do Digital Grid em Configurações › Integrações para
          conciliar os cadastros.
        </p>
      </section>
    );
  }

  const report = await getConciliacaoReport();
  const totalImportar =
    report.clientes.aImportar + report.usinas.aImportar + report.ucs.aImportar;

  const kpis: SummaryItem[] = [
    {
      label: "Clientes",
      value: `${report.clientes.vinculados}/${report.clientes.dgTotal}`,
      hint:
        report.clientes.aImportar > 0
          ? `${report.clientes.aImportar} a importar`
          : "tudo conciliado",
      tone: report.clientes.aImportar === 0 ? "ok" : "warn",
    },
    {
      label: "Usinas",
      value: `${report.usinas.vinculados}/${report.usinas.dgTotal}`,
      hint:
        report.usinas.aImportar > 0
          ? `${report.usinas.aImportar} a vincular`
          : "tudo vinculado",
      tone: report.usinas.aImportar === 0 ? "ok" : "warn",
    },
    {
      label: "Unidades consumidoras",
      value: `${report.ucs.vinculados}/${report.ucs.dgTotal}`,
      hint:
        report.ucs.aImportar > 0
          ? `${report.ucs.aImportar} a importar`
          : "tudo conciliado",
      tone: report.ucs.aImportar === 0 ? "ok" : "warn",
    },
  ];

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Conciliação com o Digital Grid</h2>
            <p>
              Importa clientes e unidades consumidoras reais do Digital Grid para
              o cadastro, sem duplicar (casa por documento e número da instalação).
              As usinas, cujos nomes na SolisCloud e no Digital Grid divergem, são
              vinculadas manualmente pelo Código Digital Grid. Não altera nada no
              Digital Grid.
            </p>
          </div>
        </div>
        <ImportarCadastrosDg />
        {totalImportar === 0 ? (
          <p style={{ marginTop: 10, color: "var(--success)", fontWeight: 700 }}>
            Cadastro 100% conciliado com o Digital Grid. ✓
          </p>
        ) : (
          <p style={{ marginTop: 10, color: "var(--muted)" }}>
            {totalImportar} registro(s) podem ser importados.
          </p>
        )}
      </section>

      <SummaryStrip items={kpis} />

      <CategoriaCard titulo="Clientes a importar" dados={report.clientes} />
      <CategoriaCard
        titulo="Usinas a vincular"
        dados={report.usinas}
        acaoLabel="a vincular manualmente"
        hint="defina o Código Digital Grid na usina em Cadastros › Usinas"
      />
      <CategoriaCard titulo="Unidades consumidoras a importar" dados={report.ucs} />
    </>
  );
}
