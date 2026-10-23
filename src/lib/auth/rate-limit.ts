import {
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MINUTES,
} from "@/lib/constants";

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitGlobal = typeof globalThis & {
  __docappLoginBuckets?: Map<string, Bucket>;
};

const globalForRateLimit = globalThis as RateLimitGlobal;
const buckets =
  globalForRateLimit.__docappLoginBuckets ??
  (globalForRateLimit.__docappLoginBuckets = new Map<string, Bucket>());

const WINDOW_MS = LOGIN_WINDOW_MINUTES * 60 * 1000;

function cleanupExpired(now: number) {
  if (buckets.size < 1_000) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function loginRateLimitKey(email: string, ip: string): string {
  return `${email.toLowerCase()}:${ip}`;
}

export function checkLoginRateLimit(key: string): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  cleanupExpired(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= LOGIN_MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordLoginFailure(key: string): void {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  bucket.count += 1;
}

export function clearLoginFailures(key: string): void {
  buckets.delete(key);
}
