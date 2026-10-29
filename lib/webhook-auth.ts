import crypto from 'crypto';

export interface WebhookAuthResult {
  authorized: boolean;
  reason?: string;
}

/**
 * Compares two strings in constant time using SHA-256 and timingSafeEqual
 * to avoid timing side-channel attacks on secret comparison.
 */
export function safeCompareSecrets(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const hashProvided = crypto.createHash('sha256').update(provided).digest();
  const hashExpected = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(hashProvided, hashExpected);
}

/**
 * Verifies Africa's Talking webhook requests via shared secret in query string or header,
 * plus optional IP allowlist.
 *
 * Check order:
 *  1. Query parameter: ?secret=...
 *  2. Header: x-webhook-secret or x-at-secret
 *  3. Optional IP allowlist from AT_ALLOWED_IPS environment variable
 *
 * In demo mode (NEXT_PUBLIC_DEMO_MODE=true), if AT_WEBHOOK_SECRET is not configured,
 * requests are allowed with a warning to facilitate quick hackathon testing.
 */
export function verifyWebhookSecret(req: Request): WebhookAuthResult {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const expectedSecret = process.env.AT_WEBHOOK_SECRET;

  // If in demo mode and no secret is configured, permit requests
  if (isDemoMode && !expectedSecret) {
    return { authorized: true };
  }

  if (!expectedSecret) {
    return {
      authorized: false,
      reason: 'Server configuration error: AT_WEBHOOK_SECRET is not set in live mode.',
    };
  }

  // 1. Check query parameter
  const url = new URL(req.url);
  const querySecret = url.searchParams.get('secret');

  // 2. Check headers
  const headerSecret = req.headers.get('x-webhook-secret') || req.headers.get('x-at-secret');

  const providedSecret = querySecret || headerSecret;

  if (!providedSecret) {
    return {
      authorized: false,
      reason: 'Missing webhook secret in query parameter or headers.',
    };
  }

  if (!safeCompareSecrets(providedSecret, expectedSecret)) {
    return {
      authorized: false,
      reason: 'Invalid webhook secret.',
    };
  }

  // 3. Optional IP Allowlist check
  const allowedIpsEnv = process.env.AT_ALLOWED_IPS;
  if (allowedIpsEnv) {
    const allowedIps = allowedIpsEnv.split(',').map((ip) => ip.trim());
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      '';

    if (!allowedIps.includes(clientIp)) {
      return {
        authorized: false,
        reason: `Client IP ${clientIp} is not in AT_ALLOWED_IPS allowlist.`,
      };
    }
  }

  return { authorized: true };
}

/**
 * Boolean convenience helper for route handlers.
 */
export function isWebhookAuthorized(req: Request): boolean {
  return verifyWebhookSecret(req).authorized;
}
