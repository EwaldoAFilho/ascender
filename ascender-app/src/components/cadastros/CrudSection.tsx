"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useConfirm } from "@/components/ConfirmProvider";
import { useToast } from "@/components/ToastProvider";
import { DataTable, type DataColumn } from "@/components/DataTable";

type ActionResult = { ok: true } | { ok: false; error: string };

export type Option = { value: string; label: string };

export type CrudField =
  | {
      name: string;
      label: string;
      type: "text" | "number" | "date" | "password";
      required?: boolean;
      placeholder?: string;
      step?: string;
    }
  | {
      name: string;
      label: string;
      type: "textarea";
      required?: boolean;
      placeholder?: string;
      rows?: number;
      /** Ocupa a linha inteira do grid (default true para textarea). */
      fullWidth?: boolean;
    }
  | {
      name: string;
      label: string;
      type: "select";
      options: Option[];
      required?: boolean;
      placeholder?: string;
    }
  | {
      name: string;
      label: string;
      type: "datalist";
      options: Option[];
      placeholder?: string;
    };

export type CrudRow = {
  id: string;
  cells: ReactNode[];
  /** Valores por coluna para ordenar/exportar (default: a célula, quando texto). */
  sortValues?: (string | number)[];
  values: Record<string, string>;
  /** Ações extras por linha (JSX pré-renderizado) na coluna "Ações". */
  actions?: ReactNode;
};

type Props = {
  singular: string;
  fields?: CrudField[];
  columns: string[];
  rows: CrudRow[];
  onSave?: (input: Record<string, unknown>) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
  /**
   * Quando definido, "Editar" (e `clickableFirstColumn`) NAVEGA para
   * `${editBasePath}/${row.id}` em vez de abrir o modal de edição. Use quando a
   * edição acontece numa tela dedicada (ex.: propostas → /propostas/[id]).
   * String (serializável) — a página é Server Component.
   */
  editBasePath?: string;
  /**
   * Somente leitura: oculta Editar e Excluir (mantém `row.actions`, ex.: baixar
   * PDF). Use para o papel "leitura", que não pode mutar.
   */
  readOnly?: boolean;
  /**
   * Conteúdo extra renderizado dentro do modal ao EDITAR um registro existente,
   * indexado por id (proveniência, anexos, histórico…). JSX pré-renderizado no
   * servidor — pode ser um client component (ex.: ficha do cliente).
   */
  extras?: Record<string, ReactNode>;
  /** Quando true, a 1ª coluna vira um link que abre o modal de edição. */
  clickableFirstColumn?: boolean;
  /**
   * Quando true, oculta o botão "Adicionar" (criação manual). Editar/excluir por
   * linha continuam disponíveis. Use quando a criação acontece por outro fluxo
   * (ex.: propostas são criadas pelo gerador de dimensionamento).
   */
  hideAdd?: boolean;
};

