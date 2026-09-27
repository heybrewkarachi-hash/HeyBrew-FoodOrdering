/**
 * IN_MEMORY_FALLBACK — used when REDIS_URL is unset or Redis is down.
 * Suitable for local/dev only; not shared across processes.
 */
type Entry = { value: string; expiresAt: number | null };

const store = new Map<string, Entry>();

function purgeExpired(key: string): void {
  const e = store.get(key);
  if (!e) return;
  if (e.expiresAt != null && Date.now() > e.expiresAt) {
    store.delete(key);
  }
}

export const memoryStore = {
  async get(key: string): Promise<string | null> {
    purgeExpired(key);
    return store.get(key)?.value ?? null;
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  },

  async setNx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    purgeExpired(key);
    if (store.has(key)) return false;
    store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return true;
  },

  async del(key: string): Promise<void> {
    store.delete(key);
  },

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    purgeExpired(key);
    const current = store.get(key);
    const next = current ? Number(current.value) + 1 : 1;
    store.set(key, {
      value: String(next),
      expiresAt:
        current?.expiresAt ??
        (ttlSeconds ? Date.now() + ttlSeconds * 1000 : null),
    });
    return next;
  },

  /** Test helper */
  clear(): void {
    store.clear();
  },
};
