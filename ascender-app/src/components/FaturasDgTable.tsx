"use client";

import { useMemo, useState } from "react";
import { DataTable, type DataColumn } from "@/components/DataTable";
import {
  formatCompetencia,
  formatData,
  moneyFormatter,
} from "@/lib/dashboard-data";

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

const columns: DataColumn<FaturaDgRow>[] = [
  {
    key: "competencia",
    header: "Competência",
    value: (r) => r.competencia,
    exportValue: (r) => formatCompetencia(r.competencia),
    render: (r) => formatCompetencia(r.competencia),
  },
  {
    key: "installation",
    header: "Instalação",
    value: (r) => r.installationNumber ?? "",
  },
  {
    key: "classe",
    header: "Classe",
    value: (r) => r.installationClass ?? "",
  },
  {
    key: "consumo",
    header: "Consumo",
    align: "right",
    value: (r) => r.consumoKwh,
    render: (r) => kwh(r.consumoKwh),
  },
  {
    key: "valor",
    header: "Valor",
    align: "right",
    value: (r) => r.valorTotal,
    render: (r) => moneyFormatter.format(r.valorTotal),
  },
  {
    key: "pago",
    header: "Pago",
    align: "right",
    value: (r) => r.valorPago,
    render: (r) => moneyFormatter.format(r.valorPago),
  },
  {
    key: "economia",
    header: "Economia",
    align: "right",
    value: (r) => r.economia,
    render: (r) => moneyFormatter.format(r.economia),
  },
  {
    key: "vencimento",
    header: "Vencimento",
    value: (r) => r.vencimento ?? "",
    exportValue: (r) => formatData(r.vencimento),
    render: (r) => formatData(r.vencimento),
  },
  {
    key: "status",
    header: "Status",
    value: (r) => r.paymentStatus,
    render: (r) => (
      <span className={`status ${statusClass(r.paymentStatus)}`}>
        {r.paymentStatus || "-"}
      </span>
    ),
  },
];

export function FaturasDgTable({ rows }: { rows: FaturaDgRow[] }) {
  const [competencia, setCompetencia] = useState("");
  const [status, setStatus] = useState("");

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
          (!status || r.paymentStatus === status),
      ),
    [rows, competencia, status],
  );

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Faturas (Digital Grid)</h2>
          <p>Dados reais, somente leitura. Ordene as colunas e exporte Excel/PDF.</p>
        </div>
      </div>

      <div
        className="form-grid"
        style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))", marginBottom: 16 }}
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
      </div>

      <DataTable
        columns={columns}
        rows={filtradas}
        rowKey={(r) => r.id}
        fileName="faturas"
        initialSort={{ key: "competencia", dir: "desc" }}
        emptyMessage="Nenhuma fatura para os filtros selecionados."
      />
    </section>
  );
}
