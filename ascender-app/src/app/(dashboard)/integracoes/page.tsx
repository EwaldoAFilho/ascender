import { count, max } from "drizzle-orm";
import {
  CheckCircle2,
  CircleDashed,
  CircleDollarSign,
  Database,
  History,
  PlugZap,
  ReceiptText,
  Network,
} from "lucide-react";
import { maskKey } from "@/lib/crypto/secrets";
import { getDb } from "@/lib/db";
import { faturasDg, medicoesGeracao, rateiosDg } from "@/lib/db/schema";
import { getDgRow } from "@/lib/digitalgrid/credentials";
import { getSolisCredentialRow } from "@/lib/soliscloud/credentials";
import { SummaryStrip, type SummaryItem } from "@/components/SummaryStrip";
import { numberFormatter } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

const recursosSolis: Array<{ rec: string; uso: string; producao: boolean }> = [
  { rec: "userStationList", uso: "Usinas e telemetria (SolisCloud, Usinas, Executivo)", producao: true },
  { rec: "stationDay", uso: "Curva de potência do dia (Geração)", producao: true },
  { rec: "stationMonth", uso: "Geração diária do mês + receita (Geração)", producao: true },
  { rec: "stationYear", uso: "Geração mensal do ano + receita (Geração)", producao: true },
  { rec: "inverterList", uso: "Inversores por usina (SolisCloud)", producao: true },
  { rec: "alarmList", uso: "Alarmes / alertas técnicos (SolisCloud)", producao: true },
  { rec: "collectorList", uso: "Comunicação dos coletores / dataloggers (O&M)", producao: true },
];

const recursosDg: Array<{ rec: string; uso: string; producao: boolean }> = [
  { rec: "GET /bills", uso: "Faturas reais (Financeiro)", producao: true },
  { rec: "GET /estimated-quota", uso: "Rateio por unidade consumidora (Rateio)", producao: true },
  { rec: "GET /monthly-generation", uso: "Geração mensal + rateio detalhado", producao: true },
  { rec: "GET /generators", uso: "Geradores/usinas (conciliação)", producao: true },
  { rec: "GET /installations", uso: "Unidades consumidoras (conciliação)", producao: true },
  { rec: "GET /entities", uso: "Clientes (conciliação)", producao: true },
  { rec: "GET /agents", uso: "Agente ASCENDER (teste de conexão)", producao: true },
];

type TelaStatus = "real" | "manual" | "parcial" | "planejado";
const telas: Array<{ nome: string; desc: string; status: TelaStatus }> = [
  { nome: "SolisCloud operacional", desc: "Telemetria, inversores e alarmes", status: "real" },
  { nome: "Geração (curva e histórico)", desc: "Curva do dia, geração e receita por mês/ano", status: "real" },
  { nome: "Usinas", desc: "Cruzamento realizado × esperado por usina", status: "real" },
  { nome: "Executivo", desc: "Geração SolisCloud + financeiro do Digital Grid", status: "real" },
  { nome: "Financeiro", desc: "Faturas reais do Digital Grid", status: "real" },
  { nome: "Rateio", desc: "Cotas reais por UC do Digital Grid", status: "real" },
  { nome: "Cadastros + Conciliação", desc: "Clientes/UCs conciliados com o Digital Grid", status: "real" },
  { nome: "Usuários", desc: "Cadastro multiusuário com login próprio", status: "real" },
  { nome: "Propostas", desc: "Simulador comercial (lançamento manual)", status: "manual" },
];

