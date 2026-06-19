import { BarList } from "@/components/BarList";
import { SummaryStrip, type SummaryItem } from "@/components/SummaryStrip";
import { UsinasTable } from "@/components/UsinasTable";
import { getUsinasComTelemetria } from "@/lib/cadastros/queries";
import { numberFormatter } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

const n = (v: number) => numberFormatter.format(v);

export default async function UsinasPage() {
  const { configurada, linhas } = await getUsinasComTelemetria();
  const vinculadas = linhas.filter((l) => l.vinculada);

  // KPIs de performance do parque. Aderência média é ponderada (soma realizada /
  // soma da meta até hoje), igual ao critério do Executivo.
  const parqueKwp = linhas.reduce((s, l) => s + l.potenciaKwp, 0);
  const geracaoMes = vinculadas.reduce((s, l) => s + (l.realizadoMesKwh ?? 0), 0);
  const comEsperado = vinculadas.filter((l) => (l.esperadoMesKwh ?? 0) > 0);
  const realTot = comEsperado.reduce((s, l) => s + (l.realizadoMesKwh ?? 0), 0);
  const espTot = comEsperado.reduce((s, l) => s + (l.esperadoMesKwh ?? 0), 0);
  const aderMedia = espTot > 0 ? (realTot / espTot) * 100 : null;
  const atencao = vinculadas.filter(
    (l) => l.statusReal === "offline" || l.statusReal === "alarm",
  ).length;

  const kpis: SummaryItem[] = [
    {
      label: "Parque instalado",
      value: `${n(parqueKwp)} kWp`,
      hint: `${linhas.length} usina(s)`,
    },
    {
      label: "Geração no mês",
      value: `${n(geracaoMes)} kWh`,
      hint: "realizado na SolisCloud",
    },
    {
      label: "Aderência média",
      value: aderMedia != null ? `${n(aderMedia)}%` : "—",
      hint: "realizado × meta até hoje",
      tone:
        aderMedia == null
          ? "default"
          : aderMedia >= 85
            ? "ok"
            : aderMedia >= 70
              ? "warn"
              : "bad",
    },
    {
      label: "Vinculadas",
      value: `${vinculadas.length}/${linhas.length}`,
      hint: "à SolisCloud",
      tone:
        linhas.length > 0 && vinculadas.length === linhas.length
          ? "ok"
          : "warn",
    },
    {
      label: "Precisam de atenção",
      value: String(atencao),
      hint: "offline ou em alarme",
      tone: atencao > 0 ? "bad" : vinculadas.length > 0 ? "ok" : "default",
    },
  ];

  const geracaoRows = vinculadas
    .map((l) => ({
      label: l.nome,
      value: l.realizadoMesKwh ?? 0,
      caption: l.estacaoNome ?? "",
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);

  const aderenciaRows = vinculadas
    .filter((l) => l.aderenciaPct != null)
    .map((l) => ({
      label: l.nome,
      value: l.aderenciaPct as number,
      caption: `${n(l.realizadoMesKwh ?? 0)} de ${n(l.esperadoMesKwh ?? 0)} kWh`,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <SummaryStrip items={kpis} />

      {!configurada ? (
        <section className="panel">
          <div className="panel-header">
            <h2>SolisCloud não configurada</h2>
          </div>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Configure as credenciais em Configurações › Integrações para ver a
            geração real das usinas.
          </p>
        </section>
      ) : vinculadas.length === 0 ? (
        <section className="panel">
          <div className="panel-header">
            <h2>Nenhuma usina vinculada à SolisCloud</h2>
          </div>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Vincule cada usina ao Station ID em Cadastros › Usinas — ou use
            “Importar da SolisCloud” — para cruzar geração real × esperada.
          </p>
        </section>
      ) : null}

      <section className="dashboard-grid">
        <BarList
          title="Geração do mês por usina (real)"
          rows={geracaoRows}
          formatter={(v) => `${n(v)} kWh`}
        />
        <BarList
          title="Aderência realizado × esperado"
          rows={aderenciaRows}
          formatter={(v) => `${n(v)}%`}
        />
      </section>

      <UsinasTable linhas={linhas} />
    </>
  );
}
