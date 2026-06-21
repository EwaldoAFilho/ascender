"use client";

import { useEffect, useState } from "react";
import { DataTable, type DataColumn } from "@/components/DataTable";
import { GenerationChart } from "@/components/GenerationChart";
import { SummaryStrip, type SummaryItem } from "@/components/SummaryStrip";
import { ErrorState } from "@/components/states";
import { useGeneration, useGeracaoDiaria, useStations } from "@/hooks/useSolis";
import type { GenerationPeriod } from "@/lib/api/soliscloud";
import type { GeracaoDia } from "@/lib/soliscloud/telemetria-db";
import { formatData, moneyFormatter, numberFormatter } from "@/lib/dashboard-data";

const PERIODS: Array<{ id: GenerationPeriod; label: string }> = [
  { id: "day", label: "Dia" },
  { id: "month", label: "Mês" },
  { id: "year", label: "Ano" },
];

const loadingStyle = { color: "var(--muted)", margin: 0 } as const;

const geracaoDiaColumns: DataColumn<GeracaoDia>[] = [
  {
    key: "dia",
    header: "Dia",
    value: (r) => r.dia,
    render: (r) => formatData(r.dia),
  },
  {
    key: "realizado",
    header: "Realizado",
    align: "right",
    value: (r) => r.realizado,
    render: (r) => `${numberFormatter.format(r.realizado)} kWh`,
  },
  {
    key: "meta",
    header: "Meta (dia)",
    align: "right",
    value: (r) => r.esperado,
    render: (r) => `${numberFormatter.format(r.esperado)} kWh`,
  },
  {
    key: "aderencia",
    header: "Aderência",
    align: "right",
    value: (r) => r.aderenciaPct ?? 0,
    render: (r) =>
      r.aderenciaPct == null ? (
        "—"
      ) : (
        <span
          className={
            r.aderenciaPct >= 100
              ? "positive-value"
              : r.aderenciaPct < 70
                ? "negative-value"
                : ""
          }
        >
          {numberFormatter.format(r.aderenciaPct)}%
        </span>
      ),
  },
];

export default function GeracaoPage() {
  const stations = useStations();
  const geracaoDia = useGeracaoDiaria();
  const [stationId, setStationId] = useState("");
  const [period, setPeriod] = useState<GenerationPeriod>("day");

  useEffect(() => {
    if (!stationId && stations.data && stations.data.length > 0) {
      setStationId(stations.data[0].stationId);
    }
  }, [stations.data, stationId]);

  const gen = useGeneration(stationId || undefined, period);
  const station = stations.data?.find((s) => s.stationId === stationId);
  const tituloPeriodo =
    period === "day"
      ? "curva de potência do dia (kW)"
      : period === "month"
        ? "geração diária do mês (kWh)"
        : "geração mensal do ano (kWh)";

  const indicadores: SummaryItem[] = [];
  if (gen.data) {
    if (gen.data.unit === "kW" && gen.data.peakKw != null) {
      indicadores.push({
        label: "Pico do dia",
        value: `${numberFormatter.format(gen.data.peakKw)} kW`,
      });
    }
    if (gen.data.totalKwh != null) {
      indicadores.push({
        label: "Total no período",
        value: `${numberFormatter.format(gen.data.totalKwh)} kWh`,
        tone: "ok",
      });
    }
    if (gen.data.totalMoney != null) {
      indicadores.push({
        label: "Receita estimada",
        value: moneyFormatter.format(gen.data.totalMoney),
        hint: "estimada pela SolisCloud",
        tone: "ok",
      });
    }
  }

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Histórico de geração</h2>
            <p>Curva e produção por usina, direto da SolisCloud (somente leitura).</p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <label className="form-field" style={{ minWidth: 240, flex: "1 1 240px" }}>
            <span>Usina</span>
            <select
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
            >
              {(stations.data ?? []).map((s) => (
                <option key={s.stationId} value={s.stationId}>
                  {s.stationName ?? s.stationId}
                </option>
              ))}
            </select>
          </label>
          <div
            className="registry-tabs"
            style={{ marginBottom: 0 }}
            aria-label="Período"
          >
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={period === p.id ? "active" : ""}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              {station?.stationName ?? "Usina"} — {tituloPeriodo}
            </h2>
          </div>
        </div>

        {!stationId ? (
          <p style={loadingStyle}>Selecione uma usina.</p>
        ) : gen.isPending ? (
          <p style={loadingStyle}>Carregando…</p>
        ) : gen.isError ? (
          <ErrorState error={gen.error} onRetry={() => gen.refetch()} />
        ) : !gen.data || gen.data.points.length === 0 ? (
          <p style={loadingStyle}>Sem dados de geração no período.</p>
        ) : (
          <>
            <GenerationChart series={gen.data} />
            {indicadores.length > 0 ? (
              <div style={{ marginTop: 14 }}>
                <SummaryStrip items={indicadores} />
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Geração diária da frota (realizado × meta)</h2>
            <p>Do histórico no banco — pior aderência no topo; cresce a cada dia.</p>
          </div>
        </div>
        {geracaoDia.isPending ? (
          <p style={loadingStyle}>Carregando…</p>
        ) : !geracaoDia.data || geracaoDia.data.length === 0 ? (
          <p style={loadingStyle}>
            Coletando dados… aparece a partir do primeiro dia com coleta.
          </p>
        ) : (
          <DataTable
            columns={geracaoDiaColumns}
            rows={geracaoDia.data}
            rowKey={(r) => r.dia}
            fileName="geracao-diaria"
            initialSort={{ key: "dia", dir: "desc" }}
            emptyMessage="Sem dados."
          />
        )}
      </section>
    </>
  );
}
