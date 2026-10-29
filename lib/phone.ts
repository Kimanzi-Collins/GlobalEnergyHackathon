import type { Msisdn } from './types';

/**
 * Normalizes any valid Kenyan mobile phone number to E.164 format (+254XXXXXXXXX).
 *
 * Accepts:
 *  - 07xxxxxxxx (10 digits)
 *  - 01xxxxxxxx (10 digits)
 *  - +2547xxxxxxxx or +2541xxxxxxxx (13 chars)
 *  - 2547xxxxxxxx or 2541xxxxxxxx (12 digits)
 *  - 7xxxxxxxx or 1xxxxxxxx (9 digits)
 *  - Numbers with common formatting (spaces, dashes, parentheses, dots)
 *
 * Rejects:
 *  - Landlines (e.g., 020xxxxxxx, 041xxxxxxx, 051xxxxxxx)
 *  - Non-Kenyan international numbers (e.g., +1, +44, +255, +256)
 *  - Invalid lengths (too short, too long)
 *  - Empty, undefined, non-string, or non-numeric junk
 *
 * @param phone Raw phone string from USSD, web form, WhatsApp, or SMS webhook
 * @returns Normalized E.164 string (e.g., '+254712345678') or null if invalid
 */
export function normalizeKenyanPhone(phone: string | null | undefined): Msisdn | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Trim whitespace
  const trimmed = phone.trim();
  if (!trimmed) {
    return null;
  }

  // Handle international '00' prefix (e.g. 00254...)
  let sanitized = trimmed;
  if (sanitized.startsWith('00254')) {
    sanitized = '+254' + sanitized.slice(5);
  }

  // Remove whitespace, dashes, parentheses, dots
  sanitized = sanitized.replace(/[\s\-_().]/g, '');

  // Check for invalid characters (only digits and an optional leading '+')
  if (!/^\+?\d+$/.test(sanitized)) {
    return null;
  }

  // Match the specific Kenyan mobile patterns:
  // After country prefix, valid Kenyan mobile numbers always start with 7 or 1, followed by 8 digits.

  // 1. Starts with '+254'
  if (sanitized.startsWith('+254')) {
    const subscriber = sanitized.slice(4);
    if (/^[17]\d{8}$/.test(subscriber)) {
      return `+254${subscriber}`;
    }
    return null;
  }

  // 2. Starts with '254'
  if (sanitized.startsWith('254')) {
    const subscriber = sanitized.slice(3);
    if (/^[17]\d{8}$/.test(subscriber)) {
      return `+254${subscriber}`;
    }
    return null;
  }

  // 3. Starts with '0' (local format: 07... or 01...)
  if (sanitized.startsWith('0')) {
    const subscriber = sanitized.slice(1);
    if (/^[17]\d{8}$/.test(subscriber)) {
      return `+254${subscriber}`;
    }
    return null;
  }

  // 4. Exactly 9 digits starting with 7 or 1
  if (/^[17]\d{8}$/.test(sanitized)) {
    return `+254${sanitized}`;
  }

  // Any other format (landlines, foreign country codes, wrong lengths) is rejected
  return null;
}

/**
 * Checks whether a phone number is a valid Kenyan mobile number.
 */
export function isValidKenyanPhone(phone: string | null | undefined): boolean {
  return normalizeKenyanPhone(phone) !== null;
}

/**
 * Formats a normalized or raw Kenyan mobile number in national format (e.g., 0712345678).
 */
export function formatKenyanPhoneNational(phone: string | null | undefined): string | null {
  const normalized = normalizeKenyanPhone(phone);
  if (!normalized) return null;
  // +254XXXXXXXXX -> 0XXXXXXXXX
  return `0${normalized.slice(4)}`;
}

/**
 * Formats a normalized or raw Kenyan mobile number for human display (e.g., +254 712 345 678).
 */
export function formatKenyanPhoneDisplay(phone: string | null | undefined): string | null {
  const normalized = normalizeKenyanPhone(phone);
  if (!normalized) return null;
  // +254 7XX XXX XXX
  const country = normalized.slice(0, 4);
  const prefix = normalized.slice(4, 7);
  const mid = normalized.slice(7, 10);
  const end = normalized.slice(10, 13);
  return `${country} ${prefix} ${mid} ${end}`;
}
