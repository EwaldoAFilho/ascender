"use client";

import { useMemo, useState } from "react";
import { DataTable, type DataColumn } from "@/components/DataTable";
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

const columns: DataColumn<RateioDgRow>[] = [
  {
    key: "competencia",
    header: "Competência",
    value: (r) => r.competencia,
    exportValue: (r) => formatCompetencia(r.competencia),
    render: (r) => formatCompetencia(r.competencia),
  },
  { key: "usina", header: "Usina", value: (r) => r.usinaNome ?? "" },
  { key: "uc", header: "UC", value: (r) => r.installation },
  { key: "cliente", header: "Cliente", value: (r) => r.ownerName ?? "" },
  {
    key: "cota",
    header: "Cota",
    align: "right",
    value: (r) => r.percentual,
    render: (r) => pct(r.percentual),
  },
  {
    key: "consumo",
    header: "Consumo",
    align: "right",
    value: (r) => r.consumoKwh,
    render: (r) => kwh(r.consumoKwh),
  },
  {
    key: "creditos",
    header: "Créditos acum.",
    align: "right",
    value: (r) => r.creditosAcumulados,
    render: (r) => kwh(r.creditosAcumulados),
  },
];

export function RateioDgTable({ rows }: { rows: RateioDgRow[] }) {
  const [competencia, setCompetencia] = useState("");
  const [usina, setUsina] = useState("");

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
          (!usina || r.usinaNome === usina),
      ),
    [rows, competencia, usina],
  );

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Rateio por unidade consumidora</h2>
          <p>Dados reais do Digital Grid. Ordene as colunas e exporte Excel/PDF.</p>
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
      </div>

      <DataTable
        columns={columns}
        rows={filtradas}
        rowKey={(r) => r.id}
        fileName="rateio"
        initialSort={{ key: "competencia", dir: "desc" }}
        emptyMessage="Nenhuma cota para os filtros selecionados."
      />
    </section>
  );
}
