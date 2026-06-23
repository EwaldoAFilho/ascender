const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

// Bounding box aproximado do Brasil continental (lat/long).
const BBOX = { latMin: -33.8, latMax: 5.4, lonMin: -74.0, lonMax: -34.7 };
const W = 760;
const H = 760;
const PAD = 28;

export type MapPin = {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  potenciaKwp?: number | null;
  statusReal?: string | null;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function project(lat: number, lon: number): [number, number] {
  const x =
    PAD + ((lon - BBOX.lonMin) / (BBOX.lonMax - BBOX.lonMin)) * (W - 2 * PAD);
  const y =
    PAD + ((BBOX.latMax - lat) / (BBOX.latMax - BBOX.latMin)) * (H - 2 * PAD);
  return [clamp(x, 2, W - 2), clamp(y, 2, H - 2)];
}

function corStatus(status?: string | null): string {
  switch (status) {
    case "online":
      return "var(--sev-ok)";
    case "alarm":
      return "var(--sev-warning)";
    case "offline":
      return "var(--sev-critical)";
    default:
      return "var(--muted)";
  }
}

function rotuloStatus(status?: string | null): string {
  switch (status) {
    case "online":
      return "online";
    case "alarm":
      return "em alarme";
    case "offline":
      return "offline";
    default:
      return "sem telemetria";
  }
}

/**
 * Mapa SVG das usinas por pinos (lat/long persistidos). Apresentação pura — sem
 * tiles, sem API externa, sem geocodificação. Projeção equiretangular sobre o
 * bounding box do Brasil + retícula de referência. Tema via tokens.
 */
export function UsinasMap({
  pins,
  semCoords,
  emptyMessage = "Cadastre latitude/longitude das usinas para vê-las no mapa.",
}: {
  pins: MapPin[];
  semCoords: string[];
  emptyMessage?: string;
}) {
  // linhas da retícula a cada ~10° (referência)
  const lons = [-70, -60, -50, -40];
  const lats = [0, -10, -20, -30];

  return (
    <div className="usinas-map">
      {pins.length === 0 ? (
        <p className="usinas-map-empty">{emptyMessage}</p>
      ) : (
        <div className="usinas-map-canvas">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label="Mapa das usinas por coordenadas"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* moldura */}
            <rect
              x={PAD}
              y={PAD}
              width={W - 2 * PAD}
              height={H - 2 * PAD}
              className="map-frame"
            />
            {/* retícula */}
            {lons.map((lon) => {
              const [x] = project(0, lon);
              return (
                <g key={`lon-${lon}`}>
                  <line x1={x} y1={PAD} x2={x} y2={H - PAD} className="map-grid" />
                  <text x={x} y={H - PAD + 14} className="map-grid-label" textAnchor="middle">
                    {lon}°
                  </text>
                </g>
              );
            })}
            {lats.map((lat) => {
              const [, y] = project(lat, BBOX.lonMin);
              return (
                <g key={`lat-${lat}`}>
                  <line x1={PAD} y1={y} x2={W - PAD} y2={y} className="map-grid" />
                  <text x={PAD - 6} y={y + 3} className="map-grid-label" textAnchor="end">
                    {lat}°
                  </text>
                </g>
              );
            })}
            {/* pinos */}
            {pins.map((p) => {
              const [x, y] = project(p.latitude, p.longitude);
              const cor = corStatus(p.statusReal);
              return (
                <a key={p.id} href="/usinas" aria-label={`${p.nome} — ver usinas`}>
                  <g className="map-pin" transform={`translate(${x} ${y})`}>
                    <title>
                      {p.nome}
                      {p.potenciaKwp ? ` · ${fmt(p.potenciaKwp)} kWp` : ""} ·{" "}
                      {rotuloStatus(p.statusReal)}
                    </title>
                    <circle r={9} fill={cor} fillOpacity={0.22} />
                    <circle r={4.5} fill={cor} stroke="var(--surface)" strokeWidth={1.5} />
                  </g>
                </a>
              );
            })}
          </svg>
        </div>
      )}

      {/* legenda */}
      <div className="usinas-map-legend">
        <span><i className="map-dot" style={{ background: "var(--sev-ok)" }} /> online</span>
        <span><i className="map-dot" style={{ background: "var(--sev-warning)" }} /> em alarme</span>
        <span><i className="map-dot" style={{ background: "var(--sev-critical)" }} /> offline</span>
        <span><i className="map-dot" style={{ background: "var(--muted)" }} /> sem telemetria</span>
      </div>

      {/* usinas sem coordenadas */}
      {semCoords.length > 0 ? (
        <details className="usinas-map-sem">
          <summary>
            {semCoords.length} usina(s) sem coordenadas (não aparecem no mapa)
          </summary>
          <ul>
            {semCoords.map((nome) => (
              <li key={nome}>{nome}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
