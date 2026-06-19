import { ModuleGrid } from "@/components/ModuleGrid";
import { PowerRing } from "@/components/PowerRing";
import { StationCard } from "@/components/StationCard";
import { GenerationChart } from "@/components/GenerationChart";
import {
  getHistoricoGeracaoMensal,
  getTelemetriaPorStation,
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

export default async function OverviewPage() {
  const [usinas, tele, hist, fat] = await Promise.all([
    getUsinasComTelemetria(),
    getTelemetriaPorStation(),
    getHistoricoGeracaoMensal(),
    getResumoFaturasDg(),
  ]);

  const estacoes = Array.from(tele.mapa.values()).sort(
    (a, b) => b.currentPowerKw - a.currentPowerKw,
  );
  const capPorStation = new Map(
    usinas.linhas
      .filter((l) => l.stationIdSoliscloud)
      .map((l) => [l.stationIdSoliscloud as string, l.potenciaKwp]),
  );
  const capacidadeKw = usinas.linhas
    .filter((l) => l.vinculada)
    .reduce((s, l) => s + l.potenciaKwp, 0);

  const potenciaAgora = estacoes.reduce((s, e) => s + e.currentPowerKw, 0);
  const pctCapacidade = capacidadeKw > 0 ? (potenciaAgora / capacidadeKw) * 100 : 0;
  const hoje = estacoes.reduce((s, e) => s + e.dayEnergyKwh, 0);
  const mes = estacoes.reduce((s, e) => s + e.monthEnergyKwh, 0);
  const online = estacoes.filter((e) => e.state === "online").length;
  const alarme = estacoes.filter((e) => e.state === "alarm").length;
  const offline = estacoes.filter((e) => e.state === "offline").length;

  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const receitaMes =
    hist.porMes.find((m) => m.competencia === mesAtual)?.receita ?? 0;

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
          pct={pctCapacidade}
          centerValue={numberFormatter.format(potenciaAgora)}
          unit="kW agora"
          sublabel={
            capacidadeKw > 0
              ? `${Math.round(pctCapacidade)}% da capacidade · ${numberFormatter.format(capacidadeKw)} kWp`
              : "Vincule usinas para ver a capacidade"
          }
          pulse={potenciaAgora > 0}
        />
        <div className="cockpit-aside">
          <div>
            <p className="eyebrow">Operação · tempo real</p>
            <h2>Central das usinas solares</h2>
          </div>
          <div className="cockpit-readouts">
            <div className="readout">
              <span>Gerado hoje</span>
              <strong>{numberFormatter.format(hoje)} kWh</strong>
            </div>
            <div className="readout">
              <span>Gerado no mês</span>
              <strong>{numberFormatter.format(mes)} kWh</strong>
            </div>
            <div className="readout">
              <span>Receita no mês</span>
              <strong>{moneyFormatter.format(receitaMes)}</strong>
            </div>
          </div>
          <div className="cockpit-chips">
            <span className="status status-online">{online} gerando</span>
            {alarme > 0 ? (
              <span className="status status-alarm">{alarme} em alarme</span>
            ) : null}
            {offline > 0 ? (
              <span className="status status-offline">{offline} offline</span>
            ) : null}
          </div>
        </div>
      </section>

      <ModuleGrid />

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Frota ao vivo</h2>
            <p>Potência de cada usina agora (atualiza a cada ~5 min).</p>
          </div>
          <span>{estacoes.length} usina(s)</span>
        </div>
        {estacoes.length === 0 ? (
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Nenhuma telemetria. Configure a SolisCloud em Configurações ›
            Integrações.
          </p>
        ) : (
          <div className="station-strip">
            {estacoes.map((e) => (
              <StationCard
                key={e.stationId}
                nome={e.stationName ?? e.stationId}
                state={e.state}
                currentPowerKw={e.currentPowerKw}
                potenciaKwp={capPorStation.get(e.stationId) ?? 0}
                dayEnergyKwh={e.dayEnergyKwh}
              />
            ))}
          </div>
        )}
      </section>

      <section className="split-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Ritmo do mês</h2>
          </div>
          <GenerationChart series={serieMes} />
        </section>
        <section className="panel">
          <div className="panel-header">
            <h2>Financeiro</h2>
          </div>
          <div className="summary-list">
            <div>
              <span>Em aberto</span>
              <strong style={{ color: "var(--warning)" }}>
                {moneyFormatter.format(fat.emAberto)}
              </strong>
            </div>
            <div>
              <span>Recebido</span>
              <strong>{moneyFormatter.format(fat.pago)}</strong>
            </div>
            <div>
              <span>Faturas</span>
              <strong>{fat.qtd}</strong>
            </div>
          </div>
        </section>
      </section>
    </>
  );
}
