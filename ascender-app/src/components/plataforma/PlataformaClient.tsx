"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acessarEmpresaAction,
  criarEmpresaAction,
  mudarStatusAction,
} from "@/lib/auth/platform-actions";
import type { TenantAdminRow } from "@/lib/auth/platform";

type Acao = { label: string; novo: string; tom: "ok" | "warn" | "bad" };

function acoesPara(status: string): Acao[] {
  switch (status) {
    case "pendente":
      return [
        { label: "Aprovar", novo: "trial", tom: "ok" },
        { label: "Recusar", novo: "cancelado", tom: "bad" },
      ];
    case "trial":
      return [
        { label: "Ativar", novo: "ativo", tom: "ok" },
        { label: "Suspender", novo: "suspenso", tom: "warn" },
        { label: "Cancelar", novo: "cancelado", tom: "bad" },
      ];
    case "ativo":
      return [
        { label: "Suspender", novo: "suspenso", tom: "warn" },
        { label: "Cancelar", novo: "cancelado", tom: "bad" },
      ];
    case "suspenso":
      return [
        { label: "Reativar", novo: "ativo", tom: "ok" },
        { label: "Cancelar", novo: "cancelado", tom: "bad" },
      ];
    case "cancelado":
      return [{ label: "Reativar", novo: "trial", tom: "ok" }];
    default:
      return [];
  }
}

function statusClass(status: string): string {
  if (status === "ativo") return "status-online";
  if (status === "trial" || status === "pendente") return "status-aguardando";
  return "status-offline";
}

const FORM_VAZIO = {
  nomeEmpresa: "",
  donoNome: "",
  donoEmail: "",
  donoSenha: "",
  status: "trial",
};

export function PlataformaClient({ empresas }: { empresas: TenantAdminRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(
    null,
  );
  const [form, setForm] = useState(FORM_VAZIO);
  const [abrirForm, setAbrirForm] = useState(false);
  const pendentes = empresas.filter((e) => e.status === "pendente").length;

  function criar(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const r = await criarEmpresaAction(form);
      if (r.ok) {
        setMsg({ tipo: "ok", texto: "Empresa criada." });
        setForm(FORM_VAZIO);
        setAbrirForm(false);
        router.refresh();
      } else {
        setMsg({ tipo: "erro", texto: r.error });
      }
    });
  }

  function acessar(tenantId: string) {
    setMsg(null);
    startTransition(async () => {
      const r = await acessarEmpresaAction({ tenantId });
      if (r.ok) {
        // Nav completo: a sessão agora tem o contexto da empresa acessada.
        window.location.assign("/");
      } else {
        setMsg({ tipo: "erro", texto: r.error });
      }
    });
  }

  function mudarStatus(tenantId: string, novo: string, nome: string) {
    const rotulo: Record<string, string> = {
      cancelado: "cancelar",
      suspenso: "suspender",
    };
    const verbo = rotulo[novo];
    if (verbo && !confirm(`Tem certeza que deseja ${verbo} "${nome}"?`)) return;
    setMsg(null);
    startTransition(async () => {
      const r = await mudarStatusAction({ tenantId, status: novo });
      if (r.ok) router.refresh();
      else setMsg({ tipo: "erro", texto: r.error });
    });
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <section className="panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Empresas na plataforma</h2>
            <p style={{ color: "var(--muted)", margin: "0.25rem 0 0" }}>
              {empresas.length} empresa(s). Controle o acesso pelo status.
              {pendentes > 0 ? (
                <span
                  className="status status-aguardando"
                  style={{ marginLeft: "0.5rem" }}
                >
                  {pendentes} aguardando aprovação
                </span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setAbrirForm((v) => !v)}
          >
            {abrirForm ? "Fechar" : "+ Nova empresa"}
          </button>
        </div>

        {msg ? (
          <p
            style={{
              marginTop: "0.75rem",
              color: msg.tipo === "ok" ? "var(--ok, #16a34a)" : "var(--bad, #dc2626)",
            }}
          >
            {msg.texto}
          </p>
        ) : null}

        {abrirForm ? (
          <form
            onSubmit={criar}
            style={{
              marginTop: "1rem",
              display: "grid",
              gap: "0.75rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <label>
              Nome da empresa
              <input
                required
                value={form.nomeEmpresa}
                onChange={(e) => setForm({ ...form, nomeEmpresa: e.target.value })}
              />
            </label>
            <label>
              Nome do responsável
              <input
                required
                value={form.donoNome}
                onChange={(e) => setForm({ ...form, donoNome: e.target.value })}
              />
            </label>
            <label>
              E-mail do responsável
              <input
                required
                type="email"
                value={form.donoEmail}
                onChange={(e) => setForm({ ...form, donoEmail: e.target.value })}
              />
            </label>
            <label>
              Senha inicial (mín. 8)
              <input
                required
                type="password"
                value={form.donoSenha}
                onChange={(e) => setForm({ ...form, donoSenha: e.target.value })}
              />
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="trial">Trial (avaliação)</option>
                <option value="ativo">Ativo (pagante)</option>
              </select>
            </label>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button type="submit" className="btn-primary" disabled={pending}>
                {pending ? "Criando…" : "Criar empresa"}
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <section className="panel">
        <div className="table-wrap">
        <table style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Status</th>
              <th>Plano</th>
              <th>Usuários</th>
              <th>Usinas</th>
              <th>Criada em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((t) => (
              <tr key={t.id}>
                <td>
                  {t.nome}
                  {t.ehTenant0 ? (
                    <span style={{ color: "var(--muted)" }}> (Ascender)</span>
                  ) : null}
                  <div style={{ color: "var(--muted)", fontSize: "0.8em" }}>
                    {t.slug}
                  </div>
                </td>
                <td>
                  <span className={`status ${statusClass(t.status)}`}>
                    {t.status}
                  </span>
                </td>
                <td>{t.plano}</td>
                <td>{t.usuarios}</td>
                <td>{t.usinas}</td>
                <td>{new Date(t.criadoEm).toLocaleDateString("pt-BR")}</td>
                <td>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={pending}
                      onClick={() => acessar(t.id)}
                      title="Entrar no app desta empresa como operador"
                    >
                      Acessar
                    </button>
                    {t.ehTenant0
                      ? null
                      : acoesPara(t.status).map((a) => (
                          <button
                            key={a.novo + a.label}
                            type="button"
                            className={
                              a.tom === "ok"
                                ? "btn-secondary"
                                : "btn-secondary danger"
                            }
                            disabled={pending}
                            onClick={() => mudarStatus(t.id, a.novo, t.nome)}
                          >
                            {a.label}
                          </button>
                        ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
    </div>
  );
}
