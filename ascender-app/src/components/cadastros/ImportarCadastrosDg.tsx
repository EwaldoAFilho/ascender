"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitCompareArrows } from "lucide-react";
import { importarCadastrosDg } from "@/lib/cadastros/actions";

export function ImportarCadastrosDg() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    const r = await importarCadastrosDg();
    setBusy(false);
    if (r.ok) {
      setMsg({
        ok: true,
        text: `Conciliação concluída: ${r.clientesCriados ?? 0} cliente(s) e ${r.ucsCriadas ?? 0} UC(s) importada(s); ${r.usinasVinculadas ?? 0} usina(s) vinculada(s)${r.usinasSemVinculo ? `, ${r.usinasSemVinculo} usina(s) para vincular manualmente` : ""}.`,
      });
      router.refresh();
    } else {
      setMsg({ ok: false, text: r.error });
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
      {msg ? (
        <p
          style={{
            marginTop: 10,
            fontWeight: 800,
            color: msg.ok ? "var(--success)" : "var(--danger)",
          }}
        >
          {msg.text}
        </p>
      ) : null}
    </div>
  );
}
