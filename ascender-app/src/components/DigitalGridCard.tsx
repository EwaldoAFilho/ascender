"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleDollarSign, Eye, EyeOff } from "lucide-react";
import { fetchDgStatus, saveDgToken, testDg } from "@/lib/api/digitalgrid";

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

export function DigitalGridCard() {
  const status = useQuery({
    queryKey: ["integrations", "digitalgrid", "status"],
    queryFn: fetchDgStatus,
  });
  const [token, setToken] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [fb, setFb] = useState<{ ok: boolean; text: string } | null>(null);

  const d = status.data;
  const configured = d?.configured ?? false;

  function badge() {
    if (!configured)
      return { cls: "status-pendente-validacao", label: "não configurado" };
    if (d?.lastTestOk === true) return { cls: "status-online", label: "conectado" };
    if (d?.lastTestOk === false)
      return { cls: "status-offline", label: "falha no último teste" };
    return { cls: "status-aguardando", label: "nunca testado" };
  }

  async function salvar() {
    setFb(null);
    if (!token.trim()) {
      setFb({ ok: false, text: "Cole o token do Digital Grid." });
      return;
    }
    setSaving(true);
    try {
      await saveDgToken({ token: token.trim(), baseUrl: baseUrl.trim() || undefined });
      setToken("");
      setFb({ ok: true, text: "Token salvo." });
      await status.refetch();
    } catch (e) {
      setFb({ ok: false, text: e instanceof Error ? e.message : "Erro ao salvar." });
    } finally {
      setSaving(false);
    }
  }

  async function testar(useTyped: boolean) {
    setFb(null);
    setTesting(true);
    try {
      const r = await testDg(
        useTyped
          ? { token: token.trim(), baseUrl: baseUrl.trim() || undefined }
          : undefined,
      );
      if (r.ok) {
        setFb({
          ok: true,
          text: `Conectado via ${r.scheme}${r.count != null ? ` — ${r.count} agente(s)` : ""}.`,
        });
      } else {
        setFb({ ok: false, text: r.error ?? "Falha ao conectar." });
      }
      if (!useTyped) await status.refetch();
    } catch (e) {
      setFb({ ok: false, text: e instanceof Error ? e.message : "Erro." });
    } finally {
      setTesting(false);
    }
  }

  const b = badge();

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>
            <CircleDollarSign
              size={18}
              style={{ verticalAlign: "-3px", marginRight: 6 }}
            />
            Digital Grid
          </h2>
          <p>Token da Billing API (faturas e rateio). Guardado cifrado.</p>
        </div>
        <span className={`status ${b.cls}`}>{b.label}</span>
      </div>

      <div className="summary-list">
        <div>
          <span>URL base</span>
          <strong>{d?.baseUrl ?? "https://gestao.dg.energy/api/v1"}</strong>
        </div>
        <div>
          <span>Último teste</span>
          <strong>{formatDateTime(d?.lastTestAt ?? null)}</strong>
        </div>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
        <label className="form-field">
          <span>Token de acesso</span>
          <span style={{ position: "relative", display: "block" }}>
            <input
              type={show ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={
                configured
                  ? "•••• configurado (cole para substituir)"
                  : "Cole o token do Digital Grid"
              }
              autoComplete="off"
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Ocultar" : "Mostrar"}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: 0,
                cursor: "pointer",
                color: "var(--muted)",
              }}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>
        <label className="form-field">
          <span>URL base (opcional)</span>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={d?.baseUrl ?? "https://gestao.dg.energy/api/v1"}
            autoComplete="off"
          />
        </label>
      </div>

      {fb ? (
        <p
          style={{
            marginTop: 12,
            fontWeight: 800,
            color: fb.ok ? "var(--success)" : "var(--danger)",
          }}
        >
          {fb.text}
        </p>
      ) : null}

      <div className="form-actions">
        <button type="button" onClick={salvar} disabled={saving}>
          {saving ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => testar(true)}
          disabled={testing || !token.trim()}
        >
          {testing ? "Testando…" : "Testar token digitado"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => testar(false)}
          disabled={testing || !configured}
        >
          {testing ? "Testando…" : "Testar conexão salva"}
        </button>
      </div>
    </section>
  );
}
