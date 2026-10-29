import { normalizeKenyanPhone } from './phone';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired keys every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      if (now >= record.resetAt) {
        rateLimitStore.delete(key);
      }
    });
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
  limit: number;
}

/**
 * Generic fixed-window rate limiter for in-memory use.
 *
 * @param key Unique identifier (e.g. "ai:+254712345678" or "ip:197.232.1.2")
 * @param limit Maximum allowed events in the window
 * @param windowMs Duration of the window in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record || now >= record.resetAt) {
    record = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, record);
    return {
      allowed: true,
      remaining: limit - 1,
      resetInMs: windowMs,
      limit,
    };
  }

  if (record.count < limit) {
    record.count++;
    return {
      allowed: true,
      remaining: limit - record.count,
      resetInMs: Math.max(0, record.resetAt - now),
      limit,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetInMs: Math.max(0, record.resetAt - now),
    limit,
  };
}

/**
 * Rate limit for AI calls: 20 calls per phone per hour.
 */
export function checkAiRateLimit(phone: string): RateLimitResult {
  const normalized = normalizeKenyanPhone(phone) || phone;
  const key = `rl:ai:${normalized}`;
  const limit = 20;
  const windowMs = 60 * 60 * 1000; // 1 hour
  return checkRateLimit(key, limit, windowMs);
}

/**
 * Rate limit for outbound SMS: 5 SMS per phone per day.
 */
export function checkSmsRateLimit(phone: string): RateLimitResult {
  const normalized = normalizeKenyanPhone(phone) || phone;
  const key = `rl:sms:${normalized}`;
  const limit = 5;
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours
  return checkRateLimit(key, limit, windowMs);
}

/**
 * Rate limit for IP addresses: 60 requests per IP per minute.
 */
export function checkIpRateLimit(ip: string): RateLimitResult {
  const sanitizedIp = ip.trim() || 'unknown';
  const key = `rl:ip:${sanitizedIp}`;
  const limit = 60;
  const windowMs = 60 * 1000; // 1 minute
  return checkRateLimit(key, limit, windowMs);
}

/**
 * Default rate limit helper (defaults to AI rate limit per phone).
 */
export const rateLimit = checkAiRateLimit;

export function resetRateLimits(): void {
  rateLimitStore.clear();
}
