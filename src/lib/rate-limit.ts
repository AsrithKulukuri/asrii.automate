/**
 * Production-ready in-memory sliding window rate limiter.
 * Suitable for serverless / edge runtime protection against abuse.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale records every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  limit: number; // Max requests allowed
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Milliseconds until window resets
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 60, windowMs: 60000 }
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Retain only timestamps within the current window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= options.limit) {
    const oldest = record.timestamps[0] || now;
    const reset = Math.max(0, options.windowMs - (now - oldest));
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset,
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - record.timestamps.length,
    reset: options.windowMs,
  };
}
