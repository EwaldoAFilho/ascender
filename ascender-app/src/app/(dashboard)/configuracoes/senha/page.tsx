"use client";

import { useState, type FormEvent } from "react";

export default function SenhaPage() {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [conf, setConf] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMsg(null);
    if (nova.length < 8) {
      setMsg({ ok: false, text: "A nova senha deve ter ao menos 8 caracteres." });
      return;
    }
    if (nova !== conf) {
      setMsg({ ok: false, text: "A confirmação não confere com a nova senha." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: atual, newPassword: nova }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setMsg({ ok: true, text: "Senha alterada com sucesso." });
        setAtual("");
        setNova("");
        setConf("");
      } else {
        setMsg({ ok: false, text: data.error ?? "Não foi possível alterar a senha." });
      }
    } catch {
      setMsg({ ok: false, text: "Erro de conexão. Tente novamente." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" style={{ maxWidth: 560 }}>
      <div className="panel-header">
        <div>
          <h2>Trocar senha</h2>
          <p>Altere a senha de acesso ao sistema.</p>
        </div>
      </div>
      <form onSubmit={submit}>
        <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
          <label className="form-field">
            <span>Senha atual</span>
            <input
              type="password"
              value={atual}
              onChange={(e) => setAtual(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <label className="form-field">
            <span>Nova senha</span>
            <input
              type="password"
              value={nova}
              onChange={(e) => setNova(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <label className="form-field">
            <span>Confirmar nova senha</span>
            <input
              type="password"
              value={conf}
              onChange={(e) => setConf(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
        </div>
        {msg ? (
          <p
            style={{
              fontWeight: 800,
              marginTop: 12,
              color: msg.ok ? "var(--success)" : "var(--danger)",
            }}
          >
            {msg.text}
          </p>
        ) : null}
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Salvando…" : "Alterar senha"}
          </button>
        </div>
      </form>
    </section>
  );
}
