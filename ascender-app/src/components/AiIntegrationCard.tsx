"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BrainCircuit, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { errorMessage } from "@/components/states";
import { fetchAiStatus, saveAiProvider, testAi } from "@/lib/api/ai";
import {
  AI_PROVIDER_LIST,
  AI_PROVIDERS,
  normalizeAiModel,
  type AiProvider,
} from "@/lib/ai/providers";

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

export function AiIntegrationCard() {
  const status = useQuery({
    queryKey: ["integrations", "ai", "status"],
    queryFn: fetchAiStatus,
  });

  const [provider, setProvider] = useState<AiProvider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(AI_PROVIDERS.anthropic.defaultModel);
  const [baseUrl, setBaseUrl] = useState("");
  const [makeActive, setMakeActive] = useState(true);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const toast = useToast();

  const list = status.data ?? [];
  const current = list.find((p) => p.provider === provider);
  const activeProvider = list.find((p) => p.active)?.provider ?? null;
  const info = AI_PROVIDERS[provider];

  // Sincroniza o formulário com o estado salvo quando o provedor muda ou o
  // status (re)carrega.
  useEffect(() => {
    const saved = (status.data ?? []).find((p) => p.provider === provider);
    setModel(normalizeAiModel(provider, saved?.model));
    setMakeActive(
      saved?.active ?? !(status.data ?? []).some((p) => p.active),
    );
    setApiKey("");
    setBaseUrl("");
    setShow(false);
  }, [provider, status.data]);

  function badge() {
    if (!current?.configured)
      return { cls: "status-pendente-validacao", label: "não configurado" };
    if (current.lastTestOk === true)
      return { cls: "status-online", label: "conectado" };
    if (current.lastTestOk === false)
      return { cls: "status-offline", label: "falha no último teste" };
    return { cls: "status-aguardando", label: "nunca testado" };
  }

  async function salvar() {
    if (!apiKey.trim() && !current?.configured) {
      toast({ message: "Informe a chave de API.", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await saveAiProvider({
        provider,
        apiKey: apiKey.trim() || undefined,
        model,
        baseUrl: baseUrl.trim() || undefined,
        makeActive,
      });
      setApiKey("");
      toast({ message: "Configuração de IA salva." });
      await status.refetch();
    } catch (error) {
      toast({ message: errorMessage(error), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function testar(useTyped: boolean) {
    setTesting(true);
    try {
      const r = await testAi({
        provider,
        apiKey: useTyped ? apiKey.trim() : undefined,
        baseUrl: baseUrl.trim() || undefined,
      });
      if (r.ok) {
        toast({
          message: `Chave válida${
            r.modelCount != null ? ` — ${r.modelCount} modelos disponíveis` : ""
          }.`,
        });
      } else {
        toast({ message: r.error ?? "Falha ao validar a chave.", variant: "error" });
      }
      if (!useTyped) await status.refetch();
    } catch (error) {
      toast({ message: errorMessage(error), variant: "error" });
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
            <BrainCircuit
              size={18}
              style={{ verticalAlign: "-3px", marginRight: 6 }}
            />
            Inteligência Artificial (IA)
          </h2>
          <p>
            Provedor e modelo para leitura automática de PDFs (faturas). A chave é
            guardada cifrada e nunca exibida de volta.
          </p>
        </div>
        <span className={`status ${b.cls}`}>{b.label}</span>
      </div>

      <div
        className="form-actions"
        style={{ marginTop: 0, marginBottom: 14, gap: 8 }}
      >
        {AI_PROVIDER_LIST.map((p) => {
          const selected = p === provider;
          const isActive = activeProvider === p;
          return (
            <button
              key={p}
              type="button"
              className={selected ? undefined : "secondary"}
              onClick={() => setProvider(p)}
            >
              {AI_PROVIDERS[p].label}
              {isActive ? " ✓ ativo" : ""}
            </button>
          );
        })}
      </div>

      <div className="summary-list">
        <div>
          <span>Provedor ativo</span>
          <strong>
            {activeProvider ? AI_PROVIDERS[activeProvider].label : "nenhum"}
          </strong>
        </div>
        <div>
          <span>Modelo salvo</span>
          <strong>{current?.configured ? current.model : "—"}</strong>
        </div>
        <div>
          <span>Último teste</span>
          <strong>{formatDateTime(current?.lastTestAt ?? null)}</strong>
        </div>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
        <label className="form-field">
          <span>Modelo</span>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {info.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Chave de API ({info.label})</span>
          <span style={{ position: "relative", display: "block" }}>
            <input
              type={show ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                current?.configured
                  ? "•••• configurada (deixe vazio para manter)"
                  : "Cole a chave de API"
              }
              autoComplete="off"
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Ocultar" : "Mostrar"}
              title={show ? "Ocultar" : "Mostrar"}
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
            placeholder={current?.baseUrl ?? info.defaultBaseUrl}
            autoComplete="off"
          />
        </label>

        <label
          className="form-field"
          style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          <input
            type="checkbox"
            checked={makeActive}
            onChange={(e) => setMakeActive(e.target.checked)}
            style={{ width: "auto" }}
          />
          <span style={{ margin: 0 }}>
            Definir como provedor ativo (usado na leitura de PDFs)
          </span>
        </label>
      </div>

      <div className="form-actions">
        <button type="button" onClick={salvar} disabled={saving}>
          {saving ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => testar(true)}
          disabled={testing || !apiKey.trim()}
        >
          {testing ? "Testando…" : "Testar chave digitada"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => testar(false)}
          disabled={testing || !current?.configured}
        >
          {testing ? "Testando…" : "Testar chave salva"}
        </button>
      </div>
    </section>
  );
}
