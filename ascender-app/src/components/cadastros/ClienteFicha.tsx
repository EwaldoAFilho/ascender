"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Download,
  Eye,
  FileText,
  History,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";
import { useConfirm } from "@/components/ConfirmProvider";
import {
  excluirAnexoCliente,
  getFichaCliente,
  type FichaCliente,
} from "@/lib/cadastros/actions";

function formatDateTime(value: Date | string | null): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function formatTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function descreveHistorico(h: FichaCliente["historico"][number]): ReactNode {
  switch (h.acao) {
    case "criou":
      return <>criou o cadastro</>;
    case "anexou":
      return (
        <>
          anexou <b>{h.detalhe}</b>
        </>
      );
    case "removeu_anexo":
      return (
        <>
          removeu o anexo <b>{h.detalhe}</b>
        </>
      );
    case "editou_campo":
      return (
        <>
          alterou <b>{h.campo}</b>: <i>{h.valorAntes ?? "—"}</i> →{" "}
          <i>{h.valorDepois ?? "—"}</i>
        </>
      );
    default:
      return <>{h.acao}</>;
  }
}

export function ClienteFicha({
  clienteId,
  banner,
}: {
  clienteId: string;
  banner?: ReactNode;
}) {
  const [ficha, setFicha] = useState<FichaCliente | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  const carregar = useCallback(async () => {
    const dados = await getFichaCliente(clienteId);
    setFicha(dados);
    setCarregando(false);
  }, [clienteId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function onUpload(file: File) {
    setEnviando(true);
    setErro(null);
    try {
      const form = new FormData();
      form.set("entidade", "cliente");
      form.set("entidadeId", clienteId);
      form.set("file", file);
      const res = await fetch("/api/cadastros/anexo", {
        method: "POST",
        body: form,
      });
      const json = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!res.ok) {
        setErro(json?.error ?? "Falha ao enviar o anexo.");
      } else {
        await carregar();
      }
    } catch {
      setErro("Falha ao enviar o anexo.");
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onExcluir(id: string, nome: string) {
    const ok = await confirm({
      title: "Excluir anexo",
      message: `Excluir o anexo "${nome}"?`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    setErro(null);
    const res = await excluirAnexoCliente(id);
    if (res.ok) await carregar();
    else setErro(res.error);
  }

  return (
    <div className="ficha">
      {banner}

      <section className="ficha-bloco">
        <div className="ficha-bloco-head">
          <h3>
            <Paperclip size={15} /> Anexos
          </h3>
          <label className="btn-link" aria-disabled={enviando}>
            <Upload size={14} /> {enviando ? "Enviando…" : "Adicionar anexo"}
            <input
              ref={inputRef}
              type="file"
              hidden
              disabled={enviando}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onUpload(f);
              }}
            />
          </label>
        </div>

        {erro ? <p className="ficha-erro">{erro}</p> : null}

        {carregando ? (
          <p className="ficha-vazio">Carregando…</p>
        ) : !ficha || ficha.anexos.length === 0 ? (
          <p className="ficha-vazio">Nenhum anexo ainda.</p>
        ) : (
          <ul className="ficha-anexos">
            {ficha.anexos.map((a) => (
              <li key={a.id}>
                <FileText size={15} />
                <div className="ficha-anexo-info">
                  <strong>{a.nome}</strong>
                  <span>
                    {formatTamanho(a.tamanhoBytes)} ·{" "}
                    {a.enviadoPor ?? "—"} · {formatDateTime(a.criadoEm)}
                  </span>
                </div>
                <div className="ficha-anexo-acoes">
                  <a
                    className="btn-link"
                    href={`/api/cadastros/anexo/${a.id}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Visualizar"
                  >
                    <Eye size={14} /> Ver
                  </a>
                  <a
                    className="btn-link"
                    href={`/api/cadastros/anexo/${a.id}?download=1`}
                    title="Baixar"
                  >
                    <Download size={14} /> Baixar
                  </a>
                  <button
                    type="button"
                    className="btn-link danger"
                    onClick={() => onExcluir(a.id, a.nome)}
                    title="Excluir"
                  >
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ficha-bloco">
        <div className="ficha-bloco-head">
          <h3>
            <History size={15} /> Histórico de alterações
          </h3>
        </div>
        {carregando ? (
          <p className="ficha-vazio">Carregando…</p>
        ) : !ficha || ficha.historico.length === 0 ? (
          <p className="ficha-vazio">Sem alterações registradas.</p>
        ) : (
          <ul className="ficha-historico">
            {ficha.historico.map((h) => (
              <li key={h.id}>
                <span className="ficha-hist-quando">
                  {formatDateTime(h.criadoEm)}
                </span>
                <span className="ficha-hist-texto">
                  <b>{h.autor ?? "sistema"}</b> {descreveHistorico(h)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
