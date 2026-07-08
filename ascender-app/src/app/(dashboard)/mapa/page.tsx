import { UsinasMap, type MapPin } from "@/components/UsinasMap";
import { SummaryStrip, type SummaryItem } from "@/components/SummaryStrip";
import { getUsinasComTelemetria, listUsinas } from "@/lib/cadastros/queries";
import { withSessionTenant } from "@/lib/auth/tenant";
import { numberFormatter } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const [tele, cadastro] = await withSessionTenant(() =>
    Promise.all([getUsinasComTelemetria(), listUsinas()]),
  );

  // Coordenadas por usina (preenchidas manualmente — Fase 3B-A).
  const coordsPorId = new Map(
    cadastro.map((u) => [u.id, { lat: u.latitude, lon: u.longitude }]),
  );

  const pins: MapPin[] = [];
  const semCoords: string[] = [];
  for (const l of tele.linhas) {
    const c = coordsPorId.get(l.id);
    if (c && c.lat != null && c.lon != null) {
      pins.push({
        id: l.id,
        nome: l.nome,
        latitude: c.lat,
        longitude: c.lon,
        potenciaKwp: l.potenciaKwp,
        statusReal: l.statusReal,
      });
    } else {
      semCoords.push(l.nome);
    }
  }

  const online = pins.filter((p) => p.statusReal === "online").length;
  const resumo: SummaryItem[] = [
    {
      label: "No mapa",
      value: `${pins.length}/${tele.linhas.length}`,
      hint: "usinas com coordenadas",
      tone: pins.length > 0 ? "ok" : "default",
    },
    {
      label: "Online",
      value: numberFormatter.format(online),
      hint: "status ao vivo",
      tone: "ok",
    },
    {
      label: "Sem coordenadas",
      value: numberFormatter.format(semCoords.length),
      hint: "preencher no cadastro",
      tone: semCoords.length > 0 ? "warn" : "default",
    },
  ];

  return (
    <>
      <SummaryStrip items={resumo} />
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Mapa das usinas</h2>
            <p>
              Posição por latitude/longitude cadastradas; cor do pino pelo status
              operacional. Clique num pino para ver as usinas.
            </p>
          </div>
        </div>
        <UsinasMap pins={pins} semCoords={semCoords} />
      </section>
    </>
  );
}
