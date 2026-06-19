import { Factory, Network, Users } from "lucide-react";
import { RateioDgTable, type RateioDgRow } from "@/components/RateioDgTable";
import { KpiCard } from "@/components/KpiCard";
import {
  getUltimaSyncRateioDg,
  listRateioDg,
} from "@/lib/digitalgrid/queries";
import { numberFormatter } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function RateioPage() {
  const [rateios, ultimaSync] = await Promise.all([
    listRateioDg(),
    getUltimaSyncRateioDg(),
  ]);

  const competencias = new Set(rateios.map((r) => r.competencia).filter(Boolean));
  const usinas = new Set(rateios.map((r) => r.usinaNome).filter(Boolean));
  const totalConsumo = rateios.reduce((s, r) => s + r.consumoKwh, 0);

  const rows: RateioDgRow[] = rateios.map((r) => ({
    id: r.id,
    competencia: r.competencia,
    usinaNome: r.usinaNome,
    installation: r.installation,
    ownerName: r.ownerName,
    percentual: r.percentual,
    consumoKwh: r.consumoKwh,
    creditosAcumulados: r.creditosAcumulados,
  }));

  return (
    <>
      <section className="kpi-grid compact-kpis">
        <KpiCard
          title="Cotas de rateio"
          value={String(rateios.length)}
          detail={`${competencias.size} competência(s)`}
          icon={Network}
          tone="success"
        />
        <KpiCard
          title="Usinas com rateio"
          value={String(usinas.size)}
          detail="Geradores com cotas"
          icon={Factory}
        />
        <KpiCard
          title="Consumo rateado"
          value={`${numberFormatter.format(totalConsumo)} kWh`}
          detail="Somatório das UCs"
          icon={Users}
          tone="warning"
        />
      </section>

      {rateios.length === 0 ? (
        <section className="panel">
          <div className="panel-header">
            <h2>Rateio por unidade consumidora</h2>
          </div>
          <p style={{ color: "var(--muted)" }}>
            Nenhuma cota sincronizada ainda. Configure o token em Configurações ›
            Integrações e aguarde a próxima sincronização (ou rode
            <code> npm run db:sync-rateio-dg</code>).
          </p>
        </section>
      ) : (
        <RateioDgTable rows={rows} />
      )}

      <p style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}>
        Última sincronização com o Digital Grid: {formatDateTime(ultimaSync)}
      </p>
    </>
  );
}
