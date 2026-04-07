"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cacheGet, cacheSet } from "@/lib/cache";

interface UseCachedFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Stale-while-revalidate hook.
 * - Returns cached data instantly if available (no loading flash).
 * - Fetches fresh data in background and swaps in silently.
 * - Falls back to stale cache on network error.
 */
export function useCachedFetch<T>(
  cacheKey: string,
  url: string,
  ttlMs = 5 * 60 * 1000,
): UseCachedFetchResult<T> {
  const [data, setData] = useState<T | null>(() => cacheGet<T>(cacheKey, ttlMs));
  const [loading, setLoading] = useState<boolean>(!cacheGet<T>(cacheKey, ttlMs));
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const fresh: T = await res.json();
      if (mountedRef.current) {
        setData(fresh);
        setError(null);
        cacheSet(cacheKey, fresh);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      // If we have stale cache, keep showing it
      const stale = cacheGet<T>(cacheKey, 0);
      if (stale !== null) {
        setData(stale);
      } else {
        setError(err instanceof Error ? err.message : "Fetch failed");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [cacheKey, url]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => { mountedRef.current = false; };
  }, [fetchData]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}
