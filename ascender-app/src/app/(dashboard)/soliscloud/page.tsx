"use client";

import { useMemo, useState } from "react";
import { AlarmsByStation } from "@/components/AlarmsByStation";
import { BarList } from "@/components/BarList";
import { DataTable, type DataColumn } from "@/components/DataTable";
import { EmptyState, ErrorState, PanelSkeleton } from "@/components/states";
import { FrescorTelemetria } from "@/components/FrescorTelemetria";
import { GenerationChart } from "@/components/GenerationChart";
import { SummaryStrip, type SummaryItem } from "@/components/SummaryStrip";
import {
  useAlarms,
  useCollectors,
  useHistoricoAlarmes,
  useHistoricoFrota,
  useInverters,
  useStations,
  useSyncStatus,
  useUptimeColetores,
} from "@/hooks/useSolis";
import { numberFormatter, tempoRelativo } from "@/lib/dashboard-data";
import type {
  AlarmeHistorico,
  UptimeColetor,
} from "@/lib/soliscloud/telemetria-db";
import type { Collector, InverterTelemetry } from "@/types/soliscloud";

const loadingStyle = { color: "var(--muted)", margin: 0 } as const;

const collectorStateLabel: Record<string, string> = {
  online: "online",
  offline: "offline",
  alarm: "alarme",
};
const collectorRank: Record<string, number> = { offline: 0, alarm: 1, online: 2 };

type View = "operacao" | "historico";

