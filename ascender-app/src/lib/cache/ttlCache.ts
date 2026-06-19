// Cache em memória com TTL (singleton por processo). Adequado para uma única
// instância — protege o rate limit da SolisCloud (dados mudam a cada ~5 min).
// Para múltiplas réplicas, migrar para Redis.

type Entry = { value: unknown; expiresAt: number };

const store = new Map<string, Entry>();

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCached(key: string, value: unknown, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function clearCache(): void {
  store.clear();
}
