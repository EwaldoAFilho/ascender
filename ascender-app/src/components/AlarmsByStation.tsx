"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileWarning, X } from "lucide-react";
import { EmptyState } from "@/components/states";
import type { SolisAlarm } from "@/types/soliscloud";

function descricaoAlarme(code: string): string {
  const c = code.toUpperCase();
  if (c.startsWith("NO-GRID")) return "Sem rede da concessionária";
  if (c.startsWith("OV-G-V")) return "Sobretensão da rede";
  if (c.startsWith("UN-G-V")) return "Subtensão da rede";
  if (c.startsWith("OV-G-F")) return "Frequência da rede alta";
  if (c.startsWith("UN-G-F")) return "Frequência da rede baixa";
  if (c.includes("ISO")) return "Falha de isolamento (lado CC/painéis)";
  if (c.includes("TEM")) return "Temperatura alta";
  return code;
}

const sevRank = (level: string) =>
  level === "critico" ? 3 : level === "alto" ? 2 : level === "medio" ? 1 : 0;

export function AlarmsByStation({
  alarms,
  stationNameById,
}: {
  alarms: SolisAlarm[];
  stationNameById: Map<string, string>;
}) {
  const [openPlant, setOpenPlant] = useState<string | null>(null);

  useEffect(() => {
    if (!openPlant) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPlant(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPlant]);

  const grupos = new Map<string, SolisAlarm[]>();
  for (const a of alarms) {
    const arr = grupos.get(a.plantId) ?? [];
    arr.push(a);
    grupos.set(a.plantId, arr);
  }

  const cards = Array.from(grupos.entries())
    .map(([plantId, lista]) => {
      const ativos = lista.filter((a) => a.status !== "resolvido");
      const pior = ativos.reduce((m, a) => Math.max(m, sevRank(a.level)), 0);
      return {
        plantId,
        nome: stationNameById.get(plantId) ?? plantId,
        total: lista.length,
        ativos: ativos.length,
        piorLabel:
          pior === 3 ? "critico" : pior === 2 ? "alto" : pior === 1 ? "medio" : "baixo",
        temCritico: lista.some((a) => a.level === "critico"),
        lista,
      };
    })
    .sort((a, b) => b.ativos - a.ativos || b.total - a.total);

  if (cards.length === 0) {
    return <EmptyState message="Nenhum alerta registrado nas usinas." />;
  }

  const aberto = cards.find((c) => c.plantId === openPlant) ?? null;

  return (
    <>
      <div className="telemetry-grid">
        {cards.map((c) => (
          <button
            key={c.plantId}
            type="button"
            className="telemetry-card"
            style={{ textAlign: "left", cursor: "pointer", width: "100%" }}
            onClick={() => setOpenPlant(c.plantId)}
          >
            <div className="telemetry-head">
              <strong>{c.nome}</strong>
              {c.ativos > 0 ? (
                <span className={`status status-${c.piorLabel}`}>
                  {c.ativos} ativo(s)
                </span>
              ) : (
                <span
                  className="status status-online"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <CheckCircle2 size={12} /> ok
                </span>
              )}
            </div>
            <p style={{ margin: "0 0 10px", color: "var(--muted)" }}>
              {c.total} evento(s) no histórico
              {c.temCritico ? " · inclui crítico" : ""}
            </p>
            <small style={{ color: "var(--brand-gold)", fontWeight: 800 }}>
              Ver detalhes
            </small>
          </button>
        ))}
      </div>

      {aberto ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setOpenPlant(null)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Alertas de ${aberto.nome}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Alertas — {aberto.nome}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setOpenPlant(null)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ marginTop: 0, color: "var(--muted)" }}>
              {aberto.ativos} ativo(s) · {aberto.total} no histórico
            </p>
            <div className="alarm-list">
              {[...aberto.lista]
                .sort(
                  (a, b) =>
                    (a.status !== "resolvido" ? 0 : 1) -
                      (b.status !== "resolvido" ? 0 : 1) ||
                    sevRank(b.level) - sevRank(a.level),
                )
                .map((al, i) => (
                  <article key={`${al.deviceSerialNumber}-${al.message}-${i}`}>
                    <FileWarning size={20} />
                    <div>
                      <strong>
                        {descricaoAlarme(al.message)}{" "}
                        <small style={{ opacity: 0.7 }}>({al.message})</small>
                      </strong>
                      <small>
                        {al.deviceSerialNumber} · {al.status}
                        {al.startedAt ? ` · ${al.startedAt}` : ""}
                      </small>
                    </div>
                    <span className={`status status-${al.level}`}>{al.level}</span>
                  </article>
                ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
