import { RateioDgTable, type RateioDgRow } from "@/components/RateioDgTable";
import { SummaryStrip, type SummaryItem } from "@/components/SummaryStrip";
import { EmptyState } from "@/components/states";
import {
  getUltimaSyncRateioDg,
  listRateioDg,
} from "@/lib/digitalgrid/queries";
import { withSessionTenant } from "@/lib/auth/tenant";
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
  const [rateios, ultimaSync] = await withSessionTenant(() =>
    Promise.all([listRateioDg(), getUltimaSyncRateioDg()]),
  );

  const competencias = new Set(rateios.map((r) => r.competencia).filter(Boolean));
  const usinas = new Set(rateios.map((r) => r.usinaNome).filter(Boolean));
  const ucs = new Set(rateios.map((r) => r.installation).filter(Boolean));
  const totalConsumo = rateios.reduce((s, r) => s + r.consumoKwh, 0);

  const kpis: SummaryItem[] = [
    {
      label: "Cotas de rateio",
      value: numberFormatter.format(rateios.length),
      hint: `${competencias.size} competência(s)`,
    },
    {
      label: "Usinas geradoras",
      value: numberFormatter.format(usinas.size),
      hint: "com cotas no período",
    },
    {
      label: "UCs atendidas",
      value: numberFormatter.format(ucs.size),
      hint: "unidades no rateio",
    },
    {
      label: "Consumo rateado",
      value: `${numberFormatter.format(totalConsumo)} kWh`,
      hint: "somatório das UCs",
    },
  ];

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
      <SummaryStrip items={kpis} />

      {rateios.length === 0 ? (
        <section className="panel">
          <div className="panel-header">
            <h2>Rateio por unidade consumidora</h2>
          </div>
          <EmptyState message="Nenhuma cota sincronizada ainda. Configure o token em Configurações › Integrações e aguarde a próxima sincronização (ou rode npm run db:sync-rateio-dg)." />
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
