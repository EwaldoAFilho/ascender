"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SummaryStrip, type SummaryItem } from "@/components/SummaryStrip";
import { gerarProposta } from "@/lib/propostas/actions";
import {
  ADEQUACAO_OPCOES,
  COMPENSACAO_OPCOES,
  HSP_OPCOES,
  MESES,
} from "@/lib/propostas/constantes";
import { baixarPropostaPdf, type PdfCenario } from "@/lib/propostas/pdf";
import type { CenarioResultado, GeradorResultado } from "@/lib/propostas/types";

type Option = { value: string; label: string };

const brl = (v: number) =>
  Number.isFinite(v)
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    : "—";
const num = (v: number, d = 0) =>
  Number.isFinite(v) ? v.toLocaleString("pt-BR", { maximumFractionDigits: d }) : "—";
const anos = (v: number) =>
  Number.isFinite(v) ? `${v.toFixed(1).replace(".", ",")} anos` : "—";

const TOOLTIP_STYLE = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  color: "var(--ink)",
} as const;
const AXIS = "#7d909b";

type TelhadoForm = { largura: string; comprimento: string; aproveitamento: string };

const TELHADO_VAZIO: TelhadoForm = { largura: "", comprimento: "", aproveitamento: "80" };

export function GeradorProposta({
  clientes,
  unidades,
  distribuidoras,
}: {
  clientes: Option[];
  unidades: Option[];
  distribuidoras: Option[];
}) {
  // Formulário.
  const [clienteId, setClienteId] = useState("");
  const [unidadeConsumidoraId, setUnidade] = useState("");
  const [distribuidoraId, setDistribuidora] = useState("");
  const [instalacao, setInstalacao] = useState<"telhado" | "solo">("telhado");
  const [moduloWp, setModuloWp] = useState("620");
  const [inversorForcado, setInversor] = useState<"auto" | "string" | "micro">("auto");
  const [consumoKwh, setConsumo] = useState("");
  const [compensacaoPct, setCompensacao] = useState("1");
  const [hsp, setHsp] = useState("5.5");
  const [tarifa, setTarifa] = useState("");
  const [padrao, setPadrao] = useState<"mono" | "bi" | "tri">("mono");
  const [adequacaoTrifasica, setAdequacao] = useState(false);
  const [adequacaoValor, setAdequacaoValor] = useState("3500");
  const [observacao, setObservacao] = useState("");
  const [telhados, setTelhados] = useState<TelhadoForm[]>([
    { ...TELHADO_VAZIO },
    { ...TELHADO_VAZIO },
  ]);

  const [resultado, setResultado] = useState<GeradorResultado | null>(null);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarCusto, setMostrarCusto] = useState(false);

  function setTelhado(i: number, patch: Partial<TelhadoForm>) {
    setTelhados((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  }
  function addTelhado() {
    setTelhados((ts) => [...ts, { ...TELHADO_VAZIO }]);
  }
  function removeTelhado(i: number) {
    setTelhados((ts) => (ts.length <= 1 ? ts : ts.filter((_, j) => j !== i)));
  }

  async function gerar() {
    setErro(null);
    if (!clienteId) return setErro("Selecione o cliente.");
    if (!consumoKwh || Number(consumoKwh) <= 0) return setErro("Informe o consumo médio mensal.");
    if (!tarifa || Number(tarifa) <= 0) return setErro("Informe a tarifa (R$/kWh).");
    setBusy(true);
    const r = await gerarProposta({
      clienteId,
      unidadeConsumidoraId: unidadeConsumidoraId || undefined,
      distribuidoraId: distribuidoraId || undefined,
      instalacao,
      moduloWp: Number(moduloWp),
      inversorForcado,
      consumoKwh: Number(consumoKwh),
      compensacaoPct: Number(compensacaoPct),
      hsp: Number(hsp),
      tarifa: Number(tarifa),
      telhados: telhados.map((t) => ({
        largura: Number(t.largura) || 0,
        comprimento: Number(t.comprimento) || 0,
        aproveitamento: Number(t.aproveitamento) || 80,
      })),
      adequacaoTrifasica,
      adequacaoValor: Number(adequacaoValor),
      padrao,
      observacao: observacao || undefined,
    });
    setBusy(false);
    if (r.ok) {
      setResultado(r.resultado);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setErro(r.error);
    }
  }

  function novaSimulacao() {
    setResultado(null);
    setErro(null);
    setMostrarCusto(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function baixarPdf() {
    if (!resultado) return;
    const clienteNome =
      clientes.find((c) => c.value === clienteId)?.label ?? "Cliente";
    const conc = distribuidoras.find((d) => d.value === distribuidoraId)?.label;
    const toPdfCenario = (c: CenarioResultado): PdfCenario => ({
      titulo:
        c.cenario === "necessario"
          ? "Sistema Necessário (dimensionado pelo consumo)"
          : "Telhado Rentável (todo o telhado disponível)",
      potenciaKwp: c.potenciaKwp,
      qtdModulos: c.qtdModulos,
      moduloWp: c.moduloWp,
      geracaoMensalKwh: c.geracaoMensalKwh,
      geracaoAnualKwh: c.geracaoAnualKwh,
      inversorLabel: `${c.inversor.label} · ${c.inversor.disjuntor}`,
      precoFinal: c.precoFinal,
      precoPorKwp: c.precoPorKwp,
      paybackAnos: c.paybackAnos,
      tirPercent: c.tirPercent,
      economia25Anos: c.economia25Anos,
      co2Toneladas: c.co2Toneladas,
      retornoMensal: c.retornoMensal,
      retornoLabel: c.cenario === "necessario" ? "Economia mensal" : "Receita mensal",
      excedenteKwh: c.excedenteKwh,
      creditoExcedente: c.creditoExcedente,
    });
    void baixarPropostaPdf({
      cliente: clienteNome,
      concessionaria: conc,
      data: new Date().toLocaleDateString("pt-BR"),
      necessario: toPdfCenario(resultado.necessario),
      rentavel: resultado.rentavel ? toPdfCenario(resultado.rentavel) : null,
    });
  }

  if (resultado) {
    return (
      <Resultado
        resultado={resultado}
        mostrarCusto={mostrarCusto}
        onToggleCusto={() => setMostrarCusto((v) => !v)}
        onNova={novaSimulacao}
        onPdf={baixarPdf}
      />
    );
  }

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <Link href="/propostas" className="btn-link">
          <ArrowLeft size={14} /> Voltar às propostas
        </Link>
      </div>

      {/* 1 · Instalação e produto */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>1 · Instalação e produto</h2>
            <p>Local, módulo e inversor</p>
          </div>
        </div>
        <div className="form-grid">
          <label className="form-field">
            <span>Local de instalação</span>
            <select value={instalacao} onChange={(e) => setInstalacao(e.target.value as "telhado" | "solo")}>
              <option value="telhado">Telhado</option>
              <option value="solo">Solo</option>
            </select>
          </label>
          <label className="form-field">
            <span>Tipo de módulo</span>
            <select value={moduloWp} onChange={(e) => setModuloWp(e.target.value)}>
              <option value="620">620 Wp (1,13×2,38m)</option>
              <option value="700">700 Wp (1,30×2,38m)</option>
            </select>
          </label>
          <label className="form-field">
            <span>Inversor</span>
            <select
              value={inversorForcado}
              onChange={(e) => setInversor(e.target.value as "auto" | "string" | "micro")}
            >
              <option value="auto">Automático</option>
              <option value="string">String</option>
              <option value="micro">Microinversor</option>
            </select>
          </label>
          <label className="form-field">
            <span>Adequação trifásica (entra só no Telhado Rentável)</span>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={adequacaoTrifasica ? "sim" : "nao"}
                onChange={(e) => setAdequacao(e.target.value === "sim")}
                style={{ flex: 1 }}
              >
                <option value="nao">Não incluir</option>
                <option value="sim">Incluir</option>
              </select>
              {adequacaoTrifasica ? (
                <select value={adequacaoValor} onChange={(e) => setAdequacaoValor(e.target.value)} style={{ flex: 1 }}>
                  {ADEQUACAO_OPCOES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          </label>
        </div>
      </section>

      {/* 2 · Telhados */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>2 · Telhados</h2>
            <p>Dimensões de cada água — usado no Telhado Rentável e na escolha do inversor</p>
          </div>
          <button type="button" className="btn-secondary" onClick={addTelhado}>
            <Plus size={16} /> Adicionar telhado
          </button>
        </div>
        {telhados.map((t, i) => (
          <div key={i} className="form-grid" style={{ alignItems: "end", marginBottom: 10 }}>
            <label className="form-field">
              <span>Telhado {i + 1} — largura (m)</span>
              <input type="number" step="0.1" min="0" value={t.largura} placeholder="6.0"
                onChange={(e) => setTelhado(i, { largura: e.target.value })} />
            </label>
            <label className="form-field">
              <span>Comprimento (m)</span>
              <input type="number" step="0.1" min="0" value={t.comprimento} placeholder="10.0"
                onChange={(e) => setTelhado(i, { comprimento: e.target.value })} />
            </label>
            <label className="form-field">
              <span>Aproveitamento (%)</span>
              <input type="number" step="1" min="10" max="100" value={t.aproveitamento}
                onChange={(e) => setTelhado(i, { aproveitamento: e.target.value })} />
            </label>
            {telhados.length > 1 ? (
              <button type="button" className="btn-link danger" onClick={() => removeTelhado(i)}>
                <Trash2 size={14} /> Remover
              </button>
            ) : null}
          </div>
        ))}
        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          Fator de aproveitamento desconta sombras, beirais e espaços (80% é o padrão). Com 3+ telhados o inversor vira micro automaticamente.
        </p>
      </section>

      {/* 3 · Dados elétricos e consumo */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>3 · Dados elétricos e consumo</h2>
            <p>Consumo, tarifa e irradiação</p>
          </div>
        </div>
        <div className="form-grid">
          <label className="form-field">
            <span>Padrão existente</span>
            <select value={padrao} onChange={(e) => setPadrao(e.target.value as "mono" | "bi" | "tri")}>
              <option value="mono">1F Monofásico</option>
              <option value="bi">2F Bifásico</option>
              <option value="tri">3F Trifásico</option>
            </select>
          </label>
          <label className="form-field">
            <span>Consumo médio mensal (kWh)</span>
            <input type="number" min="50" value={consumoKwh} placeholder="ex: 850"
              onChange={(e) => setConsumo(e.target.value)} />
          </label>
          <label className="form-field">
            <span>Tarifa (R$/kWh, com impostos)</span>
            <input type="number" step="0.01" value={tarifa} placeholder="ex: 0.85"
              onChange={(e) => setTarifa(e.target.value)} />
          </label>
          <label className="form-field">
            <span>Irradiação — HSP</span>
            <select value={hsp} onChange={(e) => setHsp(e.target.value)}>
              {HSP_OPCOES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Compensação</span>
            <select value={compensacaoPct} onChange={(e) => setCompensacao(e.target.value)}>
              {COMPENSACAO_OPCOES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* 4 · Cliente */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>4 · Cliente</h2>
            <p>Vincule aos cadastros do sistema</p>
          </div>
        </div>
        <div className="form-grid">
          <label className="form-field">
            <span>Cliente</span>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
              <option value="">Selecione…</option>
              {clientes.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Unidade consumidora</span>
            <select value={unidadeConsumidoraId} onChange={(e) => setUnidade(e.target.value)}>
              <option value="">—</option>
              {unidades.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Distribuidora</span>
            <select value={distribuidoraId} onChange={(e) => setDistribuidora(e.target.value)}>
              <option value="">—</option>
              {distribuidoras.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field full-span">
            <span>Observação</span>
            <input type="text" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </label>
        </div>
      </section>

      {erro ? (
        <p style={{ color: "var(--danger)", fontWeight: 700, marginBottom: 12 }}>{erro}</p>
      ) : null}

      <div className="form-actions">
        <button type="button" className="btn-primary" onClick={gerar} disabled={busy}>
          {busy ? "Gerando…" : "Gerar proposta"}
        </button>
      </div>
    </>
  );
}

// ─────────────────────────── Resultado ───────────────────────────

function kpisCenario(c: CenarioResultado): SummaryItem[] {
  const itens: SummaryItem[] = [
    { label: "Potência", value: `${num(c.potenciaKwp, 2)} kWp`, hint: `${num(c.qtdModulos)} × ${c.moduloWp}Wp` },
    { label: "Geração / mês", value: `${num(c.geracaoMensalKwh)} kWh`, hint: `${num(c.geracaoAnualKwh)} kWh/ano` },
    { label: "Inversor", value: c.inversor.label, hint: c.inversor.disjuntor },
    { label: "Investimento", value: brl(c.precoFinal), hint: `${brl(c.precoPorKwp)}/kWp` },
    {
      label: c.cenario === "necessario" ? "Economia mensal" : "Receita mensal",
      value: brl(c.retornoMensal),
      tone: "ok",
    },
    { label: "Payback", value: anos(c.paybackAnos), hint: `TIR ${num(c.tirPercent, 1)}% a.a.` },
    { label: "Retorno 25 anos", value: brl(c.economia25Anos), hint: `${num(c.co2Toneladas, 1)} t CO₂`, tone: "ok" },
  ];
  if (c.excedenteKwh > 0) {
    itens.splice(3, 0, {
      label: "Excedente",
      value: `${num(c.excedenteKwh)} kWh`,
      hint: `${brl(c.creditoExcedente)}/mês em crédito`,
    });
  }
  return itens;
}

function RoiChart({ cenario }: { cenario: CenarioResultado }) {
  const data = cenario.projecao25Anos.map((p) => ({
    ano: p.ano,
    acumulado: p.acumuladoRetorno,
    liquido: p.retornoLiquido,
  }));
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,144,155,0.18)" />
          <XAxis dataKey="ano" tick={{ fontSize: 11, fill: AXIS }} />
          <YAxis tick={{ fontSize: 11, fill: AXIS }} width={52}
            tickFormatter={(v) => `R$${Math.round(Number(v) / 1000)}k`} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => brl(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="acumulado" name="Retorno acumulado" stroke="#1A7A4A" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="liquido" name="Retorno líquido" stroke="#C89B3C" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function GeracaoChart({ resultado }: { resultado: GeradorResultado }) {
  const data = MESES.map((mes, i) => ({
    mes,
    necessario: resultado.necessario.geracaoMensalPorMes[i],
    rentavel: resultado.rentavel?.geracaoMensalPorMes[i] ?? null,
  }));
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,144,155,0.18)" />
          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: AXIS }} />
          <YAxis tick={{ fontSize: 11, fill: AXIS }} width={48} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `${num(Number(v))} kWh`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="necessario" name="Sistema necessário" fill="#C89B3C" radius={[3, 3, 0, 0]} />
          {resultado.rentavel ? (
            <Bar dataKey="rentavel" name="Telhado rentável" fill="#6D28D9" radius={[3, 3, 0, 0]} />
          ) : null}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustoInterno({ cenario }: { cenario: CenarioResultado }) {
  const c = cenario.custo;
  const linhas: [string, string][] = [
    ["Kit FV", brl(c.kit)],
    ...(c.estruturaSolo > 0 ? ([["Estrutura de solo", brl(c.estruturaSolo)]] as [string, string][]) : []),
    ["Mão de obra", brl(c.maoDeObra)],
    ["Materiais AC", brl(c.materiaisAc)],
    ...(c.adequacao > 0 ? ([["Adequação trifásica", brl(c.adequacao)]] as [string, string][]) : []),
    ["Impostos", brl(c.imposto)],
    ["Custo total", brl(c.custoTotal)],
    [`Margem (${num(c.margemPercent, 1)}%)`, brl(c.margemValor)],
    ["Preço final", brl(cenario.precoFinal)],
  ];
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <tbody>
        {linhas.map(([k, v], i) => (
          <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
            <td style={{ padding: "6px 8px", color: "var(--muted)" }}>{k}</td>
            <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 600 }}>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CenarioCard({ cenario, titulo }: { cenario: CenarioResultado; titulo: string }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>{titulo}</h2>
        </div>
      </div>
      <SummaryStrip items={kpisCenario(cenario)} />
      <div className="split-grid" style={{ marginTop: 14 }}>
        <div>
          <h3 style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>Retorno do investimento (25 anos)</h3>
          <RoiChart cenario={cenario} />
        </div>
      </div>
    </section>
  );
}

function Resultado({
  resultado,
  mostrarCusto,
  onToggleCusto,
  onNova,
  onPdf,
}: {
  resultado: GeradorResultado;
  mostrarCusto: boolean;
  onToggleCusto: () => void;
  onNova: () => void;
  onPdf: () => void;
}) {
  return (
    <>
      <div className="form-actions" style={{ marginBottom: 14 }}>
        <button type="button" className="btn-primary" onClick={onPdf}>
          <Download size={16} /> Baixar PDF (cliente)
        </button>
        <button type="button" className="btn-secondary" onClick={onNova}>
          <RotateCcw size={16} /> Nova simulação
        </button>
        <button type="button" className="btn-ghost" onClick={onToggleCusto}>
          {mostrarCusto ? "Ocultar" : "Ver"} custos e margem (uso interno)
        </button>
      </div>

      {/* Alertas */}
      {resultado.telhadoSuficiente === false ? (
        <div className="status-banner" style={{ marginBottom: 12 }}>
          <div className="status-banner-body">
            ⚠️ O telhado disponível ({num(resultado.telhadoTotalModulos)} módulos ·{" "}
            {num(resultado.telhadoTotalKwp, 2)} kWp) é menor que o necessário.
          </div>
        </div>
      ) : null}
      {resultado.trifasicoObrigatorio ? (
        <div className="status-banner" style={{ marginBottom: 12 }}>
          <div className="status-banner-body">
            ⚡ Sistema acima de 14 kWp — padrão trifásico obrigatório.
          </div>
        </div>
      ) : null}
      {resultado.microForcado ? (
        <div className="status-banner" style={{ marginBottom: 12 }}>
          <div className="status-banner-body">
            🔲 3+ telhados — microinversor selecionado automaticamente.
          </div>
        </div>
      ) : null}

      <CenarioCard cenario={resultado.necessario} titulo="Proposta 1 — Sistema Necessário (pelo consumo)" />

      {resultado.rentavel ? (
        <CenarioCard cenario={resultado.rentavel} titulo="Proposta 2 — Telhado Rentável (todo o telhado)" />
      ) : (
        <section className="panel">
          <p style={{ color: "var(--muted)" }}>
            Informe as dimensões do telhado para gerar também a Proposta 2 (Telhado Rentável).
          </p>
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Geração mensal estimada</h2>
          </div>
        </div>
        <GeracaoChart resultado={resultado} />
      </section>

      {mostrarCusto ? (
        <section className="panel" style={{ border: "1px solid var(--gold, #C89B3C)" }}>
          <div className="panel-header">
            <div>
              <h2>Custos e margem — uso interno</h2>
              <p>Não sai no PDF do cliente</p>
            </div>
          </div>
          <div className="split-grid">
            <div>
              <h3 style={{ fontSize: 13, marginBottom: 8 }}>Sistema Necessário</h3>
              <CustoInterno cenario={resultado.necessario} />
            </div>
            {resultado.rentavel ? (
              <div>
                <h3 style={{ fontSize: 13, marginBottom: 8 }}>Telhado Rentável</h3>
                <CustoInterno cenario={resultado.rentavel} />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
