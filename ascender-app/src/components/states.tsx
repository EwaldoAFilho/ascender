"use client";

import { FileWarning, Inbox, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/soliscloud";

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Ocorreu um erro inesperado.";
}

export function isNotConfigured(error: unknown): boolean {
  return error instanceof ApiError && error.code === "NOT_CONFIGURED";
}

/** Skeleton simples reaproveitando as faixas do design system. */
export function PanelSkeleton({
  title,
  lines = 3,
}: {
  title: string;
  lines?: number;
}) {
  return (
    <section className="panel" aria-busy="true">
      <div className="panel-header">
        <h2>{title}</h2>
        <span>Carregando…</span>
      </div>
      <div className="bar-list">
        {Array.from({ length: lines }).map((_, index) => (
          <div className="bar-track" key={index} style={{ opacity: 0.5 }}>
            <span style={{ width: `${35 + index * 18}%` }} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ErrorState({
  title = "Não foi possível carregar",
  error,
  onRetry,
}: {
  title?: string;
  error: unknown;
  onRetry?: () => void;
}) {
  const router = useRouter();

  if (isNotConfigured(error)) {
    return (
      <section className="panel">
        <div className="panel-header">
          <h2>Integração não configurada</h2>
        </div>
        <div className="alarm-list">
          <article>
            <Settings size={20} />
            <div>
              <strong>SolisCloud sem credenciais</strong>
              <span>
                Cadastre o KeyId e o KeySecret para carregar os dados reais.
              </span>
            </div>
          </article>
        </div>
        <div className="form-actions">
          <button
            type="button"
            onClick={() => router.push("/configuracoes/integracoes")}
          >
            Configurar integração
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
      </div>
      <div className="alarm-list">
        <article>
          <FileWarning size={20} />
          <div>
            <strong>Erro</strong>
            <span>{errorMessage(error)}</span>
          </div>
        </article>
      </div>
      {onRetry ? (
        <div className="form-actions">
          <button type="button" onClick={onRetry}>
            Tentar novamente
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="alarm-list">
      <article>
        <Inbox size={20} />
        <div>
          <span>{message}</span>
        </div>
      </article>
    </div>
  );
}
