"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Não foi possível entrar.");
        setLoading(false);
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && next.startsWith("/") ? next : "/");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-hero">
        <div className="login-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-black.jpeg" alt="ASCENDER Energia Solar" />
        </div>

        <div className="login-hero-bottom">
          <div className="login-hero-copy">
            <p className="eyebrow">Plataforma de gestão solar</p>
            <h1>
              Energia que <em>ascende</em>.
            </h1>
            <p className="lead">
              Acompanhe geração, financeiro e clientes das usinas da ASCENDER —
              com dados reais da SolisCloud e do Digital Grid, em um só lugar.
            </p>
          </div>

          <div className="login-points">
            <span>Geração em tempo real</span>
            <span>Financeiro integrado</span>
            <span>Multiusuário</span>
          </div>
        </div>
      </section>

      <section className="login-form-side">
        <div className="login-card">
          <h2>Entrar</h2>
          <p className="sub">Acesse o painel da ASCENDER.</p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="login-field">
              <span>E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                placeholder="voce@ascenderenergiasolar.com"
                required
              />
            </label>
            <label className="login-field">
              <span>Senha</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </label>

            {error ? (
              <p className="login-error" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="login-foot">ASCENDER Energia Solar · Brasília-DF</p>
        </div>
      </section>
    </div>
  );
}
