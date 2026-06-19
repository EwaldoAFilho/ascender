"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, PlugZap } from "lucide-react";
import {
  fetchCredentials,
  saveCredentials,
  testConnection,
} from "@/lib/api/soliscloud";
import { DigitalGridCard } from "@/components/DigitalGridCard";
import { errorMessage } from "@/components/states";

type Feedback = { kind: "ok" | "error"; text: string } | null;

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

export default function ConfiguracoesIntegracoesPage() {
  const credentials = useQuery({
    queryKey: ["integrations", "soliscloud", "credentials"],
    queryFn: fetchCredentials,
  });

  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const data = credentials.data;
  const configured = data?.configured ?? false;

  function statusBadge() {
    if (!configured)
      return { className: "status-pendente-validacao", label: "Nao configurado" };
    if (data?.lastTestOk === true)
      return { className: "status-online", label: "Conectado" };
    if (data?.lastTestOk === false)
      return { className: "status-offline", label: "Falha no ultimo teste" };
    return { className: "status-aguardando", label: "Nunca testado" };
  }

  async function handleSave() {
    setFeedback(null);
    if (!keyId.trim()) {
      setFeedback({ kind: "error", text: "Informe o KeyId." });
      return;
    }
    if (!keySecret.trim() && !configured) {
      setFeedback({ kind: "error", text: "Informe o KeySecret." });
      return;
    }
    setSaving(true);
    try {
      await saveCredentials({
        keyId: keyId.trim(),
        keySecret: keySecret.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
      });
      setKeySecret("");
      setFeedback({ kind: "ok", text: "Credenciais salvas." });
      await credentials.refetch();
    } catch (error) {
      setFeedback({ kind: "error", text: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(useTyped: boolean) {
    setFeedback(null);
    setTesting(true);
    try {
      const result = await testConnection(
        useTyped
          ? {
              keyId: keyId.trim(),
              keySecret: keySecret.trim(),
              baseUrl: baseUrl.trim() || undefined,
            }
          : undefined,
      );
      if (result.ok) {
        setFeedback({
          kind: "ok",
          text: `Conectado — ${result.stationCount ?? 0} usina(s) encontrada(s).`,
        });
      } else {
        setFeedback({
          kind: "error",
          text: result.error ?? "Falha ao conectar.",
        });
      }
      if (!useTyped) await credentials.refetch();
    } catch (error) {
      setFeedback({ kind: "error", text: errorMessage(error) });
    } finally {
      setTesting(false);
    }
  }

  const badge = statusBadge();

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>SolisCloud</h2>
            <p>Credenciais de API para a telemetria das usinas (dados reais).</p>
          </div>
          <span className={`status ${badge.className}`}>{badge.label}</span>
        </div>
        <div className="summary-list">
          <div>
            <span>KeyId</span>
            <strong>{data?.keyIdMasked ?? "não configurado"}</strong>
          </div>
          <div>
            <span>URL base</span>
            <strong>{data?.baseUrl ?? "—"}</strong>
          </div>
          <div>
            <span>Último teste</span>
            <strong>{formatDateTime(data?.lastTestAt ?? null)}</strong>
          </div>
        </div>
        <div className="form-actions">
          <button
            type="button"
            onClick={() => handleTest(false)}
            disabled={testing || !configured}
          >
            {testing ? "Testando…" : "Testar conexão salva"}
          </button>
        </div>
      </section>

      <section className="split-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>
                <PlugZap
                  size={18}
                  style={{ verticalAlign: "-3px", marginRight: 6 }}
                />
                {configured ? "Atualizar credenciais" : "Configurar SolisCloud"}
              </h2>
              <p>O KeySecret é armazenado cifrado e nunca é exibido de volta.</p>
            </div>
          </div>
          <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
            <label className="form-field">
              <span>KeyId (API ID)</span>
              <input
                value={keyId}
                onChange={(event) => setKeyId(event.target.value)}
                placeholder={data?.keyIdMasked ?? "Cole o KeyId da SolisCloud"}
                autoComplete="off"
              />
            </label>
            <label className="form-field">
              <span>KeySecret</span>
              <span style={{ position: "relative", display: "block" }}>
                <input
                  type={showSecret ? "text" : "password"}
                  value={keySecret}
                  onChange={(event) => setKeySecret(event.target.value)}
                  placeholder={
                    configured
                      ? "•••• configurado (deixe vazio para manter)"
                      : "Cole o KeySecret"
                  }
                  autoComplete="off"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((value) => !value)}
                  aria-label={showSecret ? "Ocultar" : "Mostrar"}
                  title={showSecret ? "Ocultar" : "Mostrar"}
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
                  {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <label className="form-field">
              <span>URL base (opcional)</span>
              <input
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder={data?.baseUrl ?? "https://www.soliscloud.com:13333"}
                autoComplete="off"
              />
            </label>
          </div>
          {feedback ? (
            <p
              style={{
                marginTop: 12,
                fontWeight: 800,
                color:
                  feedback.kind === "ok" ? "var(--success)" : "var(--danger)",
              }}
            >
              {feedback.text}
            </p>
          ) : null}
          <div className="form-actions">
            <button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => handleTest(true)}
              disabled={testing || !keyId.trim() || !keySecret.trim()}
            >
              {testing ? "Testando…" : "Testar credenciais digitadas"}
            </button>
          </div>
        </section>

        <DigitalGridCard />
      </section>
    </>
  );
}
