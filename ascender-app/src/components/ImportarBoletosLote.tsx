"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, UploadCloud, X } from "lucide-react";

type Resultado = {
  arquivo: string;
  status: "anexado" | "ja_tinha" | "sem_match" | "ambiguo" | "erro";
  uc: string | null;
  competencia: string | null;
  cliente: string | null;
  detalhe?: string;
};

const META: Record<
  Resultado["status"],
  { label: string; classe: string }
> = {
  anexado: { label: "Anexado", classe: "status-pago" },
  ja_tinha: { label: "Já tinha conta", classe: "status-aguardando" },
  sem_match: { label: "Sem correspondência", classe: "status-vencido" },
  ambiguo: { label: "Ambíguo", classe: "status-aguardando" },
  erro: { label: "Erro", classe: "status-offline" },
};

export function ImportarBoletosLote() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function abrir() {
    setFiles([]);
    setResultados(null);
    setErro(null);
    setOpen(true);
  }

  function fechar() {
    setOpen(false);
    if (resultados?.some((r) => r.status === "anexado")) router.refresh();
  }

  async function conciliar() {
    if (files.length === 0) return;
    setBusy(true);
    setErro(null);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      const res = await fetch("/api/financeiro/conta/lote", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErro(data?.error ?? "Falha ao processar o lote.");
      } else {
        setResultados(data.resultados as Resultado[]);
      }
    } catch {
      setErro("Falha ao enviar o lote.");
    } finally {
      setBusy(false);
    }
  }

  const contagem = (s: Resultado["status"]) =>
    resultados?.filter((r) => r.status === s).length ?? 0;

  return (
    <>
      <button type="button" className="btn-secondary" onClick={abrir}>
        <Layers size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
        Importar boletos em lote
      </button>

      {open ? (
        <div className="modal-overlay" role="presentation" onClick={fechar}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Importar boletos em lote"
            style={{ maxWidth: 760 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Importar boletos em lote</h2>
              <button
                type="button"
                className="modal-close"
                onClick={fechar}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: "var(--muted)", marginTop: 0 }}>
              Selecione vários PDFs de contas. O sistema lê a UC e a competência
              de cada um e anexa à fatura correspondente. Faturas que já têm conta
              são mantidas (apenas avisadas).
            </p>

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                setFiles(Array.from(e.target.files ?? []));
                setResultados(null);
                e.target.value = "";
              }}
            />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
              >
                <UploadCloud size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
                Selecionar PDFs
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={conciliar}
                disabled={busy || files.length === 0}
              >
                {busy
                  ? "Conciliando…"
                  : `Conciliar ${files.length || ""} arquivo(s)`}
              </button>
            </div>

            {files.length > 0 && !resultados ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                {files.length} arquivo(s) selecionado(s).
              </p>
            ) : null}

            {erro ? (
              <p style={{ color: "var(--danger)", fontWeight: 800 }}>{erro}</p>
            ) : null}

            {resultados ? (
              <>
                <div className="lote-resumo">
                  <span className="status status-pago">{contagem("anexado")} anexados</span>
                  <span className="status status-aguardando">
                    {contagem("ja_tinha") + contagem("ambiguo")} pendentes
                  </span>
                  <span className="status status-vencido">
                    {contagem("sem_match")} sem match
                  </span>
                  {contagem("erro") > 0 ? (
                    <span className="status status-offline">{contagem("erro")} erro(s)</span>
                  ) : null}
                </div>

                <div className="lote-tabela">
                  <table>
                    <thead>
                      <tr>
                        <th>Arquivo</th>
                        <th>UC</th>
                        <th>Comp.</th>
                        <th>Cliente</th>
                        <th>Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultados.map((r, i) => (
                        <tr key={i}>
                          <td title={r.arquivo}>{r.arquivo}</td>
                          <td>{r.uc ?? "—"}</td>
                          <td>{r.competencia ?? "—"}</td>
                          <td title={r.cliente ?? ""}>{r.cliente ?? "—"}</td>
                          <td>
                            <span className={`status ${META[r.status].classe}`}>
                              {META[r.status].label}
                            </span>
                            {r.detalhe ? (
                              <small style={{ display: "block", color: "var(--muted)" }}>
                                {r.detalhe}
                              </small>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
