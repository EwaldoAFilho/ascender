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

// Contorno simplificado do Brasil (≈45 vértices [lon, lat]), embutido — sem rede,
// sem API, sem dependência. Projetado pela MESMA `project()` dos pinos para que
// contorno e pinos fiquem alinhados.
const BRAZIL_OUTLINE: Array<[number, number]> = [
  [-69.4, 0.7], [-67.1, 1.2], [-64.0, 4.1], [-60.0, 5.2], [-59.8, 4.3],
  [-56.5, 1.9], [-54.2, 2.2], [-51.6, 4.1], [-50.9, 0.9], [-48.5, -1.5],
  [-44.3, -2.5], [-41.8, -2.9], [-38.5, -3.7], [-35.2, -5.8], [-34.8, -7.3],
  [-35.4, -9.4], [-37.0, -11.0], [-38.5, -13.0], [-39.0, -15.5], [-39.7, -18.0],
  [-40.8, -20.8], [-41.9, -22.4], [-44.5, -23.3], [-47.0, -24.5], [-48.6, -26.2],
  [-48.6, -28.6], [-50.5, -30.4], [-52.2, -31.9], [-53.4, -33.7], [-55.6, -30.9],
  [-57.6, -30.2], [-56.0, -27.4], [-54.6, -25.6], [-54.3, -24.0], [-58.0, -20.0],
  [-57.7, -16.3], [-60.2, -13.6], [-63.0, -12.0], [-65.3, -9.8], [-70.6, -11.0],
  [-73.9, -7.5], [-72.9, -5.1], [-70.0, -4.3], [-69.9, -1.0],
];

const BRAZIL_POLYGON = BRAZIL_OUTLINE.map(([lon, lat]) => {
  const [x, y] = project(lat, lon);
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}).join(" ");

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
            {/* mar (fundo do mapa) */}
            <rect
              x={PAD}
              y={PAD}
              width={W - 2 * PAD}
              height={H - 2 * PAD}
              rx={8}
              className="map-sea"
            />
            {/* contorno do Brasil (polígono local simplificado) */}
            <polygon points={BRAZIL_POLYGON} className="map-brazil" />
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
