import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

/**
 * Comparação Realizado × Meta (esperado) — leitura executiva. Apresentação pura
 * (não busca dados). Duas barras + delta percentual. Estado vazio quando não há
 * meta (`esperado <= 0`) — **não inventa meta**. Tema claro/escuro via tokens.
 */
export function ComparisonChart({
  realizado,
  esperado,
  unidade = "kWh",
  realizadoLabel = "Realizado",
  esperadoLabel = "Meta até hoje",
  emptyMessage = "Defina a meta de geração das usinas para comparar.",
}: {
  realizado: number;
  esperado: number;
  unidade?: string;
  realizadoLabel?: string;
  esperadoLabel?: string;
  emptyMessage?: string;
}) {
  if (!(esperado > 0)) {
    return <p className="cmp-empty">{emptyMessage}</p>;
  }

  const max = Math.max(realizado, esperado, 1);
  const pct = (realizado / esperado) * 100 - 100; // delta vs meta
  const tone = pct >= 0 ? "ok" : pct >= -15 ? "warn" : "bad";
  const DeltaIcon = pct > 0.5 ? ArrowUpRight : pct < -0.5 ? ArrowDownRight : Minus;
  const deltaTxt = `${pct >= 0 ? "+" : ""}${fmt(pct)}% ${
    pct >= 0 ? "acima da meta" : "abaixo da meta"
  }`;

  return (
    <div className="comparison-chart">
      <div className="cmp-row">
        <span className="cmp-label">{realizadoLabel}</span>
        <div className="cmp-track">
          <span
            className={`cmp-fill is-real tone-${tone}`}
            style={{ width: `${Math.max((realizado / max) * 100, 2)}%` }}
          />
        </div>
        <strong className="cmp-value">
          {fmt(realizado)} {unidade}
        </strong>
      </div>

      <div className="cmp-row">
        <span className="cmp-label">{esperadoLabel}</span>
        <div className="cmp-track">
          <span
            className="cmp-fill is-meta"
            style={{ width: `${Math.max((esperado / max) * 100, 2)}%` }}
          />
        </div>
        <strong className="cmp-value">
          {fmt(esperado)} {unidade}
        </strong>
      </div>

      <div className={`cmp-delta tone-${tone}`}>
        <DeltaIcon size={15} />
        {deltaTxt}
      </div>
    </div>
  );
}
