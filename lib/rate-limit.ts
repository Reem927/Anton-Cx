import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Upstash Redis sliding-window rate limiter.
// Consistent across all Vercel instances/regions — no per-instance drift.
//
// Setup: create a free Redis DB at upstash.com, then add to Vercel env vars:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
//
// Local dev fallback: if env vars are absent, falls back to in-memory limiter
// so `npm run dev` works without Redis credentials.
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // unix ms
}

// ── Upstash limiters (one per route, different quotas) ──────────────────────

function makeRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

let _extractLimiter: Ratelimit | null = null;
let _ingestLimiter: Ratelimit | null = null;
let _summaryLimiter: Ratelimit | null = null;

function getExtractLimiter() {
  if (!_extractLimiter) {
    _extractLimiter = new Ratelimit({
      redis: makeRedis(),
      limiter: Ratelimit.slidingWindow(10, "10 m"), // 10 req / 10 min
      prefix: "rl:extract",
    });
  }
  return _extractLimiter;
}

function getIngestLimiter() {
  if (!_ingestLimiter) {
    _ingestLimiter = new Ratelimit({
      redis: makeRedis(),
      limiter: Ratelimit.slidingWindow(20, "1 h"), // 20 req / hour
      prefix: "rl:ingest",
    });
  }
  return _ingestLimiter;
}

function getSummaryLimiter() {
  if (!_summaryLimiter) {
    _summaryLimiter = new Ratelimit({
      redis: makeRedis(),
      limiter: Ratelimit.slidingWindow(30, "1 h"), // 30 req / hour
      prefix: "rl:summary",
    });
  }
  return _summaryLimiter;
}

// ── In-memory fallback for local dev ────────────────────────────────────────

interface MemWindow {
  count: number;
  resetAt: number;
}
const memStore = new Map<string, MemWindow>();

function memCheck(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const win = memStore.get(key);
  if (!win || now >= win.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  win.count += 1;
  return {
    allowed: win.count <= limit,
    remaining: Math.max(0, limit - win.count),
    resetAt: win.resetAt,
  };
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, w] of memStore) if (now >= w.resetAt) memStore.delete(k);
  }, 5 * 60 * 1000);
}

// ── Public API ───────────────────────────────────────────────────────────────

type RouteKey = "extract" | "ingest" | "compare-summary";

const LIMITS: Record<RouteKey, { limit: number; windowMs: number }> = {
  "extract":         { limit: 10, windowMs: 10 * 60 * 1000 },
  "ingest":          { limit: 20, windowMs: 60 * 60 * 1000 },
  "compare-summary": { limit: 30, windowMs: 60 * 60 * 1000 },
};

function getLimiter(route: RouteKey) {
  switch (route) {
    case "extract":         return getExtractLimiter();
    case "ingest":          return getIngestLimiter();
    case "compare-summary": return getSummaryLimiter();
  }
}

export async function checkRateLimit(
  route: RouteKey,
  identifier: string
): Promise<RateLimitResult> {
  const hasRedis =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!hasRedis) {
    const { limit, windowMs } = LIMITS[route];
    return memCheck(`${route}:${identifier}`, limit, windowMs);
  }

  const limiter = getLimiter(route);
  const { success, remaining, reset } = await limiter.limit(identifier);
  return {
    allowed: success,
    remaining,
    resetAt: reset,
  };
}
