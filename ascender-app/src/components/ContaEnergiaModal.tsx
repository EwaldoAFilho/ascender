"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, UploadCloud, X, Zap } from "lucide-react";
import { formatData, moneyFormatter } from "@/lib/dashboard-data";

type Tributos = { pis: number | null; cofins: number | null; icms: number | null };
type Item = { descricao: string; valor: number | null };

type ContaView = {
  arquivoNome: string | null;
  cliente: string | null;
  competencia: string | null;
  vencimento: string | null;
  valor: number | null;
  notaFiscal: string | null;
  codigoBarras: string | null;
  leituraAnteriorData: string | null;
  leituraData: string | null;
  leituraProximaData: string | null;
  numeroDias: number | null;
  energiaKwh: number | null;
  tributos: Tributos | null;
  itensFatura: Item[] | null;
  aviso: string | null;
  sceeExcedenteKwh: number | null;
  sceeCreditosKwh: number | null;
  sceeSaldoProximoKwh: number | null;
  sceeSaldoAnteriorKwh: number | null;
  sceeTransfKwh: number | null;
  sceeInjetadoKwh: number | null;
  sceeCompensadoKwh: number | null;
  sceeSaldoAtualKwh: number | null;
};

const kwh = (n: number | null) =>
  n == null ? "—" : `${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} kWh`;
const brl = (n: number | null) => (n == null ? "—" : moneyFormatter.format(n));

function Campo({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{valor ?? "—"}</strong>
    </div>
  );
}

export function ContaEnergiaModal({
  faturaDgId,
  titulo,
  onClose,
  onChanged,
}: {
  faturaDgId: string;
  titulo: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [conta, setConta] = useState<ContaView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/financeiro/conta?faturaDgId=${encodeURIComponent(faturaDgId)}`,
        { credentials: "include" },
      );
      const data = await res.json();
      setConta(data?.conta ?? null);
    } catch {
      setConta(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faturaDgId]);

  async function enviar(file: File) {
    setBusy(true);
    setErro(null);
    try {
      const fd = new FormData();
      fd.append("faturaDgId", faturaDgId);
      fd.append("file", file);
      const res = await fetch("/api/financeiro/conta", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErro(data?.error ?? "Falha no envio.");
      } else {
        await carregar();
        onChanged();
      }
    } catch {
      setErro("Falha ao enviar o arquivo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Conta de energia"
        style={{ maxWidth: 720 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Conta de energia — {titulo}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) enviar(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            <UploadCloud size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
            {busy ? "Processando…" : conta ? "Substituir PDF" : "Anexar PDF da conta"}
          </button>
          {conta ? (
            <a
              className="btn-secondary"
              href={`/api/financeiro/conta/file?faturaDgId=${encodeURIComponent(faturaDgId)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
              Abrir PDF
            </a>
          ) : null}
        </div>

        {erro ? (
          <p style={{ color: "var(--danger)", fontWeight: 800 }}>{erro}</p>
        ) : null}

        {loading ? (
          <p style={{ color: "var(--muted)" }}>Carregando…</p>
        ) : !conta ? (
          <p style={{ color: "var(--muted)" }}>
            Nenhuma conta anexada. Envie o PDF da conta de energia (modelo
            Neoenergia) — os campos serão extraídos automaticamente.
          </p>
        ) : (
          <>
            {(() => {
              const layoutB = conta.sceeSaldoAtualKwh != null;
              const temScee =
                layoutB ||
                conta.sceeSaldoProximoKwh != null ||
                conta.sceeCreditosKwh != null ||
                conta.sceeExcedenteKwh != null;
              if (!temScee) return null;
              return (
                <div
                  className="panel"
                  style={{
                    margin: "0 0 14px",
                    padding: 14,
                    borderLeft: "4px solid var(--success)",
                  }}
                >
                  <strong style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Zap size={16} style={{ color: "var(--success)" }} /> Créditos (SCEE)
                  </strong>
                  <div className="summary-list" style={{ marginTop: 8 }}>
                    {layoutB ? (
                      <>
                        <Campo label="Saldo anterior" valor={kwh(conta.sceeSaldoAnteriorKwh)} />
                        <Campo label="Injetado" valor={kwh(conta.sceeInjetadoKwh)} />
                        <Campo label="Compensado" valor={kwh(conta.sceeCompensadoKwh)} />
                        <Campo
                          label="Saldo atual"
                          valor={
                            <span style={{ color: "var(--success)" }}>
                              {kwh(conta.sceeSaldoAtualKwh)}
                            </span>
                          }
                        />
                      </>
                    ) : (
                      <>
                        <Campo label="Excedente" valor={kwh(conta.sceeExcedenteKwh)} />
                        <Campo label="Créditos utilizados" valor={kwh(conta.sceeCreditosKwh)} />
                        <Campo
                          label="Saldo p/ próximo ciclo"
                          valor={
                            <span style={{ color: "var(--success)" }}>
                              {kwh(conta.sceeSaldoProximoKwh)}
                            </span>
                          }
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="summary-list">
              <Campo label="Cliente" valor={conta.cliente} />
              <Campo label="Valor" valor={brl(conta.valor)} />
              <Campo label="Vencimento" valor={formatData(conta.vencimento)} />
              <Campo label="Nota fiscal" valor={conta.notaFiscal} />
              <Campo label="Consumo faturado" valor={kwh(conta.energiaKwh)} />
              <Campo label="Nº de dias" valor={conta.numeroDias} />
              <Campo label="Leitura anterior" valor={formatData(conta.leituraAnteriorData)} />
              <Campo label="Leitura atual" valor={formatData(conta.leituraData)} />
              <Campo label="Próxima leitura" valor={formatData(conta.leituraProximaData)} />
              <Campo
                label="Tributos (PIS/COFINS/ICMS)"
                valor={`${brl(conta.tributos?.pis ?? null)} / ${brl(conta.tributos?.cofins ?? null)} / ${brl(conta.tributos?.icms ?? null)}`}
              />
            </div>

            {conta.codigoBarras ? (
              <p style={{ marginTop: 12 }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Linha digitável</span>
                <br />
                <code style={{ fontSize: 13 }}>{conta.codigoBarras}</code>
              </p>
            ) : null}

            {conta.itensFatura && conta.itensFatura.length > 0 ? (
              <div style={{ marginTop: 12 }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Itens da fatura</span>
                <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                  {conta.itensFatura.map((it, i) => (
                    <li key={i}>
                      {it.descricao}: {brl(it.valor)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {conta.aviso ? (
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: "pointer", color: "var(--muted)" }}>
                  Informações importantes
                </summary>
                <p style={{ whiteSpace: "pre-wrap", fontSize: 13, marginTop: 6 }}>
                  {conta.aviso}
                </p>
              </details>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