function formatDateTime(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function RecursoList({
  recursos,
}: {
  recursos: Array<{ rec: string; uso: string; producao: boolean }>;
}) {
  return (
    <div className="endpoint-list">
      {recursos.map((r) => (
        <article key={r.rec}>
          <div>
            <strong>{r.rec}</strong>
            <span>{r.uso}</span>
          </div>
          <span
            className={`status ${r.producao ? "status-online" : "status-aguardando"}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            {r.producao ? <CheckCircle2 size={14} /> : <CircleDashed size={14} />}
            {r.producao ? "em produção" : "disponível"}
          </span>
        </article>
      ))}
    </div>
  );
}

export default async function IntegracoesPage() {
  const db = getDb();
  const [solis, dg] = await Promise.all([getSolisCredentialRow(), getDgRow()]);
  const solisOk = solis?.lastTestOk === true;
  const dgOk = dg?.lastTestOk === true;

  const [histG] = await db
    .select({ total: count(), ultima: max(medicoesGeracao.sincronizadoEm) })
    .from(medicoesGeracao);
  const [histF] = await db
    .select({ total: count(), ultima: max(faturasDg.sincronizadoEm) })
    .from(faturasDg);
  const [histR] = await db
    .select({ total: count(), ultima: max(rateiosDg.sincronizadoEm) })
    .from(rateiosDg);

  const fontesAtivas = (solisOk ? 1 : 0) + (dgOk ? 1 : 0);

  const kpis: SummaryItem[] = [
    {
      label: "Fontes ativas",
      value: `${fontesAtivas}/2`,
      hint: "SolisCloud + Digital Grid",
      tone: fontesAtivas === 2 ? "ok" : fontesAtivas === 1 ? "warn" : "bad",
    },
    {
      label: "Medições de geração",
      value: numberFormatter.format(histG?.total ?? 0),
      hint: "no histórico (banco)",
      tone: (histG?.total ?? 0) > 0 ? "ok" : "warn",
    },
    {
      label: "Faturas",
      value: numberFormatter.format(histF?.total ?? 0),
      hint: "sincronizadas do DG",
      tone: (histF?.total ?? 0) > 0 ? "ok" : "warn",
    },
    {
      label: "Cotas de rateio",
      value: numberFormatter.format(histR?.total ?? 0),
      hint: "sincronizadas do DG",
      tone: (histR?.total ?? 0) > 0 ? "ok" : "warn",
    },
  ];

  const telaBadge: Record<TelaStatus, { cls: string; label: string }> = {
    real: { cls: "status-online", label: "real" },
    manual: { cls: "status-aguardando", label: "manual" },
    parcial: { cls: "status-aguardando", label: "parcial" },
    planejado: { cls: "", label: "planejado" },
  };

  return (
    <>
      <SummaryStrip items={kpis} />
      <section className="split-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Fontes de dados</h2>
            <span>{fontesAtivas} ativa(s)</span>
          </div>
          <div className="integration-list">
            <article>
              <div className="source-icon">
                <PlugZap size={20} />
              </div>
              <div>
                <strong>SolisCloud</strong>
                <span>
                  {solisOk
                    ? `Conectado · KeyId ${maskKey(solis?.keyId ?? "")} · verificado ${formatDateTime(solis?.lastTestAt ?? null)}`
                    : solis
                      ? "Configurada — testar conexão"
                      : "Não configurada"}
                </span>
              </div>
              <span className={`status ${solisOk ? "status-online" : "status-aguardando"}`}>
                {solisOk ? "conectado" : "pendente"}
              </span>
            </article>

            <article>
              <div className="source-icon">
                <CircleDollarSign size={20} />
              </div>
              <div>
                <strong>Digital Grid</strong>
                <span>
                  {dgOk
                    ? `Conectado (${dg?.keyId ?? "Token"}) · verificado ${formatDateTime(dg?.lastTestAt ?? null)}`
                    : dg
                      ? "Configurada — testar conexão"
                      : "Não configurada"}
                </span>
              </div>
              <span className={`status ${dgOk ? "status-online" : "status-aguardando"}`}>
                {dgOk ? "conectado" : "pendente"}
              </span>
            </article>

            <article>
              <div className="source-icon">
                <History size={20} />
              </div>
              <div>
                <strong>Histórico de geração (banco)</strong>
                <span>
                  {(histG?.total ?? 0) > 0
                    ? `${histG?.total} medição(ões) · sync ${formatDateTime(histG?.ultima ?? null)}`
                    : "Aguardando primeira sincronização"}
                </span>
              </div>
              <span className={`status ${(histG?.total ?? 0) > 0 ? "status-online" : "status-aguardando"}`}>
                {(histG?.total ?? 0) > 0 ? "sincronizado" : "pendente"}
              </span>
            </article>

            <article>
              <div className="source-icon">
                <ReceiptText size={20} />
              </div>
              <div>
                <strong>Faturas (Digital Grid)</strong>
                <span>
                  {(histF?.total ?? 0) > 0
                    ? `${histF?.total} fatura(s) · sync ${formatDateTime(histF?.ultima ?? null)}`
                    : "Aguardando primeira sincronização"}
                </span>
              </div>
              <span className={`status ${(histF?.total ?? 0) > 0 ? "status-online" : "status-aguardando"}`}>
                {(histF?.total ?? 0) > 0 ? "sincronizado" : "pendente"}
              </span>
            </article>

            <article>
              <div className="source-icon">
                <Network size={20} />
              </div>
              <div>
                <strong>Rateio (Digital Grid)</strong>
                <span>
                  {(histR?.total ?? 0) > 0
                    ? `${histR?.total} cota(s) · sync ${formatDateTime(histR?.ultima ?? null)}`
                    : "Aguardando primeira sincronização"}
                </span>
              </div>
              <span className={`status ${(histR?.total ?? 0) > 0 ? "status-online" : "status-aguardando"}`}>
                {(histR?.total ?? 0) > 0 ? "sincronizado" : "pendente"}
              </span>
            </article>

            <article style={{ opacity: 0.6 }}>
              <div className="source-icon">
                <Database size={20} />
              </div>
              <div>
                <strong>Controle de Usinas (Excel)</strong>
                <span>Importação da planilha operacional — fase futura.</span>
              </div>
              <span className="status status-pendente-validacao">planejado</span>
            </article>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Recursos da API SolisCloud</h2>
            <span>{recursosSolis.filter((r) => r.producao).length} em produção</span>
          </div>
          <RecursoList recursos={recursosSolis} />
        </section>
      </section>

      <section className="split-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Recursos da API Digital Grid</h2>
            <span>somente leitura</span>
          </div>
          <RecursoList recursos={recursosDg} />
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Telas do sistema</h2>
            <span>status de implementação</span>
          </div>
          <div className="endpoint-list">
            {telas.map((t) => (
              <article key={t.nome}>
                <div>
                  <strong style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
                    {t.nome}
                  </strong>
                  <span>{t.desc}</span>
                </div>
                <span className={`status ${telaBadge[t.status].cls}`}>
                  {telaBadge[t.status].label}
                </span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
