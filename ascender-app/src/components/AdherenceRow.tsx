import { numberFormatter } from "@/lib/dashboard-data";

// Escala do trilho em 120% para a marca de meta (100%) ficar visível e os que
// superam a meta preencherem além dela.
const SCALE = 120;
const TARGET_LEFT = (100 / SCALE) * 100; // 83,33%

// Linha de aderência por usina: barra dupla (realizado preenchido + marca de meta).
export function AdherenceRow({
  nome,
  aderenciaPct,
  realizado,
  esperado,
}: {
  nome: string;
  aderenciaPct: number | null;
  realizado: number | null;
  esperado: number | null;
}) {
  const band =
    aderenciaPct == null
      ? "is-muted"
      : aderenciaPct >= 100
        ? "is-ok"
        : aderenciaPct >= 70
          ? ""
          : "is-bad";
  const fill =
    aderenciaPct == null ? 0 : (Math.min(Math.max(aderenciaPct, 0), SCALE) / SCALE) * 100;

  return (
    <div className={`adherence-row ${band}`}>
      <div className="adherence-top">
        <strong>{nome}</strong>
        <span>{aderenciaPct != null ? `${numberFormatter.format(aderenciaPct)}%` : "—"}</span>
      </div>
      <div className="dual-bar">
        <span className="fill" style={{ width: `${fill}%` }} />
        <span className="target" style={{ left: `${TARGET_LEFT}%` }} />
      </div>
      <small>
        {realizado != null
          ? `${numberFormatter.format(realizado)} de ${numberFormatter.format(esperado ?? 0)} kWh`
          : "sem telemetria"}
      </small>
    </div>
  );
}
