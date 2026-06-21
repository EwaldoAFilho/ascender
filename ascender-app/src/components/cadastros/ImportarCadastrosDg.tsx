"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitCompareArrows } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { importarCadastrosDg } from "@/lib/cadastros/actions";

export function ImportarCadastrosDg() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const r = await importarCadastrosDg();
    setBusy(false);
    if (r.ok) {
      router.refresh();
      toast({
        message: `Conciliação concluída: ${r.clientesCriados ?? 0} cliente(s) e ${r.ucsCriadas ?? 0} UC(s) importada(s); ${r.usinasVinculadas ?? 0} usina(s) vinculada(s)${r.usinasSemVinculo ? `, ${r.usinasSemVinculo} usina(s) para vincular manualmente` : ""}.`,
        duration: 7000,
      });
    } else {
      toast({ message: r.error, variant: "error" });
    }
  }

  return (
    <div className="form-actions">
      <button type="button" onClick={run} disabled={busy}>
        <GitCompareArrows
          size={16}
          style={{ verticalAlign: "-3px", marginRight: 6 }}
        />
        {busy ? "Conciliando…" : "Importar do Digital Grid"}
      </button>
    </div>
  );
}
