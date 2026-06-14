/**
 * In-memory sliding-window rate limiter.
 *
 * Limits are driven by env vars (adjustable without code change):
 *   RATE_LIMIT_VERIFY  — /auth/verify  requests per minute   (default 5)
 *   RATE_LIMIT_REQUEST — /auth/request requests per 2 hours  (default 2)
 *   RATE_LIMIT_CHAT    — /chat         requests per minute   (default 20)
 *
 * - Node.js runtime (persistent Map across requests)
 * - Cap-triggered sweep: cleans stale keys only when Map approaches MAX_KEYS
 * - No setInterval, no external dependencies
 */

interface Bucket {
  timestamps: number[];
}

const store = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

/** Max window used in the app (2 hours). Used as sweep horizon. */
const MAX_WINDOW_SECONDS = 7_200;

// ── Limit configuration (from env, with defaults) ──────
export const RATE_LIMIT = {
  verify:  { limit: Number(process.env.RATE_LIMIT_VERIFY  || "5"),  windowSeconds:      60 },
  request: { limit: Number(process.env.RATE_LIMIT_REQUEST || "2"),  windowSeconds: 7_200 },
  chat:    { limit: Number(process.env.RATE_LIMIT_CHAT    || "20"), windowSeconds:      60 },
} as const;

/** Remove stale buckets & prune old timestamps from active ones. */
function sweep(): void {
  const now = Date.now();
  const horizon = MAX_WINDOW_SECONDS * 1000;
  for (const [key, bucket] of store) {
    bucket.timestamps = bucket.timestamps.filter(
      (ts) => now - ts < horizon,
    );
    if (bucket.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

/**
 * Check or apply a rate limit.
 *
 * @param key           Unique bucket key (e.g. `verify:1.2.3.4` or `chat:cookieVal`)
 * @param limit         Max allowed hits in the window
 * @param windowSeconds Sliding window duration in seconds
 * @returns             Whether the request is allowed + how many remain
 */
export function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): { allowed: boolean; remaining: number } {
  // ── Cap-triggered sweep ────────────────────────────
  if (store.size >= MAX_KEYS) {
    sweep();
    // Still over cap → evict oldest key
    if (store.size >= MAX_KEYS) {
      const firstKey = store.keys().next().value;
      if (firstKey) store.delete(firstKey);
    }
  }

  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  let bucket = store.get(key);

  if (!bucket) {
    bucket = { timestamps: [] };
    store.set(key, bucket);
  }

  // ── Prune this bucket's stale timestamps ───────────
  bucket.timestamps = bucket.timestamps.filter(
    (ts) => now - ts < windowMs,
  );

  const remaining = limit - bucket.timestamps.length;

  if (remaining <= 0) {
    return { allowed: false, remaining: 0 };
  }

  bucket.timestamps.push(now);
  return { allowed: true, remaining: remaining - 1 };
}

/**
 * Extract real client IP from Cloudflare Tunnel header.
 * Returns `null` when header is missing (should reject in production).
 */
export function getClientIp(req: Request): string | null {
  return req.headers.get("cf-connecting-ip") || null;
}

const COOKIE_NAME = "interview_me";

/**
 * Extract the access cookie value from the request headers.
 * Returns `null` when cookie is missing.
 */
export function getCookieValue(req: Request): string | null {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(
    new RegExp(`${COOKIE_NAME}=([^;]+)`),
  );
  return match ? match[1] : null;
}
