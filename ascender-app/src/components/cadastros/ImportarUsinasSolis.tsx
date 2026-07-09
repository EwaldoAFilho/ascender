"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DownloadCloud } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { importarUsinasSolis } from "@/lib/cadastros/actions";

export function ImportarUsinasSolis() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const r = await importarUsinasSolis();
    setBusy(false);
    if (r.ok) {
      router.refresh();
      const bloq = r.bloqueadas ?? 0;
      const extra =
        bloq > 0 ? ` ${bloq} não importada(s) pelo limite do plano.` : "";
      toast({
        message: `Importação concluída: ${r.criadas ?? 0} nova(s), ${r.atualizadas ?? 0} atualizada(s) de ${r.total ?? 0} estações.${extra}`,
        variant: bloq > 0 ? "error" : undefined,
        duration: 7000,
      });
    } else {
      toast({ message: r.error, variant: "error" });
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Importar usinas da SolisCloud</h2>
          <p>
            Traz as estações reais da sua conta para o cadastro, já vinculadas
            pelo Station ID. Não sobrescreve distribuidora, potência ou meta que
            você editar.
          </p>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" onClick={run} disabled={busy}>
          <DownloadCloud
            size={16}
            style={{ verticalAlign: "-3px", marginRight: 6 }}
          />
          {busy ? "Importando…" : "Importar da SolisCloud"}
        </button>
      </div>
    </section>
  );
}
