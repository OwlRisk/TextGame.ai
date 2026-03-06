interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  /** Max requests allowed in the window (default: 60) */
  limit?: number;
  /** Window size in seconds (default: 60) */
  windowSeconds?: number;
}

const DEFAULT_LIMIT = 60;
const DEFAULT_WINDOW = 60;
const CLEANUP_INTERVAL_MS = 60_000;

const stores = new Map<string, Map<string, RateLimitEntry>>();
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function getStore(name: string): Map<string, RateLimitEntry> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

function scheduleCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const store of stores.values()) {
      for (const [key, entry] of store) {
        if (entry.resetAt <= now) store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Create a named rate limiter backed by an in-memory sliding window counter.
 * Suitable for single-instance deployments (Vercel serverless functions share
 * a warm instance for ~5-15 min). For stricter limits across instances, use
 * Redis/Upstash instead.
 */
export function createRateLimiter(name: string, opts: RateLimiterOptions = {}) {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const windowMs = (opts.windowSeconds ?? DEFAULT_WINDOW) * 1000;
  const store = getStore(name);
  scheduleCleanup();

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      let entry = store.get(key);

      if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs };
        store.set(key, entry);
      }

      entry.count++;
      const success = entry.count <= limit;
      return {
        success,
        limit,
        remaining: Math.max(0, limit - entry.count),
        resetAt: entry.resetAt,
      };
    },
  };
}

/**
 * Convenience: return a 429 Response with standard rate-limit headers.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
        "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
      },
    },
  );
}
