import { AdherenceRow } from "@/components/AdherenceRow";
import { GenerationChart } from "@/components/GenerationChart";
import { PowerRing } from "@/components/PowerRing";
import {
  getHistoricoGeracaoMensal,
  getUsinasComTelemetria,
} from "@/lib/cadastros/queries";
import { getResumoFaturasDg } from "@/lib/digitalgrid/queries";
import {
  formatCompetencia,
  moneyFormatter,
  numberFormatter,
} from "@/lib/dashboard-data";
import type { GenerationSeries } from "@/lib/api/soliscloud";

export const dynamic = "force-dynamic";

export default async function ExecutivoPage() {
  const [usinas, hist, fat] = await Promise.all([
    getUsinasComTelemetria(),
    getHistoricoGeracaoMensal(),
    getResumoFaturasDg(),
  ]);

  const comEsperado = usinas.linhas.filter((l) => (l.esperadoMesKwh ?? 0) > 0);
  const realTot = comEsperado.reduce((s, l) => s + (l.realizadoMesKwh ?? 0), 0);
  const espTot = comEsperado.reduce((s, l) => s + (l.esperadoMesKwh ?? 0), 0);
  const temAderencia = espTot > 0;
  const aderGlobal = temAderencia ? (realTot / espTot) * 100 : 0;
  const tone =
    aderGlobal >= 85 ? "ok" : aderGlobal >= 70 ? "warn" : "bad";

  const naMeta = usinas.linhas.filter((l) => (l.aderenciaPct ?? 0) >= 100).length;
  const comAder = usinas.linhas.filter((l) => l.aderenciaPct != null).length;
  const parqueKwp = usinas.linhas.reduce((s, l) => s + l.potenciaKwp, 0);

  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const aderRows = [...usinas.linhas].sort(
    (a, b) => (a.aderenciaPct ?? Infinity) - (b.aderenciaPct ?? Infinity),
  );

  const serieMes: GenerationSeries = {
    period: "month",
    unit: "kWh",
    points: hist.porMes.map((m) => ({
      label: formatCompetencia(m.competencia),
      value: m.geracaoKwh,
      money: m.receita,
    })),
    totalKwh: hist.totalKwh,
    totalMoney: hist.totalReceita,
    peakKw: null,
  };

  return (
    <>
      <section className="cockpit">
        <PowerRing
          pct={temAderencia ? aderGlobal : 0}
          centerValue={temAderencia ? numberFormatter.format(aderGlobal) : "—"}
          unit={temAderencia ? "% da meta" : ""}
          sublabel={
            temAderencia
              ? `Realizado ${numberFormatter.format(realTot)} / Esperado ${numberFormatter.format(espTot)} kWh`
              : "Defina a meta de geração das usinas"
          }
          tone={temAderencia ? tone : "brand"}
        />
        <div className="cockpit-aside">
          <div>
            <p className="eyebrow">Veredito do mês · {formatCompetencia(mesAtual)}</p>
            <h2>Desempenho consolidado</h2>
          </div>
          <div className="cockpit-readouts">
            <div className="readout">
              <span>Usinas na meta</span>
              <strong>
                {naMeta} de {comAder}
              </strong>
            </div>
            <div className="readout">
              <span>Geração no mês</span>
              <strong>{numberFormatter.format(realTot)} kWh</strong>
            </div>
            <div className="readout">
              <span>Recebido / em aberto</span>
              <strong>
                {moneyFormatter.format(fat.pago)} / {moneyFormatter.format(fat.emAberto)}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="signal-row">
        <article className="signal">
          <span className="lbl">Geração no ano</span>
          <span className="val">{numberFormatter.format(hist.totalKwh)} kWh</span>
          <span className="hint">Histórico SolisCloud</span>
        </article>
        <article className="signal">
          <span className="lbl">Receita no ano</span>
          <span className="val">{moneyFormatter.format(hist.totalReceita)}</span>
          <span className="hint">Estimada pela geração</span>
        </article>
        <article className="signal">
          <span className="lbl">Parque instalado</span>
          <span className="val">{numberFormatter.format(parqueKwp)} kWp</span>
          <span className="hint">{usinas.linhas.length} usina(s)</span>
        </article>
      </section>

      <section className="split-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Aderência por usina</h2>
              <p>Realizado × esperado no mês — pior desempenho no topo.</p>
            </div>
          </div>
          {aderRows.length === 0 ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Nenhuma usina cadastrada.
            </p>
          ) : (
            <div className="adherence-list">
              {aderRows.map((l) => (
                <AdherenceRow
                  key={l.id}
                  nome={l.nome}
                  aderenciaPct={l.aderenciaPct}
                  realizado={l.realizadoMesKwh}
                  esperado={l.esperadoMesKwh}
                />
              ))}
            </div>
          )}
        </section>
        <section className="panel">
          <div className="panel-header">
            <h2>Tendência do ano</h2>
          </div>
          <GenerationChart series={serieMes} />
        </section>
      </section>
    </>
  );
}
