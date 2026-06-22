import { FrescorTelemetria } from "@/components/FrescorTelemetria";
import { MetricCard } from "@/components/MetricCard";
import { PowerRing } from "@/components/PowerRing";
import { StationCard } from "@/components/StationCard";
import { AttentionCenter } from "@/components/operacao/AttentionCenter";
import { HealthScore } from "@/components/operacao/HealthScore";
import {
  getTelemetriaPorStation,
  getUsinasComTelemetria,
} from "@/lib/cadastros/queries";
import { getHealthScore } from "@/lib/operacao/health-score";
import { getIncidents } from "@/lib/operacao/incidents";
import { ultimaTelemetriaEm } from "@/lib/soliscloud/telemetria-db";
import { numberFormatter } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [usinas, tele, coletaEm, health, incidents] = await Promise.all([
    getUsinasComTelemetria(),
    getTelemetriaPorStation(),
    ultimaTelemetriaEm(),
    getHealthScore(),
    getIncidents(),
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

  return (
    <>
      <HealthScore result={health} />

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
          </div>
          <div className="cockpit-chips">
            <span className="status status-online">{online} online</span>
            {alarme > 0 ? (
              <span className="status status-alarm">{alarme} em alarme</span>
            ) : null}
            {offline > 0 ? (
              <span className="status status-offline">{offline} offline</span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="metric-card-grid">
        <MetricCard
          label="Capacidade instalada"
          value={`${numberFormatter.format(capacidadeKw)} kWp`}
          hint="potência nominal do parque"
        />
        <MetricCard
          label="Aproveitamento agora"
          value={capacidadeKw > 0 ? `${Math.round(pctCapacidade)}%` : "—"}
          hint="potência atual ÷ capacidade"
        />
      </section>

      <AttentionCenter incidents={incidents} />

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Frota ao vivo</h2>
            <p>Potência de cada usina, coletada no banco a cada ~10 min.</p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <FrescorTelemetria iso={coletaEm} />
            <span>{estacoes.length} usina(s)</span>
          </div>
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
    </>
  );
}
