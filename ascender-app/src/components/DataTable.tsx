"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  FileDown,
  FileSpreadsheet,
  Search,
} from "lucide-react";

export type DataColumn<T> = {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  sortable?: boolean; // default true
  exportable?: boolean; // default true
  /** Valor usado para ordenar e buscar. */
  value: (row: T) => string | number;
  /** Valor exportado (default: o próprio value) — ex.: data formatada DD/MM/AAAA. */
  exportValue?: (row: T) => string | number;
  /** Conteúdo exibido na célula (default: o próprio value). */
  render?: (row: T) => ReactNode;
};

type Props<T> = {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  fileName?: string;
  searchable?: boolean;
  pageSize?: number; // 0 = sem paginação
  emptyMessage?: string;
  initialSort?: { key: string; dir: "asc" | "desc" };
};

function compareValues(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "pt-BR", { numeric: true });
}

function todayStamp(): string {
  try {
    return new Date().toISOString().slice(0, 10);
  } catch {
    return "export";
  }
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  fileName = "dados",
  searchable = true,
  pageSize = 25,
  emptyMessage = "Nenhum registro.",
  initialSort,
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(initialSort?.key ?? null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSort?.dir ?? "asc");
  const [page, setPage] = useState(0);

  const exportCols = columns.filter((c) => c.exportable !== false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      exportCols.some((c) => String(c.value(r)).toLowerCase().includes(q)),
    );
  }, [rows, query, exportCols]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => dir * compareValues(col.value(a), col.value(b)));
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages - 1);
  const visible =
    pageSize > 0
      ? sorted.slice(safePage * pageSize, safePage * pageSize + pageSize)
      : sorted;

  function toggleSort(col: DataColumn<T>) {
    if (col.sortable === false) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir("asc");
    }
    setPage(0);
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const header = exportCols.map((c) => c.header);
    const body = sorted.map((r) =>
      exportCols.map((c) => (c.exportValue ?? c.value)(r)),
    );
    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    XLSX.writeFile(wb, `${fileName}-${todayStamp()}.xlsx`);
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const landscape = exportCols.length > 6;
    const doc = new jsPDF({ orientation: landscape ? "landscape" : "portrait" });
    doc.setFontSize(13);
    doc.text(fileName, 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [exportCols.map((c) => c.header)],
      body: sorted.map((r) =>
        exportCols.map((c) => String((c.exportValue ?? c.value)(r))),
      ),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [22, 101, 52] },
    });
    doc.save(`${fileName}-${todayStamp()}.pdf`);
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        {searchable ? (
          <label
            className="form-field"
            style={{ position: "relative", maxWidth: 280, flex: "1 1 220px", margin: 0 }}
          >
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted)",
              }}
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Buscar…"
              style={{ paddingLeft: 32 }}
            />
          </label>
        ) : (
          <span />
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={exportExcel}
            disabled={sorted.length === 0}
            title="Exportar Excel"
          >
            <FileSpreadsheet size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
            Excel
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={exportPdf}
            disabled={sorted.length === 0}
            title="Exportar PDF"
          >
            <FileDown size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
            PDF
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col) => {
                const active = sortKey === col.key;
                const sortable = col.sortable !== false;
                return (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col)}
                    style={{
                      textAlign: col.align ?? "left",
                      cursor: sortable ? "pointer" : "default",
                      whiteSpace: "nowrap",
                      userSelect: "none",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        justifyContent:
                          col.align === "right"
                            ? "flex-end"
                            : col.align === "center"
                              ? "center"
                              : "flex-start",
                      }}
                    >
                      {col.header}
                      {sortable ? (
                        active ? (
                          sortDir === "asc" ? (
                            <ArrowUp size={13} />
                          ) : (
                            <ArrowDown size={13} />
                          )
                        ) : (
                          <ArrowUpDown size={13} style={{ opacity: 0.4 }} />
                        )
                      ) : null}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ color: "var(--muted)", textAlign: "center" }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visible.map((row, i) => (
                <tr key={rowKey(row, i)}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      data-label={col.header}
                      style={{ textAlign: col.align ?? "left" }}
                    >
                      {col.render ? col.render(row) : col.value(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
          color: "var(--muted)",
          fontSize: 13,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span>{sorted.length} registro(s)</span>
        {pageSize > 0 && totalPages > 1 ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
            >
              Anterior
            </button>
            Página {safePage + 1} de {totalPages}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
            >
              Próxima
            </button>
          </span>
        ) : null}
      </div>
    </div>
  );
}
