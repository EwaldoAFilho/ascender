import { FaturasDgTable, type FaturaDgRow } from "@/components/FaturasDgTable";
import { ImportarBoletosLote } from "@/components/ImportarBoletosLote";
import { SummaryStrip, type SummaryItem } from "@/components/SummaryStrip";
import {
  getClientePorInstalacao,
  getUltimaSyncFaturasDg,
  listFaturasDg,
} from "@/lib/digitalgrid/queries";
import { getFaturaIdsComConta } from "@/lib/financeiro/conta";
import { moneyFormatter } from "@/lib/dashboard-data";

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

export default async function FinanceiroPage() {
  const [faturas, ultimaSync, comConta, clientePorInst] = await Promise.all([
    listFaturasDg(),
    getUltimaSyncFaturasDg(),
    getFaturaIdsComConta(),
    getClientePorInstalacao(),
  ]);

  const totalFaturado = faturas.reduce((s, f) => s + f.valorTotal, 0);
  const totalPago = faturas.reduce((s, f) => s + f.valorPago, 0);
  const economia = faturas.reduce((s, f) => s + f.economia, 0);
  const emAberto = totalFaturado - totalPago;
  const taxaReceb = totalFaturado > 0 ? (totalPago / totalFaturado) * 100 : 0;

  const kpis: SummaryItem[] = [
    {
      label: "Total faturado",
      value: moneyFormatter.format(totalFaturado),
      hint: `${faturas.length} fatura(s) · Digital Grid`,
    },
    {
      label: "Recebido",
      value: moneyFormatter.format(totalPago),
      hint: `${taxaReceb.toFixed(0)}% do faturado`,
      tone: "ok",
    },
    {
      label: "Em aberto",
      value: moneyFormatter.format(Math.max(0, emAberto)),
      hint: `${Math.max(0, 100 - taxaReceb).toFixed(0)}% do faturado`,
      // Semáforo pela taxa de recebimento, não pelo valor absoluto: quase sempre
      // há algo a vencer, então só vira âmbar/vermelho se a inadimplência pesar.
      tone: taxaReceb >= 95 ? "default" : taxaReceb >= 80 ? "warn" : "bad",
    },
    {
      label: "Economia gerada",
      value: moneyFormatter.format(economia),
      hint: "para os clientes",
      tone: "ok",
    },
  ];

  const rows: FaturaDgRow[] = faturas.map((f) => ({
    id: f.id,
    competencia: f.competencia,
    cliente: f.installationNumber
      ? (clientePorInst.get(f.installationNumber) ?? null)
      : null,
    installationNumber: f.installationNumber,
    paymentStatus: f.paymentStatus,
    valorTotal: f.valorTotal,
    valorPago: f.valorPago,
    economia: f.economia,
    consumoKwh: f.consumoKwh,
    vencimento: f.vencimento,
    pagoEm: f.pagoEm,
  }));

  return (
    <>
      <SummaryStrip items={kpis} />

      {faturas.length > 0 ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <ImportarBoletosLote />
        </div>
      ) : null}

      {faturas.length === 0 ? (
        <section className="panel">
          <div className="panel-header">
            <h2>Faturas (Digital Grid)</h2>
          </div>
          <p style={{ color: "var(--muted)" }}>
            Nenhuma fatura sincronizada ainda. Configure o token em Configurações ›
            Integrações e aguarde a próxima sincronização (ou rode
            <code> npm run db:sync-faturas-dg</code>).
          </p>
        </section>
      ) : (
        <FaturasDgTable rows={rows} comConta={comConta} />
      )}

      <p style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}>
        Última sincronização com o Digital Grid: {formatDateTime(ultimaSync)}
      </p>
    </>
  );
}
