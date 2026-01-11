/**
 * Rate limiting service for API endpoints
 *
 * This module provides a simple in-memory token bucket rate limiter for development.
 * In production, this should be replaced with a Redis/Upstash-backed solution for
 * distributed rate limiting across multiple server instances.
 *
 * Token Bucket Algorithm:
 * - Each key (e.g., IP address) gets a bucket with a maximum number of tokens
 * - Tokens are consumed on each request
 * - Tokens refill over time based on the configured window
 * - When bucket is empty, requests are rate limited
 */

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

/**
 * In-memory storage for rate limit buckets
 * WARNING: This is not suitable for production with multiple server instances
 * Use Redis or similar for distributed rate limiting in production
 */
const buckets = new Map<string, RateLimitBucket>();

/**
 * Cleanup interval to remove old buckets and prevent memory leaks
 */
const CLEANUP_INTERVAL = 60000; // 1 minute
let lastCleanup = Date.now();

/**
 * Remove buckets that haven't been used in the last hour
 */
function cleanupOldBuckets(): void {
  const now = Date.now();
  const oneHourAgo = now - 3600000;

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.lastRefill < oneHourAgo) {
      buckets.delete(key);
    }
  }

  lastCleanup = now;
}

/**
 * Check if a request should be rate limited
 *
 * @param options - Rate limiting options
 * @param options.key - Unique identifier for the rate limit (e.g., IP address)
 * @param options.limit - Maximum number of requests allowed in the window
 * @param options.windowMs - Time window in milliseconds
 * @returns Result indicating if request is allowed and retry time if blocked
 *
 * @example
 * const result = ensureRateLimit({
 *   key: request.headers.get("x-forwarded-for") || "unknown",
 *   limit: 5,
 *   windowMs: 60000 // 1 minute
 * });
 *
 * if (!result.allowed) {
 *   return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
 *     status: 429,
 *     headers: { "Retry-After": result.retryAfter?.toString() || "60" }
 *   });
 * }
 */
export function ensureRateLimit(options: RateLimitOptions): RateLimitResult {
  const { key, limit, windowMs } = options;
  const now = Date.now();

  // Periodic cleanup to prevent memory leaks
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanupOldBuckets();
  }

  let bucket = buckets.get(key);

  // Initialize bucket if it doesn't exist
  if (!bucket) {
    bucket = {
      tokens: limit - 1,
      lastRefill: now,
    };
    buckets.set(key, bucket);
    return { allowed: true };
  }

  // Calculate tokens to refill based on time elapsed
  const timeSinceLastRefill = now - bucket.lastRefill;
  const refillRate = limit / windowMs;
  const tokensToAdd = timeSinceLastRefill * refillRate;

  // Refill tokens up to the limit
  bucket.tokens = Math.min(limit, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  // Check if we have tokens available
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    buckets.set(key, bucket);
    return { allowed: true };
  }

  // Calculate retry after time
  const tokensNeeded = 1 - bucket.tokens;
  const retryAfterMs = tokensNeeded / refillRate;
  const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

  return {
    allowed: false,
    retryAfter: retryAfterSeconds,
  };
}

/**
 * Reset rate limit for a specific key
 * Useful for testing or manual intervention
 */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Clear all rate limit buckets
 * Useful for testing
 */
export function clearAllRateLimits(): void {
  buckets.clear();
  lastCleanup = Date.now();
}