export function CrudSection({
  singular,
  fields = [],
  columns,
  rows,
  onSave,
  onDelete,
  extras,
  clickableFirstColumn = false,
  hideAdd = false,
  editBasePath,
  readOnly = false,
}: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Fecha o modal com Esc.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function openCreate() {
    setValues({});
    setEditingId(null);
    setError(null);
    setOpen(true);
  }

  function openEdit(row: CrudRow) {
    setValues(row.values);
    setEditingId(row.id);
    setError(null);
    setOpen(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSave) return;
    setError(null);
    setBusy(true);
    const payload: Record<string, unknown> = { ...values };
    if (editingId) payload.id = editingId;
    const result = await onSave(payload);
    setBusy(false);
    if (result.ok) {
      setOpen(false);
      router.refresh();
      toast({ message: editingId ? "Registro atualizado." : "Registro criado." });
    } else {
      setError(result.error);
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: `Excluir ${singular}`,
      message: "Excluir este registro? Esta ação não pode ser desfeita.",
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    const result = await onDelete(id);
    setBusy(false);
    if (result.ok) {
      router.refresh();
      toast({ message: "Registro excluído." });
    } else {
      await confirm({
        title: "Não foi possível excluir",
        message: result.error,
        confirmLabel: "OK",
        hideCancel: true,
      });
    }
  }

  const dataColumns: DataColumn<CrudRow>[] = [
    ...columns.map((header, i) => ({
      key: `c${i}`,
      header,
      value: (row: CrudRow): string | number => {
        const sv = row.sortValues?.[i];
        if (sv !== undefined) return sv;
        const cell = row.cells[i];
        return typeof cell === "string" || typeof cell === "number" ? cell : "";
      },
      render: (row: CrudRow) =>
        clickableFirstColumn && i === 0 ? (
          editBasePath ? (
            <Link
              className="crud-link-cell"
              href={`${editBasePath}/${row.id}`}
              title={`Editar ${singular}`}
            >
              {row.cells[i]}
            </Link>
          ) : (
            <button
              type="button"
              className="crud-link-cell"
              onClick={() => openEdit(row)}
              title={`Editar ${singular}`}
            >
              {row.cells[i]}
            </button>
          )
        ) : (
          row.cells[i]
        ),
    })),
    {
      key: "acoes",
      header: "Ações",
      sortable: false,
      exportable: false,
      value: () => "",
      render: (row: CrudRow) => (
        <div className="table-actions">
          {readOnly ? null : editBasePath ? (
            <Link className="btn-link" href={`${editBasePath}/${row.id}`}>
              <Pencil size={14} /> Editar
            </Link>
          ) : (
            <button
              type="button"
              className="btn-link"
              onClick={() => openEdit(row)}
            >
              <Pencil size={14} /> Editar
            </button>
          )}
          {row.actions}
          {readOnly ? null : (
            <button
              type="button"
              className="btn-link danger"
              onClick={() => handleDelete(row.id)}
              disabled={busy}
            >
              <Trash2 size={14} /> Excluir
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Registros</h2>
            <p>{rows.length} cadastrado(s)</p>
          </div>
          {hideAdd ? null : (
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus size={16} /> Adicionar {singular}
            </button>
          )}
        </div>
        <DataTable
          columns={dataColumns}
          rows={rows}
          rowKey={(r) => r.id}
          fileName={singular}
          emptyMessage={
            hideAdd
              ? "Nenhum registro ainda."
              : `Nenhum registro ainda. Clique em "Adicionar ${singular}".`
          }
        />
      </section>

      {open ? (
        <div className="modal-overlay" role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${editingId ? "Editar" : "Adicionar"} ${singular}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                {editingId ? `Editar ${singular}` : `Adicionar ${singular}`}
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-grid">
                {fields.map((field) => (
                  <label
                    className={`form-field${
                      field.type === "textarea" && field.fullWidth !== false
                        ? " full-span"
                        : ""
                    }`}
                    key={field.name}
                  >
                    <span>{field.label}</span>
                    {field.type === "textarea" ? (
                      <textarea
                        rows={field.rows ?? 4}
                        value={values[field.name] ?? ""}
                        required={field.required}
                        placeholder={field.placeholder}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [field.name]: e.target.value }))
                        }
                      />
                    ) : field.type === "select" ? (
                      <select
                        value={values[field.name] ?? ""}
                        required={field.required}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [field.name]: e.target.value }))
                        }
                      >
                        <option value="">{field.placeholder ?? "Selecione…"}</option>
                        {field.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "datalist" ? (
                      <>
                        <input
                          list={`dl-${field.name}`}
                          value={values[field.name] ?? ""}
                          placeholder={field.placeholder}
                          onChange={(e) =>
                            setValues((v) => ({
                              ...v,
                              [field.name]: e.target.value,
                            }))
                          }
                        />
                        <datalist id={`dl-${field.name}`}>
                          {field.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </datalist>
                      </>
                    ) : (
                      <input
                        type={field.type}
                        step={
                          field.type === "number" ? (field.step ?? "any") : undefined
                        }
                        value={values[field.name] ?? ""}
                        required={field.required}
                        placeholder={field.placeholder}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [field.name]: e.target.value }))
                        }
                      />
                    )}
                  </label>
                ))}
              </div>
              {editingId && extras?.[editingId] ? (
                <div className="crud-extras">{extras[editingId]}</div>
              ) : null}
              {error ? (
                <p style={{ color: "var(--danger)", fontWeight: 800, marginTop: 12 }}>
                  {error}
                </p>
              ) : null}
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy
                    ? "Salvando…"
                    : editingId
                      ? "Salvar alterações"
                      : "Adicionar"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
