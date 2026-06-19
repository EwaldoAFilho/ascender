"use client";

import { DataTable, type DataColumn } from "@/components/DataTable";
import { numberFormatter } from "@/lib/dashboard-data";

export type UsinaLinha = {
  id: string;
  nome: string;
  distribuidoraNome: string | null;
  vinculada: boolean;
  estacaoNome: string | null;
  potenciaKwp: number;
  potenciaAgoraKw: number | null;
  realizadoMesKwh: number | null;
  esperadoMesKwh: number | null;
  aderenciaPct: number | null;
  status: string;
  statusReal: string | null;
};

const n = (v: number) => numberFormatter.format(v);

const columns: DataColumn<UsinaLinha>[] = [
  { key: "nome", header: "Usina", value: (l) => l.nome },
  {
    key: "distribuidora",
    header: "Distribuidora",
    value: (l) => l.distribuidoraNome ?? "-",
  },
  {
    key: "solis",
    header: "SolisCloud",
    value: (l) => (l.vinculada ? (l.estacaoNome ?? "vinculada") : "não vinculada"),
    render: (l) =>
      l.vinculada ? (
        (l.estacaoNome ?? "vinculada")
      ) : (
        <span style={{ color: "var(--muted)" }}>não vinculada</span>
      ),
  },
  {
    key: "potencia",
    header: "Potência",
    align: "right",
    value: (l) => l.potenciaKwp,
    render: (l) => `${l.potenciaKwp} kWp`,
  },
  {
    key: "agora",
    header: "Agora",
    align: "right",
    value: (l) => l.potenciaAgoraKw ?? 0,
    render: (l) => (l.potenciaAgoraKw != null ? `${n(l.potenciaAgoraKw)} kW` : "-"),
  },
  {
    key: "realizado",
    header: "Mês real",
    align: "right",
    value: (l) => l.realizadoMesKwh ?? 0,
    render: (l) => (l.realizadoMesKwh != null ? `${n(l.realizadoMesKwh)} kWh` : "-"),
  },
  {
    key: "esperado",
    header: "Esperado",
    align: "right",
    value: (l) => l.esperadoMesKwh ?? 0,
    render: (l) => (l.esperadoMesKwh ? `${n(l.esperadoMesKwh)} kWh` : "-"),
  },
  {
    key: "aderencia",
    header: "Aderência",
    align: "right",
    value: (l) => l.aderenciaPct ?? 0,
    render: (l) => (l.aderenciaPct != null ? `${n(l.aderenciaPct)}%` : "-"),
  },
  {
    key: "status",
    header: "Status",
    value: (l) => l.statusReal ?? l.status,
    render: (l) => (
      <span className={`status status-${l.statusReal ?? l.status}`}>
        {l.statusReal ?? l.status}
      </span>
    ),
  },
];

export function UsinasTable({ linhas }: { linhas: UsinaLinha[] }) {
  const vinculadas = linhas.filter((l) => l.vinculada).length;
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Usinas monitoradas</h2>
          <p>Cadastro cruzado com a telemetria real da SolisCloud.</p>
        </div>
        <span>
          {vinculadas}/{linhas.length} vinculadas
        </span>
      </div>
      <DataTable
        columns={columns}
        rows={linhas}
        rowKey={(l) => l.id}
        fileName="usinas"
        pageSize={0}
        initialSort={{ key: "realizado", dir: "desc" }}
        emptyMessage="Nenhuma usina cadastrada."
      />
    </section>
  );
}
