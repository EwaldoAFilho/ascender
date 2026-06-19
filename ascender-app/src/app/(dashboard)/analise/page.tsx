"use client";

import { useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { X } from "lucide-react";
import { SummaryStrip, type SummaryItem } from "@/components/SummaryStrip";
import { EmptyState, ErrorState } from "@/components/states";
import { useStations } from "@/hooks/useSolis";
import { numberFormatter } from "@/lib/dashboard-data";
import type { SolisTelemetry } from "@/types/soliscloud";

type Periodo = "day" | "month" | "year";
const PERIODOS: Array<{ id: Periodo; label: string }> = [
  { id: "day", label: "Hoje" },
  { id: "month", label: "Este mês" },
  { id: "year", label: "Este ano" },
];

const PALETTE = [
  "#f5b700",
  "#4a8fc2",
  "#c9a227",
  "#2a9d8f",
  "#e76f51",
  "#7aa6c2",
  "#9b7ede",
  "#f59e0b",
];
const MUTED = "#3a4a52";

const nivoTheme = {
  text: { fill: "#8aa0ab", fontSize: 12 },
  axis: {
    ticks: { text: { fill: "#8aa0ab" } },
    legend: { text: { fill: "#8aa0ab" } },
  },
  grid: { line: { stroke: "rgba(125,144,155,0.18)" } },
  tooltip: {
    container: {
      background: "var(--surface)",
      color: "var(--ink)",
      border: "1px solid var(--line)",
      borderRadius: 8,
      fontSize: 12,
    },
  },
} as const;

function energyOf(s: SolisTelemetry, period: Periodo): number {
  if (period === "day") return s.dayEnergyKwh;
  if (period === "month") return s.monthEnergyKwh;
  return s.yearEnergyKwh;
}

export default function AnalisePage() {
  const stations = useStations();
  const [period, setPeriod] = useState<Periodo>("month");
  const [selected, setSelected] = useState<string | null>(null);

  const list = stations.data ?? [];
  const nomeDe = (s: SolisTelemetry) => s.stationName ?? s.stationId;
  const nomes = list.map(nomeDe);

  const colorFor = (nome: string) => {
    const base = PALETTE[Math.max(0, nomes.indexOf(nome)) % PALETTE.length];
    return selected && selected !== nome ? MUTED : base;
  };
  const toggle = (nome: string) =>
    setSelected((cur) => (cur === nome ? null : nome));

  const barData = list.map((s) => ({
    usina: nomeDe(s),
    valor: Math.round(energyOf(s, period)),
  }));
  const pieData = list
    .map((s) => ({
      id: nomeDe(s),
      label: nomeDe(s),
      value: Math.round(energyOf(s, period)),
    }))
    .filter((d) => d.value > 0);

  const sel = selected ? list.find((s) => nomeDe(s) === selected) : undefined;
  const geracao = sel
    ? energyOf(sel, period)
    : list.reduce((acc, s) => acc + energyOf(s, period), 0);
  const potencia = sel
    ? sel.currentPowerKw
    : list.reduce((acc, s) => acc + s.currentPowerKw, 0);
  const periodoLabel =
    PERIODOS.find((p) => p.id === period)?.label.toLowerCase() ?? "";

  const kpis: SummaryItem[] = [
    {
      label: sel ? `Geração — ${selected}` : "Geração no período",
      value: `${numberFormatter.format(geracao)} kWh`,
      hint: periodoLabel,
      tone: "ok",
    },
    {
      label: "Potência agora",
      value: `${numberFormatter.format(potencia)} kW`,
      hint: sel ? "da usina filtrada" : "soma das usinas",
    },
    {
      label: "Usinas",
      value: String(sel ? 1 : list.length),
      hint: sel ? "filtrada" : "no portfólio",
    },
  ];

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Análise de geração</h2>
            <p>Clique numa usina (barra ou rosca) para filtrar os indicadores.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {selected ? (
              <span
                className="status status-aguardando"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {selected}
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Limpar filtro"
                  style={{
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                    color: "inherit",
                    display: "inline-flex",
                  }}
                >
                  <X size={14} />
                </button>
              </span>
            ) : null}
            <div className="registry-tabs" style={{ marginBottom: 0 }}>
              {PERIODOS.map((p) => (
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
        </div>

        {stations.isError ? (
          <ErrorState error={stations.error} onRetry={() => stations.refetch()} />
        ) : null}
      </section>

      <SummaryStrip items={kpis} />

      <section className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Geração por usina ({periodoLabel})</h2>
          </div>
          {stations.isPending ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>Carregando…</p>
          ) : list.length === 0 ? (
            <EmptyState message="Sem usinas." />
          ) : (
            <div style={{ height: 360 }}>
              <ResponsiveBar
                data={barData}
                keys={["valor"]}
                indexBy="usina"
                margin={{ top: 10, right: 16, bottom: 86, left: 64 }}
                padding={0.3}
                colors={(bar) => colorFor(String(bar.indexValue))}
                enableLabel={false}
                axisBottom={{ tickRotation: -35 }}
                theme={nivoTheme}
                onClick={(bar) => toggle(String(bar.indexValue))}
                tooltip={({ indexValue, value }) => (
                  <div style={{ padding: "6px 10px" }}>
                    <strong>{indexValue}</strong>: {numberFormatter.format(value)}{" "}
                    kWh
                  </div>
                )}
              />
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Participação na geração</h2>
          </div>
          {stations.isPending ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>Carregando…</p>
          ) : pieData.length === 0 ? (
            <EmptyState message="Sem geração no período." />
          ) : (
            <div style={{ height: 360 }}>
              <ResponsivePie
                data={pieData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                innerRadius={0.6}
                padAngle={0.6}
                cornerRadius={3}
                colors={(d) => colorFor(String(d.id))}
                enableArcLinkLabels={false}
                arcLabelsTextColor="#061620"
                theme={nivoTheme}
                onClick={(d) => toggle(String(d.id))}
                tooltip={({ datum }) => (
                  <div style={{ padding: "6px 10px" }}>
                    <strong>{datum.id}</strong>:{" "}
                    {numberFormatter.format(datum.value)} kWh
                  </div>
                )}
              />
            </div>
          )}
        </section>
      </section>
    </>
  );
}
