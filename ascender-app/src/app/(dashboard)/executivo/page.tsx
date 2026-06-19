import {
  BadgeDollarSign,
  CircleDollarSign,
  Gauge,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { BarList } from "@/components/BarList";
import {
  getHistoricoGeracaoMensal,
  getUsinasComTelemetria,
} from "@/lib/cadastros/queries";
import { getResumoFaturasDg } from "@/lib/digitalgrid/queries";
import {
  formatCompetencia,
  moneyFormatter,
  numberFormatter,
} from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function ExecutivoPage() {
  const [usinas, hist, fat] = await Promise.all([
    getUsinasComTelemetria(),
    getHistoricoGeracaoMensal(),
    getResumoFaturasDg(),
  ]);

  const realMes = usinas.linhas.reduce(
    (s, l) => s + (l.realizadoMesKwh ?? 0),
    0,
  );
  const vinculadas = usinas.linhas.filter((l) => l.vinculada).length;
  const aderenciaRows = usinas.linhas
    .filter((l) => l.aderenciaPct != null)
    .map((l) => ({
      label: l.nome,
      value: l.aderenciaPct as number,
      caption: `${numberFormatter.format(l.realizadoMesKwh ?? 0)} de ${numberFormatter.format(l.esperadoMesKwh ?? 0)} kWh`,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <section className="kpi-grid">
        <KpiCard
          title="Geração no ano"
          value={`${numberFormatter.format(hist.totalKwh)} kWh`}
          detail="Histórico SolisCloud"
          icon={Gauge}
          tone="success"
        />
        <KpiCard
          title="Geração Solis mês"
          value={`${numberFormatter.format(realMes)} kWh`}
          detail={
            vinculadas
              ? `${vinculadas} usina(s) vinculada(s)`
              : "vincule usinas p/ dado real"
          }
          icon={Sun}
          tone="success"
        />
        <KpiCard
          title="Valor em aberto"
          value={moneyFormatter.format(fat.emAberto)}
          detail={`${fat.qtd} fatura(s)`}
          icon={BadgeDollarSign}
          tone="warning"
        />
        <KpiCard
          title="Valor pago"
          value={moneyFormatter.format(fat.pago)}
          detail="Faturas quitadas"
          icon={ShieldCheck}
          tone="success"
        />
        <KpiCard
          title="Receita no ano"
          value={moneyFormatter.format(hist.totalReceita)}
          detail="Estimada pela SolisCloud"
          icon={CircleDollarSign}
        />
      </section>
      <section className="dashboard-grid">
        <BarList
          title="Geração mensal consolidada"
          rows={hist.porMes.map((m) => ({
            label: formatCompetencia(m.competencia),
            value: m.geracaoKwh,
            caption: moneyFormatter.format(m.receita),
          }))}
          formatter={(value) => `${numberFormatter.format(value)} kWh`}
        />
        <BarList
          title="Aderência SolisCloud x previsto"
          rows={aderenciaRows}
          formatter={(value) => `${numberFormatter.format(value)}%`}
        />
      </section>
    </>
  );
}
