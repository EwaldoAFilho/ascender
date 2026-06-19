"use client";

import { useMemo, useState } from "react";
import { formatCompetencia, moneyFormatter } from "@/lib/dashboard-data";

export type FaturaDgRow = {
  id: string;
  competencia: string;
  installationNumber: string | null;
  installationClass: string | null;
  paymentStatus: string;
  valorTotal: number;
  valorPago: number;
  economia: number;
  consumoKwh: number;
  vencimento: string | null;
  pagoEm: string | null;
};

function statusClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("pago")) return "status-pago";
  if (s.includes("venc") || s.includes("atras")) return "status-vencido";
  if (s.includes("cancel") || s.includes("negativ")) return "status-offline";
  return "status-aguardando";
}

const kwh = (n: number) =>
  `${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} kWh`;

export function FaturasDgTable({ rows }: { rows: FaturaDgRow[] }) {
  const [competencia, setCompetencia] = useState("");
  const [status, setStatus] = useState("");
  const [busca, setBusca] = useState("");

  const competencias = useMemo(
    () => [...new Set(rows.map((r) => r.competencia).filter(Boolean))].sort().reverse(),
    [rows],
  );
  const statuses = useMemo(
    () => [...new Set(rows.map((r) => r.paymentStatus).filter(Boolean))].sort(),
    [rows],
  );

  const filtradas = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!competencia || r.competencia === competencia) &&
          (!status || r.paymentStatus === status) &&
          (!busca ||
            (r.installationNumber ?? "").toLowerCase().includes(busca.toLowerCase())),
      ),
    [rows, competencia, status, busca],
  );

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Faturas (Digital Grid)</h2>
          <p>
            {filtradas.length} de {rows.length} fatura(s) — dados reais, somente
            leitura.
          </p>
        </div>
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
          <span>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Instalação (UC)</span>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar código da UC"
          />
        </label>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Competência</th>
              <th>Instalação</th>
              <th>Classe</th>
              <th style={{ textAlign: "right" }}>Consumo</th>
              <th style={{ textAlign: "right" }}>Valor</th>
              <th style={{ textAlign: "right" }}>Pago</th>
              <th style={{ textAlign: "right" }}>Economia</th>
              <th>Vencimento</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((r) => (
              <tr key={r.id}>
                <td>{formatCompetencia(r.competencia)}</td>
                <td>{r.installationNumber ?? "-"}</td>
                <td>{r.installationClass ?? "-"}</td>
                <td style={{ textAlign: "right" }}>{kwh(r.consumoKwh)}</td>
                <td style={{ textAlign: "right" }}>
                  {moneyFormatter.format(r.valorTotal)}
                </td>
                <td style={{ textAlign: "right" }}>
                  {moneyFormatter.format(r.valorPago)}
                </td>
                <td style={{ textAlign: "right" }}>
                  {moneyFormatter.format(r.economia)}
                </td>
                <td>{r.vencimento ?? "-"}</td>
                <td>
                  <span className={`status ${statusClass(r.paymentStatus)}`}>
                    {r.paymentStatus || "-"}
                  </span>
                </td>
              </tr>
            ))}
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", color: "var(--muted)" }}>
                  Nenhuma fatura para os filtros selecionados.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
