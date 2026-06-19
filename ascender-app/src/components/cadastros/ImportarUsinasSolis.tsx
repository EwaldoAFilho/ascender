"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DownloadCloud } from "lucide-react";
import { importarUsinasSolis } from "@/lib/cadastros/actions";

export function ImportarUsinasSolis() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    const r = await importarUsinasSolis();
    setBusy(false);
    if (r.ok) {
      setMsg({
        ok: true,
        text: `Importação concluída: ${r.criadas ?? 0} nova(s), ${r.atualizadas ?? 0} atualizada(s) de ${r.total ?? 0} estações.`,
      });
      router.refresh();
    } else {
      setMsg({ ok: false, text: r.error });
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
    </section>
  );
}
