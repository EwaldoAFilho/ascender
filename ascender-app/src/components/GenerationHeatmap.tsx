import { Fragment } from "react";
import { formatCompetencia } from "@/lib/dashboard-data";

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

/** Cor da célula por intensidade relativa (rampa única). null = sem dado. */
function cellStyle(value: number | null, max: number): React.CSSProperties {
  if (value == null) return { background: "var(--surface-soft)" };
  const intensity = max > 0 ? value / max : 0;
  const pct = 12 + intensity * 88; // 12%..100% — garante visibilidade do mínimo
  return {
    background: `color-mix(in srgb, var(--brand-gold) ${pct}%, var(--surface-soft))`,
  };
}

/**
 * Heatmap de geração (usina × competência). Apresentação pura — recebe a matriz
 * já montada (sem buscar dados, sem interpolar). Célula sem registro = "sem dado"
 * (neutra, não zero). Rampa única + legenda. Responsivo (scroll-x). Tema via
 * tokens.
 */
export function GenerationHeatmap({
  columns,
  rows,
  currentCompetencia,
  unidade = "kWh",
  emptyMessage = "Sem geração registrada ainda para montar o mapa.",
}: {
  columns: string[];
  rows: { usina: string; valores: (number | null)[] }[];
  currentCompetencia?: string;
  unidade?: string;
  emptyMessage?: string;
}) {
  if (columns.length === 0 || rows.length === 0) {
    return <p className="hm-empty">{emptyMessage}</p>;
  }

  const max = Math.max(
    1,
    ...rows.flatMap((r) => r.valores.filter((v): v is number => v != null)),
  );

  const colLabel = (c: string) =>
    `${formatCompetencia(c)}${c === currentCompetencia ? " (parcial)" : ""}`;

  return (
    <div className="heatmap">
      <div className="heatmap-scroll">
        <div
          className="heatmap-grid"
          style={{
            gridTemplateColumns: `minmax(120px, max-content) repeat(${columns.length}, minmax(46px, 1fr))`,
          }}
        >
          <span className="hm-corner" />
          {columns.map((c) => (
            <span key={c} className="hm-colhead">
              {colLabel(c)}
            </span>
          ))}

          {rows.map((r) => (
            <Fragment key={r.usina}>
              <span className="hm-rowhead" title={r.usina}>
                {r.usina}
              </span>
              {r.valores.map((v, i) => (
                <span
                  key={columns[i]}
                  className={`hm-cell${v == null ? " is-empty" : ""}`}
                  style={cellStyle(v, max)}
                  title={`${r.usina} · ${colLabel(columns[i])}: ${
                    v == null ? "sem dado" : `${fmt(v)} ${unidade}`
                  }`}
                >
                  {v == null ? "·" : ""}
                </span>
              ))}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="hm-legend">
        <span className="hm-legend-swatch is-empty" /> sem dado
        <span className="hm-legend-label">menor</span>
        <span className="hm-legend-bar" />
        <span className="hm-legend-label">
          maior ({fmt(max)} {unidade})
        </span>
      </div>
    </div>
  );
}
