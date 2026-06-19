"use client";

import { useEffect, useState } from "react";
import { GenerationChart } from "@/components/GenerationChart";
import { ErrorState } from "@/components/states";
import { useGeneration, useStations } from "@/hooks/useSolis";
import type { GenerationPeriod } from "@/lib/api/soliscloud";
import { moneyFormatter, numberFormatter } from "@/lib/dashboard-data";

const PERIODS: Array<{ id: GenerationPeriod; label: string }> = [
  { id: "day", label: "Dia" },
  { id: "month", label: "Mês" },
  { id: "year", label: "Ano" },
];

const loadingStyle = { color: "var(--muted)", margin: 0 } as const;

export default function GeracaoPage() {
  const stations = useStations();
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
            <div className="summary-list" style={{ marginTop: 14 }}>
              {gen.data.unit === "kW" && gen.data.peakKw != null ? (
                <div>
                  <span>Pico do dia</span>
                  <strong>{numberFormatter.format(gen.data.peakKw)} kW</strong>
                </div>
              ) : null}
              {gen.data.totalKwh != null ? (
                <div>
                  <span>Total no período</span>
                  <strong>
                    {numberFormatter.format(gen.data.totalKwh)} kWh
                  </strong>
                </div>
              ) : null}
              {gen.data.totalMoney != null ? (
                <div>
                  <span>Receita estimada (SolisCloud)</span>
                  <strong>{moneyFormatter.format(gen.data.totalMoney)}</strong>
                </div>
              ) : null}
            </div>
          </>
        )}
      </section>
    </>
  );
}
