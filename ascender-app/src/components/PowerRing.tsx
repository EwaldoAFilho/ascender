// Anel de carga (PowerRing) — arco amarelo→ouro preenchendo uma proporção.
// No Início mede potência atual / capacidade instalada; no Executivo, aderência.
// Server component puro (SVG); o halo é CSS e respeita prefers-reduced-motion.

type Tone = "brand" | "ok" | "warn" | "bad";

const R = 52;
const C = 2 * Math.PI * R;

export function PowerRing({
  pct,
  centerValue,
  unit,
  sublabel,
  pulse = false,
  tone = "brand",
}: {
  pct: number;
  centerValue: string;
  unit: string;
  sublabel?: string;
  pulse?: boolean;
  tone?: Tone;
}) {
  const clamped = Math.max(0, Math.min(pct, 100));
  const offset = C * (1 - clamped / 100);
  const toneClass =
    tone === "ok" ? "is-ok" : tone === "warn" ? "is-warn" : tone === "bad" ? "is-bad" : "";

  return (
    <div className={`power-ring${pulse ? " is-live" : ""}`}>
      <svg viewBox="0 0 120 120" role="img" aria-label={`${centerValue} ${unit}`}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand-yellow)" />
            <stop offset="100%" stopColor="var(--brand-gold)" />
          </linearGradient>
        </defs>
        <circle className="ring-track" cx="60" cy="60" r={R} fill="none" strokeWidth="11" />
        <circle
          className={`ring-fill ${toneClass}`}
          cx="60"
          cy="60"
          r={R}
          fill="none"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="ring-center">
        <span className="ring-value">{centerValue}</span>
        <span className="ring-unit">{unit}</span>
      </div>
      {sublabel ? <p className="ring-sub">{sublabel}</p> : null}
    </div>
  );
}
