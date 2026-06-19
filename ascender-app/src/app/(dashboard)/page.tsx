import {
  BadgeDollarSign,
  CircleDollarSign,
  Gauge,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { BarList } from "@/components/BarList";
import { KpiCard } from "@/components/KpiCard";
import { ModuleGrid } from "@/components/ModuleGrid";
import {
  getHistoricoGeracaoMensal,
  getTelemetriaPorStation,
} from "@/lib/cadastros/queries";
import { getResumoFaturasDg } from "@/lib/digitalgrid/queries";
import {
  formatCompetencia,
  moneyFormatter,
  numberFormatter,
} from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [tele, hist, fat] = await Promise.all([
    getTelemetriaPorStation(),
    getHistoricoGeracaoMensal(),
    getResumoFaturasDg(),
  ]);

  const estacoes = Array.from(tele.mapa.values());
  const potenciaAgora = estacoes.reduce((s, e) => s + e.currentPowerKw, 0);
  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const receitaMes =
    hist.porMes.find((m) => m.competencia === mesAtual)?.receita ?? 0;

  return (
    <>
      <section className="hero compact-hero">
        <div>
          <p className="eyebrow">Sistema ASCENDER</p>
          <h2>Central de operação das usinas solares.</h2>
          <p>
            Geração em tempo real da SolisCloud, histórico no banco e financeiro
            — tudo num só lugar.
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-black.jpeg" alt="" />
      </section>

      <ModuleGrid />

      <section className="kpi-grid">
        <KpiCard
          title="Geração no ano"
          value={`${numberFormatter.format(hist.totalKwh)} kWh`}
          detail="Histórico SolisCloud"
          icon={Gauge}
          tone="success"
        />
        <KpiCard
          title="Potência agora"
          value={`${numberFormatter.format(potenciaAgora)} kW`}
          detail={`${estacoes.length} usina(s)`}
          icon={Zap}
          tone="success"
        />
        <KpiCard
          title="Em aberto"
          value={moneyFormatter.format(fat.emAberto)}
          detail={`${fat.qtd} fatura(s)`}
          icon={BadgeDollarSign}
          tone="warning"
        />
        <KpiCard
          title="Pago"
          value={moneyFormatter.format(fat.pago)}
          detail="Faturas quitadas"
          icon={ShieldCheck}
          tone="success"
        />
        <KpiCard
          title="Receita no mês"
          value={moneyFormatter.format(receitaMes)}
          detail={`Competência ${formatCompetencia(mesAtual)}`}
          icon={CircleDollarSign}
        />
      </section>

      <section className="dashboard-grid">
        <BarList
          title="Geração de hoje por usina"
          rows={estacoes.map((e) => ({
            label: e.stationName ?? e.stationId,
            value: e.dayEnergyKwh,
            caption: "geração de hoje",
          }))}
          formatter={(v) => `${numberFormatter.format(v)} kWh`}
        />
        <BarList
          title="Geração mensal consolidada"
          rows={hist.porMes.map((m) => ({
            label: formatCompetencia(m.competencia),
            value: m.geracaoKwh,
            caption: moneyFormatter.format(m.receita),
          }))}
          formatter={(v) => `${numberFormatter.format(v)} kWh`}
        />
      </section>
    </>
  );
}
