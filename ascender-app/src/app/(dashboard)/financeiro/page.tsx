import {
  BadgeDollarSign,
  PiggyBank,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { FaturasDgTable, type FaturaDgRow } from "@/components/FaturasDgTable";
import { KpiCard } from "@/components/KpiCard";
import {
  getUltimaSyncFaturasDg,
  listFaturasDg,
} from "@/lib/digitalgrid/queries";
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
  const [faturas, ultimaSync] = await Promise.all([
    listFaturasDg(),
    getUltimaSyncFaturasDg(),
  ]);

  const totalFaturado = faturas.reduce((s, f) => s + f.valorTotal, 0);
  const totalPago = faturas.reduce((s, f) => s + f.valorPago, 0);
  const economia = faturas.reduce((s, f) => s + f.economia, 0);
  const emAberto = totalFaturado - totalPago;

  const rows: FaturaDgRow[] = faturas.map((f) => ({
    id: f.id,
    competencia: f.competencia,
    installationNumber: f.installationNumber,
    installationClass: f.installationClass,
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
      <section className="kpi-grid">
        <KpiCard
          title="Total faturado"
          value={moneyFormatter.format(totalFaturado)}
          detail={`${faturas.length} fatura(s) — Digital Grid`}
          icon={ReceiptText}
        />
        <KpiCard
          title="Recebido"
          value={moneyFormatter.format(totalPago)}
          detail="Pagamentos confirmados"
          icon={ShieldCheck}
          tone="success"
        />
        <KpiCard
          title="Em aberto"
          value={moneyFormatter.format(emAberto > 0 ? emAberto : 0)}
          detail="Faturado menos recebido"
          icon={BadgeDollarSign}
          tone="warning"
        />
        <KpiCard
          title="Economia gerada"
          value={moneyFormatter.format(economia)}
          detail="Para os clientes"
          icon={PiggyBank}
          tone="success"
        />
      </section>

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
        <FaturasDgTable rows={rows} />
      )}

      <p style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}>
        Última sincronização com o Digital Grid: {formatDateTime(ultimaSync)}
      </p>
    </>
  );
}
