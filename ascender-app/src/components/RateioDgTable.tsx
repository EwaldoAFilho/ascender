"use client";

import { useMemo, useState } from "react";
import { formatCompetencia } from "@/lib/dashboard-data";

export type RateioDgRow = {
  id: string;
  competencia: string;
  usinaNome: string | null;
  installation: string;
  ownerName: string | null;
  percentual: number;
  consumoKwh: number;
  creditosAcumulados: number;
};

const kwh = (n: number) =>
  `${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} kWh`;
const pct = (n: number) =>
  `${n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

export function RateioDgTable({ rows }: { rows: RateioDgRow[] }) {
  const [competencia, setCompetencia] = useState("");
  const [usina, setUsina] = useState("");
  const [busca, setBusca] = useState("");

  const competencias = useMemo(
    () => [...new Set(rows.map((r) => r.competencia).filter(Boolean))].sort().reverse(),
    [rows],
  );
  const usinas = useMemo(
    () => [...new Set(rows.map((r) => r.usinaNome).filter(Boolean) as string[])].sort(),
    [rows],
  );

  const filtradas = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!competencia || r.competencia === competencia) &&
          (!usina || r.usinaNome === usina) &&
          (!busca ||
            r.installation.toLowerCase().includes(busca.toLowerCase()) ||
            (r.ownerName ?? "").toLowerCase().includes(busca.toLowerCase())),
      ),
    [rows, competencia, usina, busca],
  );

  const somaConsumo = filtradas.reduce((s, r) => s + r.consumoKwh, 0);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Rateio por unidade consumidora</h2>
          <p>
            {filtradas.length} de {rows.length} cota(s) — dados reais do Digital
            Grid, somente leitura.
          </p>
        </div>
        <span>{kwh(somaConsumo)} de consumo</span>
      </div>

      <div
        className="form-grid"
        style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 16 }}
      >
        <label className="form-field">
          <span>Competência</span>
          <select value={competencia} onChange={(e) => setCompetencia(e.target.value)}>
            <option value="">Todas</option>
            {competencias.map((c) => (
              <option key={c} value={c}>
                {formatCompetencia(c)}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Usina</span>
          <select value={usina} onChange={(e) => setUsina(e.target.value)}>
            <option value="">Todas</option>
            {usinas.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>UC ou cliente</span>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar UC ou cliente"
          />
        </label>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Competência</th>
              <th>Usina</th>
              <th>UC</th>
              <th>Cliente</th>
              <th style={{ textAlign: "right" }}>Cota</th>
              <th style={{ textAlign: "right" }}>Consumo</th>
              <th style={{ textAlign: "right" }}>Créditos acum.</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((r) => (
              <tr key={r.id}>
                <td>{formatCompetencia(r.competencia)}</td>
                <td>{r.usinaNome ?? "-"}</td>
                <td>{r.installation || "-"}</td>
                <td>{r.ownerName ?? "-"}</td>
                <td style={{ textAlign: "right" }}>{pct(r.percentual)}</td>
                <td style={{ textAlign: "right" }}>{kwh(r.consumoKwh)}</td>
                <td style={{ textAlign: "right" }}>{kwh(r.creditosAcumulados)}</td>
              </tr>
            ))}
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)" }}>
                  Nenhuma cota para os filtros selecionados.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
