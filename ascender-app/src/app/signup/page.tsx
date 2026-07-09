"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { signupAction } from "@/lib/auth/signup-actions";

const VAZIO = {
  nomeEmpresa: "",
  donoNome: "",
  donoEmail: "",
  donoSenha: "",
  website: "", // honeypot
};

export default function SignupPage() {
  const [form, setForm] = useState(VAZIO);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await signupAction(form);
      if (r.ok) {
        setSucesso(true);
      } else {
        setError(r.error);
        setLoading(false);
      }
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
              Sua integradora, <em>no controle</em>.
            </h1>
            <p className="lead">
              Gestão de usinas, geração, financeiro e propostas — com dados reais
              da SolisCloud e do Digital Grid. Cadastre sua empresa e comece a
              avaliar.
            </p>
          </div>

          <div className="login-points">
            <span>Geração em tempo real</span>
            <span>Financeiro integrado</span>
            <span>Propostas comerciais</span>
          </div>
        </div>
      </section>

      <section className="login-form-side">
        <div className="login-card">
          {sucesso ? (
            <>
              <h2>Cadastro recebido!</h2>
              <p className="sub">
                Recebemos o cadastro da sua empresa. Nossa equipe vai revisar e
                liberar o acesso — você poderá entrar assim que for aprovado.
              </p>
              <Link href="/login" className="login-submit" style={{ textAlign: "center", display: "block", textDecoration: "none" }}>
                Voltar para o login
              </Link>
            </>
          ) : (
            <>
              <h2>Cadastre sua empresa</h2>
              <p className="sub">
                Crie a conta da sua integradora. O acesso é liberado após
                aprovação.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <label className="login-field">
                  <span>Nome da empresa</span>
                  <input
                    value={form.nomeEmpresa}
                    onChange={(e) => setForm({ ...form, nomeEmpresa: e.target.value })}
                    placeholder="Sua Integradora Solar Ltda"
                    required
                  />
                </label>
                <label className="login-field">
                  <span>Seu nome</span>
                  <input
                    value={form.donoNome}
                    onChange={(e) => setForm({ ...form, donoNome: e.target.value })}
                    autoComplete="name"
                    placeholder="Seu nome completo"
                    required
                  />
                </label>
                <label className="login-field">
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={form.donoEmail}
                    onChange={(e) => setForm({ ...form, donoEmail: e.target.value })}
                    autoComplete="email"
                    placeholder="voce@suaempresa.com"
                    required
                  />
                </label>
                <label className="login-field">
                  <span>Senha (mín. 8 caracteres)</span>
                  <input
                    type="password"
                    value={form.donoSenha}
                    onChange={(e) => setForm({ ...form, donoSenha: e.target.value })}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    required
                  />
                </label>

                {/* Honeypot: escondido de humanos; se vier preenchido, é bot. */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
                  aria-hidden="true"
                />

                {error ? (
                  <p className="login-error" role="alert">
                    {error}
                  </p>
                ) : null}

                <button type="submit" className="login-submit" disabled={loading}>
                  {loading ? "Enviando…" : "Cadastrar empresa"}
                </button>
              </form>

              <p className="login-foot">
                Já tem conta? <Link href="/login">Entrar</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
