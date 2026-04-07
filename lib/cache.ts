// ── localStorage cache with stale-while-revalidate ────────────────
// Supabase is the source of truth. This cache eliminates loading
// spinners on repeat visits and provides offline resilience.

const PREFIX = "anton-cx:";

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

/** Default TTL: 5 minutes */
const DEFAULT_TTL_MS = 5 * 60 * 1000;

function cacheKey(key: string): string {
  return `${PREFIX}${key}`;
}

/**
 * Read from cache. Returns `null` if missing or expired.
 * Pass `ttl: 0` to accept any age (offline fallback).
 */
export function cacheGet<T>(key: string, ttl = DEFAULT_TTL_MS): T | null {
  try {
    const raw = localStorage.getItem(cacheKey(key));
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (ttl > 0 && Date.now() - entry.cachedAt > ttl) return null;
    return entry.data;
  } catch {
    return null;
  }
}

/** Write to cache with current timestamp. */
export function cacheSet<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, cachedAt: Date.now() };
    localStorage.setItem(cacheKey(key), JSON.stringify(entry));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/** Remove a specific cache key. */
export function cacheRemove(key: string): void {
  try {
    localStorage.removeItem(cacheKey(key));
  } catch {
    // Ignore
  }
}

/** Invalidate all anton-cx cache entries. */
export function cacheInvalidateAll(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  } catch {
    // Ignore
  }
}

/**
 * Stale-while-revalidate fetch helper.
 *
 * 1. Returns cached data immediately if fresh (< ttl).
 * 2. If stale or missing, calls `fetcher()` and updates cache.
 * 3. If fetcher fails but stale cache exists, returns stale data.
 *
 * @returns `{ data, fromCache }` — `fromCache` is true when data
 *          came from localStorage without a network call.
 */
export async function cacheFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = DEFAULT_TTL_MS,
): Promise<{ data: T; fromCache: boolean }> {
  // 1. Check fresh cache
  const cached = cacheGet<T>(key, ttl);
  if (cached !== null) {
    return { data: cached, fromCache: true };
  }

  // 2. Fetch fresh data
  try {
    const fresh = await fetcher();
    cacheSet(key, fresh);
    return { data: fresh, fromCache: false };
  } catch (err) {
    // 3. Fall back to stale cache (any age)
    const stale = cacheGet<T>(key, 0);
    if (stale !== null) {
      return { data: stale, fromCache: true };
    }
    throw err;
  }
}
