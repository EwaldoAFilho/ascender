"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { getPropostaPdf, setStatusProposta } from "@/lib/propostas/actions";
import { baixarPropostaPdf } from "@/lib/propostas/pdf";

const STATUS_OPCOES = ["simulacao", "em-analise", "aprovada", "recusada"] as const;

function statusClasse(s: string): string {
  if (s === "aprovada") return "status-online";
  if (s === "recusada") return "status-offline";
  if (s === "em-analise") return "status-aguardando";
  return "";
}

// Botão de reimpressão do PDF de uma proposta salva. Busca o DTO client-safe no
// servidor (getPropostaPdf) e baixa no navegador — nenhum dado de custo/margem
// trafega por aqui.
export function PropostaPdfButton({ id, temPdf }: { id: string; temPdf: boolean }) {
  const toast = useToast();
  const [pending, start] = useTransition();

  function onClick() {
    start(async () => {
      const r = await getPropostaPdf(id);
      if (r.ok) {
        await baixarPropostaPdf(r.dados);
      } else {
        toast({ message: r.error, variant: "error" });
      }
    });
  }

  return (
    <button
      type="button"
      className="btn-link"
      onClick={onClick}
      disabled={!temPdf || pending}
      title={temPdf ? "Baixar PDF (cliente)" : "Sem dados do gerador para PDF"}
    >
      <Download size={14} /> {pending ? "…" : "PDF"}
    </button>
  );
}

// Troca rápida de status direto na lista (sem abrir a proposta / recalcular).
export function PropostaStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState(status);
  const [pending, start] = useTransition();

  function onChange(e: ChangeEvent<HTMLSelectElement>) {
    const novo = e.target.value;
    const anterior = value;
    setValue(novo);
    start(async () => {
      const r = await setStatusProposta({ id, status: novo });
      if (r.ok) {
        toast({ message: "Status atualizado." });
        router.refresh();
      } else {
        setValue(anterior);
        toast({ message: r.error, variant: "error" });
      }
    });
  }

  return (
    <select
      className={`status-select status ${statusClasse(value)}`}
      value={value}
      onChange={onChange}
      disabled={pending}
      aria-label="Status da proposta"
    >
      {STATUS_OPCOES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
