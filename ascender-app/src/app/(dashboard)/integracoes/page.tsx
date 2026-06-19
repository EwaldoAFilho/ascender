import { count, max } from "drizzle-orm";
import {
  CheckCircle2,
  CircleDashed,
  CircleDollarSign,
  Clock,
  Database,
  History,
  PlugZap,
} from "lucide-react";
import { maskKey } from "@/lib/crypto/secrets";
import { getDb } from "@/lib/db";
import { medicoesGeracao } from "@/lib/db/schema";
import { getSolisCredentialRow } from "@/lib/soliscloud/credentials";

export const dynamic = "force-dynamic";

type RecursoStatus = "producao" | "disponivel";
const recursosSolis: Array<{ rec: string; uso: string; status: RecursoStatus }> =
  [
    {
      rec: "userStationList",
      uso: "Lista de usinas e telemetria (SolisCloud, Usinas, Executivo, Geração)",
      status: "producao",
    },
    {
      rec: "stationDay",
      uso: "Curva de potência do dia (Geração)",
      status: "producao",
    },
    {
      rec: "stationMonth",
      uso: "Geração diária do mês + receita (Geração)",
      status: "producao",
    },
    {
      rec: "stationYear",
      uso: "Geração mensal do ano + receita (Geração)",
      status: "producao",
    },
    {
      rec: "inverterList",
      uso: "Inversores por usina (SolisCloud)",
      status: "producao",
    },
    {
      rec: "alarmList",
      uso: "Alarmes / alertas técnicos (SolisCloud)",
      status: "producao",
    },
    {
      rec: "collectorList",
      uso: "Comunicação dos coletores (O&M) — planejado",
      status: "disponivel",
    },
    {
      rec: "stationDetail",
      uso: "Detalhe consolidado da usina — planejado",
      status: "disponivel",
    },
  ];

type TelaStatus = "real" | "parcial" | "mock";
const telas: Array<{ nome: string; desc: string; status: TelaStatus }> = [
  {
    nome: "SolisCloud operacional",
    desc: "Telemetria, inversores e alarmes",
    status: "real",
  },
  {
    nome: "Geração (curva e histórico)",
    desc: "Curva do dia, geração e receita por mês/ano",
    status: "real",
  },
  {
    nome: "Usinas",
    desc: "Cruzamento realizado × esperado por usina",
    status: "real",
  },
  {
    nome: "Cadastros",
    desc: "Cliente, UC, usina, contrato, distribuidora (CRUD)",
    status: "real",
  },
  {
    nome: "Executivo",
    desc: "Geração SolisCloud real + financeiro ainda mock",
    status: "parcial",
  },
  {
    nome: "Financeiro / Rateio / Propostas",
    desc: "Aguardando integração Digital Grid",
    status: "mock",
  },
];

function formatDateTime(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export default async function IntegracoesPage() {
  const solis = await getSolisCredentialRow();
  const conectado = solis?.lastTestOk === true;

  const [hist] = await getDb()
    .select({ total: count(), ultima: max(medicoesGeracao.sincronizadoEm) })
    .from(medicoesGeracao);
  const histTotal = hist?.total ?? 0;
  const histUltima = hist?.ultima ?? null;

  const telaBadge: Record<TelaStatus, { cls: string; label: string }> = {
    real: { cls: "status-online", label: "real" },
    parcial: { cls: "status-aguardando", label: "parcial" },
    mock: { cls: "", label: "planejado" },
  };

  const emProducao = recursosSolis.filter((r) => r.status === "producao").length;

  return (
    <>
      <section className="split-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Fontes de dados</h2>
            <span>1 ativa</span>
          </div>
          <div className="integration-list">
            <article>
              <div className="source-icon">
                <PlugZap size={20} />
              </div>
              <div>
                <strong>SolisCloud</strong>
                <span>
                  {conectado
                    ? `Conectado · KeyId ${maskKey(solis?.keyId ?? "")} · última verificação ${formatDateTime(solis?.lastTestAt ?? null)}`
                    : solis
                      ? "Configurada — testar conexão"
                      : "Não configurada"}
                </span>
              </div>
              <span
                className={`status ${conectado ? "status-online" : "status-aguardando"}`}
              >
                {conectado ? "conectado" : "pendente"}
              </span>
            </article>
            <article style={{ opacity: 0.6 }}>
              <div className="source-icon">
                <CircleDollarSign size={20} />
              </div>
              <div>
                <strong>Digital Grid</strong>
                <span>Financeiro, faturas e rateio — depende de validação da API.</span>
              </div>
              <span className="status status-pendente-validacao">em breve</span>
            </article>
            <article style={{ opacity: 0.6 }}>
              <div className="source-icon">
                <Database size={20} />
              </div>
              <div>
                <strong>Controle de Usinas (Excel)</strong>
                <span>Importação da planilha operacional — fase futura.</span>
              </div>
              <span className="status status-pendente-validacao">em breve</span>
            </article>
            <article>
              <div className="source-icon">
                <History size={20} />
              </div>
              <div>
                <strong>Histórico de geração (banco)</strong>
                <span>
                  {histTotal > 0
                    ? `${histTotal} competência(s) · sincronizado em ${formatDateTime(histUltima)}`
                    : "Aguardando primeira sincronização"}
                </span>
              </div>
              <span
                className={`status ${histTotal > 0 ? "status-online" : "status-aguardando"}`}
              >
                {histTotal > 0 ? "sincronizado" : "pendente"}
              </span>
            </article>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Recursos da API SolisCloud</h2>
            <span>{emProducao} em produção</span>
          </div>
          <div className="endpoint-list">
            {recursosSolis.map((r) => (
              <article key={r.rec}>
                <div>
                  <strong>{r.rec}</strong>
                  <span>{r.uso}</span>
                </div>
                {r.status === "producao" ? (
                  <span
                    className="status status-online"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                  >
                    <CheckCircle2 size={14} /> em produção
                  </span>
                ) : (
                  <span
                    className="status status-aguardando"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                  >
                    <CircleDashed size={14} /> disponível
                  </span>
                )}
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="panel full-span">
        <div className="panel-header">
          <h2>Telas do sistema</h2>
          <span>status de implementação</span>
        </div>
        <div className="endpoint-list">
          {telas.map((t) => (
            <article key={t.nome}>
              <div>
                <strong
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  {t.status === "real" ? (
                    <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
                  ) : t.status === "parcial" ? (
                    <Clock size={16} style={{ color: "var(--warning)" }} />
                  ) : (
                    <CircleDashed size={16} style={{ color: "var(--muted)" }} />
                  )}
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
    </>
  );
}