export default function SolisCloudPage() {
  const stations = useStations();
  const inverters = useInverters();
  const alarms = useAlarms();
  const collectors = useCollectors();
  const historico = useHistoricoFrota();
  const sync = useSyncStatus();
  const uptime = useUptimeColetores();
  const histAlarmes = useHistoricoAlarmes();
  const [view, setView] = useState<View>("operacao");

  const stationList = useMemo(() => stations.data ?? [], [stations.data]);
  const inverterList = useMemo(() => inverters.data ?? [], [inverters.data]);
  const alarmList = useMemo(() => alarms.data ?? [], [alarms.data]);
  const collectorData = collectors.data;
  const coletores = collectorData?.coletores ?? [];

  const stationNameById = useMemo(
    () =>
      new Map(
        stationList.map((s) => [s.stationId, s.stationName ?? s.stationId]),
      ),
    [stationList],
  );

  const usinasComAtivo = useMemo(
    () =>
      new Set(
        alarmList
          .filter((a) => a.status !== "resolvido")
          .map((a) => a.plantId),
      ).size,
    [alarmList],
  );

  const potenciaAgora = useMemo(
    () => stationList.reduce((s, t) => s + t.currentPowerKw, 0),
    [stationList],
  );
  const energiaHoje = useMemo(
    () => stationList.reduce((s, t) => s + t.dayEnergyKwh, 0),
    [stationList],
  );
  const energiaMes = useMemo(
    () => stationList.reduce((s, t) => s + t.monthEnergyKwh, 0),
    [stationList],
  );

  // Faixa de saúde da frota — verde quando tudo certo, vermelho/âmbar quando
  // há datalogger mudo ou usina em alerta. É o primeiro olhar da operação.
  const kpis: SummaryItem[] = [
    {
      label: "Potência agora",
      value: stations.isSuccess ? `${numberFormatter.format(potenciaAgora)} kW` : "—",
      hint: `${stationList.length} usina(s)`,
    },
    {
      label: "Energia hoje",
      value: stations.isSuccess ? `${numberFormatter.format(energiaHoje)} kWh` : "—",
      hint: "geração do dia",
    },
    {
      label: "Energia no mês",
      value: stations.isSuccess ? `${numberFormatter.format(energiaMes)} kWh` : "—",
      hint: "acumulado",
    },
    {
      label: "Comunicação",
      value:
        collectors.isSuccess && collectorData
          ? `${collectorData.resumo.online}/${collectorData.resumo.total}`
          : "—",
      hint: collectorData?.resumo.offline
        ? `${collectorData.resumo.offline} coletor(es) offline`
        : "coletores online",
      tone: collectorData
        ? collectorData.resumo.offline > 0
          ? "bad"
          : "ok"
        : "default",
    },
    {
      label: "Alarmes ativos",
      value: alarms.isSuccess ? String(usinasComAtivo) : "—",
      hint: "usinas com alerta",
      tone: !alarms.isSuccess ? "default" : usinasComAtivo > 0 ? "warn" : "ok",
    },
  ];

  const inverterColumns = useMemo<DataColumn<InverterTelemetry>[]>(
    () => [
      { key: "serial", header: "Serial", value: (i) => i.serialNumber },
      {
        key: "estacao",
        header: "Estação",
        value: (i) => stationNameById.get(i.plantId) ?? i.plantId,
      },
      {
        key: "pot",
        header: "Potência",
        align: "right",
        value: (i) => i.currentPowerKw,
        render: (i) => `${numberFormatter.format(i.currentPowerKw)} kW`,
      },
      {
        key: "hoje",
        header: "Hoje",
        align: "right",
        value: (i) => i.todayEnergyKwh,
        render: (i) => `${numberFormatter.format(i.todayEnergyKwh)} kWh`,
      },
      {
        key: "total",
        header: "Total",
        align: "right",
        value: (i) => i.totalEnergyKwh,
        render: (i) => `${numberFormatter.format(i.totalEnergyKwh)} kWh`,
      },
      {
        key: "status",
        header: "Status",
        value: (i) => i.state,
        render: (i) => (
          <span className={`status status-${i.state}`}>{i.state}</span>
        ),
      },
    ],
    [stationNameById],
  );

  const coletorColumns = useMemo<DataColumn<Collector>[]>(
    () => [
      { key: "sn", header: "Serial (SN)", value: (c) => c.sn },
      {
        key: "estacao",
        header: "Estação",
        value: (c) => stationNameById.get(c.plantId) ?? c.plantId,
      },
      { key: "modelo", header: "Modelo", value: (c) => c.model ?? "—" },
      {
        key: "updated",
        header: "Última comunicação",
        value: (c) => c.updateTime || "—",
      },
      {
        key: "status",
        header: "Status",
        value: (c) => collectorRank[c.state] ?? 9,
        exportValue: (c) => collectorStateLabel[c.state] ?? c.state,
        render: (c) => (
          <span className={`status status-${c.state}`}>
            {collectorStateLabel[c.state] ?? c.state}
          </span>
        ),
      },
    ],
    [stationNameById],
  );

  const uptimeColumns = useMemo<DataColumn<UptimeColetor>[]>(
    () => [
      { key: "sn", header: "Serial (SN)", value: (c) => c.sn },
      { key: "estacao", header: "Estação", value: (c) => c.usinaNome },
      {
        key: "uptime",
        header: "Uptime 24h",
        align: "right",
        value: (c) => c.pct,
        render: (c) => (
          <span
            className={
              c.pct >= 95
                ? "positive-value"
                : c.pct < 80
                  ? "negative-value"
                  : ""
            }
          >
            {numberFormatter.format(c.pct)}%
          </span>
        ),
      },
      {
        key: "leituras",
        header: "Leituras (online/total)",
        align: "right",
        value: (c) => c.online,
        render: (c) => `${c.online}/${c.total}`,
      },
    ],
    [],
  );

  const alarmeColumns = useMemo<DataColumn<AlarmeHistorico>[]>(
    () => [
      {
        key: "quando",
        header: "Atualizado",
        value: (a) => a.atualizadoEm ?? "",
        render: (a) => tempoRelativo(a.atualizadoEm),
      },
      { key: "usina", header: "Usina", value: (a) => a.usinaNome },
      { key: "device", header: "Device", value: (a) => a.deviceSn },
      { key: "nivel", header: "Nível", value: (a) => a.nivel },
      { key: "msg", header: "Mensagem", value: (a) => a.mensagem },
      {
        key: "status",
        header: "Status",
        value: (a) => a.status,
        render: (a) => (
          <span
            className={`status status-${a.status === "resolvido" ? "online" : a.status === "aberto" ? "offline" : "aguardando"}`}
          >
            {a.status}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <div className="solis-toolbar">
        <nav className="registry-tabs" aria-label="Visão da operação">
          <button
            type="button"
            className={view === "operacao" ? "active" : ""}
            onClick={() => setView("operacao")}
          >
            Operação ao vivo
          </button>
          <button
            type="button"
            className={view === "historico" ? "active" : ""}
            onClick={() => setView("historico")}
          >
            Histórico &amp; O&amp;M
          </button>
        </nav>
        {sync.data ? <FrescorTelemetria iso={sync.data.iso} /> : null}
      </div>

      {view === "operacao" ? (
        <>
          <SummaryStrip items={kpis} />

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Telemetria por estação</h2>
                <p>Do banco (worker a cada ~10 min). Estado atual de cada usina.</p>
              </div>
              <span>
                {stations.isSuccess ? `${stationList.length} usina(s)` : "—"}
              </span>
            </div>
            {stations.isPending ? (
              <p style={loadingStyle}>Carregando telemetria…</p>
            ) : stations.isError ? (
              <ErrorState error={stations.error} onRetry={() => stations.refetch()} />
            ) : stationList.length === 0 ? (
              <EmptyState message="Nenhuma estação retornada pela SolisCloud." />
            ) : (
              <div className="telemetry-grid">
                {stationList.map((telemetry) => (
                  <article key={telemetry.stationId} className="telemetry-card">
                    <div className="telemetry-head">
                      <strong>
                        {telemetry.stationName ?? telemetry.stationId}
                      </strong>
                      <span className={`status status-${telemetry.state}`}>
                        {telemetry.state}
                      </span>
                    </div>
                    <dl>
                      <div>
                        <dt>Agora</dt>
                        <dd>
                          {numberFormatter.format(telemetry.currentPowerKw)} kW
                        </dd>
                      </div>
                      <div>
                        <dt>Hoje</dt>
                        <dd>
                          {numberFormatter.format(telemetry.dayEnergyKwh)} kWh
                        </dd>
                      </div>
                      <div>
                        <dt>Mês</dt>
                        <dd>
                          {numberFormatter.format(telemetry.monthEnergyKwh)} kWh
                        </dd>
                      </div>
                      <div>
                        <dt>Total</dt>
                        <dd>
                          {numberFormatter.format(telemetry.allEnergyKwh)} kWh
                        </dd>
                      </div>
                    </dl>
                    <small>
                      {telemetry.updateTime
                        ? `Atualizado em ${telemetry.updateTime}`
                        : "Sem data de atualização"}
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
                <p>Status dos dataloggers. Coletor offline = usina sem enviar dados.</p>
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
            ) : (
              <DataTable
                columns={coletorColumns}
                rows={coletores}
                rowKey={(c) => c.sn}
                fileName="coletores"
                initialSort={{ key: "status", dir: "asc" }}
                emptyMessage="Nenhum coletor retornado pela SolisCloud."
              />
            )}
          </section>

          <section className="dashboard-grid">
            {stations.isPending ? (
              <PanelSkeleton title="Energia de hoje por usina" />
            ) : stations.isError ? (
              <ErrorState
                title="Energia de hoje por usina"
                error={stations.error}
                onRetry={() => stations.refetch()}
              />
            ) : (
              <BarList
                title="Energia de hoje por usina"
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
            ) : (
              <DataTable
                columns={inverterColumns}
                rows={inverterList}
                rowKey={(i) => i.id}
                fileName="inversores"
                emptyMessage="Nenhum inversor retornado."
              />
            )}
          </section>
        </>
      ) : (
        <>
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Potência da frota (24h)</h2>
                <p>Histórico coletado no banco a cada ~10 min — cresce ao longo do tempo.</p>
              </div>
            </div>
            {historico.isPending ? (
              <p style={loadingStyle}>Carregando histórico…</p>
            ) : !historico.data || historico.data.points.length < 2 ? (
              <p style={loadingStyle}>
                Coletando dados… a curva aparece conforme o worker roda (a cada
                ~10 min).
              </p>
            ) : (
              <GenerationChart series={historico.data} />
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Disponibilidade dos coletores (24h)</h2>
                <p>% do tempo online no período, do histórico no banco — pior no topo.</p>
              </div>
            </div>
            {uptime.isPending ? (
              <p style={loadingStyle}>Carregando disponibilidade…</p>
            ) : !uptime.data || uptime.data.length === 0 ? (
              <p style={loadingStyle}>
                Coletando dados… a disponibilidade aparece conforme o worker roda.
              </p>
            ) : (
              <DataTable
                columns={uptimeColumns}
                rows={uptime.data}
                rowKey={(c) => c.sn}
                fileName="uptime-coletores"
                initialSort={{ key: "uptime", dir: "asc" }}
                emptyMessage="Sem dados de disponibilidade."
              />
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Histórico de alarmes</h2>
                <p>Todos os alarmes já registrados, mais recentes primeiro.</p>
              </div>
            </div>
            {histAlarmes.isPending ? (
              <p style={loadingStyle}>Carregando histórico…</p>
            ) : !histAlarmes.data || histAlarmes.data.length === 0 ? (
              <EmptyState message="Nenhum alarme registrado." />
            ) : (
              <DataTable
                columns={alarmeColumns}
                rows={histAlarmes.data}
                rowKey={(a) => a.alarmId}
                fileName="alarmes"
                emptyMessage="Nenhum alarme."
              />
            )}
          </section>
        </>
      )}
    </>
  );
}
