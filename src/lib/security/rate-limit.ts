type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

declare global {
  var __nibbleRateLimitStore: Map<string, RateLimitBucket> | undefined;
}

const store =
  globalThis.__nibbleRateLimitStore ?? new Map<string, RateLimitBucket>();
globalThis.__nibbleRateLimitStore = store;

function clearExpired(now: number) {
  if (store.size < 2_000) return;
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  clearExpired(now);

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, options.limit - 1),
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000),
      ),
    };
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}
