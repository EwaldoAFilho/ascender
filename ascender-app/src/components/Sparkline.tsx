/**
 * Mini-gráfico de linha (sem eixos), leve e sem dependências — para cards e
 * células. Recebe uma série de números; ignora silenciosamente séries < 2.
 */
export function Sparkline({
  data,
  width = 104,
  height = 30,
  stroke = "var(--brand-yellow)",
  fill = true,
  strokeWidth = 1.75,
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: boolean;
  strokeWidth?: number;
}) {
  const pts = data.filter((n) => Number.isFinite(n));
  if (pts.length < 2) return null;

  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const pad = strokeWidth;
  const coords = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * (width - pad * 2) + pad;
    const y = height - pad - ((v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c[0].toFixed(1)} ${c[1].toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${(width - pad).toFixed(1)} ${height} L${pad.toFixed(1)} ${height} Z`;
  const gid = `spark-${pts.length}-${Math.round(min)}-${Math.round(max)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      style={{ display: "block" }}
    >
      {fill ? (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gid})`} stroke="none" />
        </>
      ) : null}
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
