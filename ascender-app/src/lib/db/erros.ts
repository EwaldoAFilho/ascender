// Utilitários para tratar erros do Postgres sem vazar detalhes internos.

/**
 * `true` se o erro é violação de UNIQUE (código 23505). Cobre tanto o erro cru do
 * `pg` (e.code) quanto o embrulhado pelo Drizzle (e.cause.code).
 */
export function ehViolacaoUnica(e: unknown): boolean {
  const code =
    (e as { code?: string })?.code ??
    (e as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
}
