// Rate limiter simples EM MEMÓRIA (janela fixa por chave). Suficiente para uma
// instância; com réplicas horizontais, migrar para um store compartilhado (Redis,
// Fase 7) — senão cada réplica conta o seu próprio balde.

type Janela = { count: number; resetAt: number };
const janelas = new Map<string, Janela>();

/**
 * Retorna `true` se a ação está PERMITIDA para `chave` (e contabiliza o hit), ou
 * `false` se estourou `max` dentro de `janelaMs`.
 */
export function permitir(chave: string, max: number, janelaMs: number): boolean {
  const agora = Date.now();
  // Limpeza defensiva: impede o Map de crescer sem limite com chaves expiradas.
  if (janelas.size > 10_000) {
    for (const [k, v] of janelas) if (agora >= v.resetAt) janelas.delete(k);
  }
  const j = janelas.get(chave);
  if (!j || agora >= j.resetAt) {
    janelas.set(chave, { count: 1, resetAt: agora + janelaMs });
    return true;
  }
  if (j.count >= max) return false;
  j.count++;
  return true;
}
