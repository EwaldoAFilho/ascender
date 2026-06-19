"use client";

import { AlarmsByStation } from "@/components/AlarmsByStation";
import { BarList } from "@/components/BarList";
import { EmptyState, ErrorState, PanelSkeleton } from "@/components/states";
import {
  useAlarms,
  useCollectors,
  useInverters,
  useStations,
} from "@/hooks/useSolis";
import { numberFormatter } from "@/lib/dashboard-data";

const loadingStyle = { color: "var(--muted)", margin: 0 } as const;

const collectorStateLabel: Record<string, string> = {
  online: "online",
  offline: "offline",
  alarm: "alarme",
};
const collectorRank: Record<string, number> = { offline: 0, alarm: 1, online: 2 };

export default function SolisCloudPage() {
  const stations = useStations();
  const inverters = useInverters();
  const alarms = useAlarms();
  const collectors = useCollectors();

  const stationList = stations.data ?? [];
  const inverterList = inverters.data ?? [];
  const alarmList = alarms.data ?? [];
  const collectorData = collectors.data;
  const collectorList = [...(collectorData?.coletores ?? [])].sort(
    (a, b) => (collectorRank[a.state] ?? 9) - (collectorRank[b.state] ?? 9),
  );
  const stationNameById = new Map(
    stationList.map((s) => [s.stationId, s.stationName ?? s.stationId]),
  );
  const usinasComAtivo = new Set(
    alarmList.filter((a) => a.status !== "resolvido").map((a) => a.plantId),
  ).size;

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Telemetria por estacao</h2>
            <p>Dados reais da API SolisCloud (atualiza a cada ~5 min).</p>
          </div>
          <span>{stations.isSuccess ? `${stationList.length} usina(s)` : "—"}</span>
        </div>
        {stations.isPending ? (
          <p style={loadingStyle}>Carregando telemetria…</p>
        ) : stations.isError ? (
          <ErrorState error={stations.error} onRetry={() => stations.refetch()} />
        ) : stationList.length === 0 ? (
          <EmptyState message="Nenhuma estacao retornada pela SolisCloud." />
        ) : (
          <div className="telemetry-grid">
            {stationList.map((telemetry) => (
              <article key={telemetry.stationId} className="telemetry-card">
                <div className="telemetry-head">
                  <strong>{telemetry.stationName ?? telemetry.stationId}</strong>
                  <span className={`status status-${telemetry.state}`}>
                    {telemetry.state}
                  </span>
                </div>
                <dl>
                  <div>
                    <dt>Agora</dt>
                    <dd>{numberFormatter.format(telemetry.currentPowerKw)} kW</dd>
                  </div>
                  <div>
                    <dt>Hoje</dt>
                    <dd>{numberFormatter.format(telemetry.dayEnergyKwh)} kWh</dd>
                  </div>
                  <div>
                    <dt>Mes</dt>
                    <dd>{numberFormatter.format(telemetry.monthEnergyKwh)} kWh</dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{numberFormatter.format(telemetry.allEnergyKwh)} kWh</dd>
                  </div>
                </dl>
                <small>
                  {telemetry.updateTime
                    ? `Atualizado em ${telemetry.updateTime}`
                    : "Sem data de atualizacao"}
                </small>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Comunicação dos coletores</h2>
            <p>Status dos dataloggers (O&M). Coletor offline = usina sem envio de dados.</p>
          </div>
          <span>
            {collectors.isSuccess && collectorData
              ? `${collectorData.resumo.online} online · ${collectorData.resumo.offline} offline${collectorData.resumo.alarme ? ` · ${collectorData.resumo.alarme} alarme` : ""} de ${collectorData.resumo.total}`
              : "—"}
          </span>
        </div>
        {collectors.isPending ? (
          <p style={loadingStyle}>Carregando coletores…</p>
        ) : collectors.isError ? (
          <ErrorState error={collectors.error} onRetry={() => collectors.refetch()} />
        ) : collectorList.length === 0 ? (
          <EmptyState message="Nenhum coletor retornado pela SolisCloud." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Serial (SN)</th>
                  <th>Estação</th>
                  <th>Modelo</th>
                  <th>Última comunicação</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {collectorList.map((c) => (
                  <tr key={c.sn}>
                    <td>{c.sn}</td>
                    <td>{stationNameById.get(c.plantId) ?? c.plantId}</td>
                    <td>{c.model ?? "—"}</td>
                    <td>{c.updateTime || "—"}</td>
                    <td>
                      <span className={`status status-${c.state}`}>
                        {collectorStateLabel[c.state] ?? c.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboard-grid">
        {stations.isPending ? (
          <PanelSkeleton title="Energia hoje por usina" />
        ) : stations.isError ? (
          <ErrorState
            title="Energia hoje por usina"
            error={stations.error}
            onRetry={() => stations.refetch()}
          />
        ) : (
          <BarList
            title="Energia hoje por usina"
            rows={stationList.map((t) => ({
              label: t.stationName ?? t.stationId,
              value: t.dayEnergyKwh,
              caption: "geração de hoje",
            }))}
            formatter={(value) => `${numberFormatter.format(value)} kWh`}
          />
        )}
        {stations.isSuccess ? (
          <BarList
            title="Energia do mês por usina"
            rows={stationList.map((t) => ({
              label: t.stationName ?? t.stationId,
              value: t.monthEnergyKwh,
              caption: "acumulado no mês",
            }))}
            formatter={(value) => `${numberFormatter.format(value)} kWh`}
          />
        ) : (
          <PanelSkeleton title="Energia do mês por usina" />
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Alertas por usina</h2>
            <p>Clique numa usina para ver os alertas dela.</p>
          </div>
          <span>
            {alarms.isSuccess
              ? `${usinasComAtivo} com alerta ativo · ${alarmList.length} eventos`
              : "—"}
          </span>
        </div>
        {alarms.isPending ? (
          <p style={loadingStyle}>Carregando alertas…</p>
        ) : alarms.isError ? (
          <ErrorState error={alarms.error} onRetry={() => alarms.refetch()} />
        ) : (
          <AlarmsByStation alarms={alarmList} stationNameById={stationNameById} />
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Inversores</h2>
          <span>
            {inverters.isSuccess ? `${inverterList.length} inversor(es)` : "—"}
          </span>
        </div>
        {inverters.isPending ? (
          <p style={loadingStyle}>Carregando inversores…</p>
        ) : inverters.isError ? (
          <ErrorState error={inverters.error} onRetry={() => inverters.refetch()} />
        ) : inverterList.length === 0 ? (
          <EmptyState message="Nenhum inversor retornado." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Serial</th>
                  <th>Estacao</th>
                  <th>Potencia</th>
                  <th>Hoje</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inverterList.map((inverter) => (
                  <tr key={inverter.id}>
                    <td>{inverter.serialNumber}</td>
                    <td>
                      {stationNameById.get(inverter.plantId) ?? inverter.plantId}
                    </td>
                    <td>{numberFormatter.format(inverter.currentPowerKw)} kW</td>
                    <td>{numberFormatter.format(inverter.todayEnergyKwh)} kWh</td>
                    <td>{numberFormatter.format(inverter.totalEnergyKwh)} kWh</td>
                    <td>
                      <span className={`status status-${inverter.state}`}>
                        {inverter.state}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
