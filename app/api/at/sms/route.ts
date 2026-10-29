import { NextResponse } from 'next/server';
import { parseATForm } from '@/lib/parse-at-webhook';
import { atSMS } from '@/lib/at';
import { USSD_SERVICE_CODE } from '@/lib/constants';
import { verifyWebhookSecret } from '@/lib/webhook-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { normalizeKenyanPhone } from '@/lib/phone';

/**
 * Africa's Talking Inbound SMS Webhook and Authenticated Outbound SMS endpoint.
 *
 * Security:
 * - Direct sending requires valid Authorization Bearer header matching SUPABASE_SERVICE_ROLE_KEY or WEBHOOK_SECRET.
 * - Inbound AT webhooks are verified via verifyWebhookSecret().
 * - Rate limited: 5 SMS per phone per day, 60 requests per IP per minute.
 */
export async function POST(req: Request) {
  try {
    // 1. IP Rate Limiting (60 requests per minute)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const ipLimit = checkRateLimit(`ip:${ip}`, 60, 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for IP. Retry later.', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    const payload = await parseATForm(req);
    const { from, to, text, phoneNumber, message } = payload;

    // ----------------------------------------------------
    // CASE A: Inbound SMS from Student (AT Webhook)
    // ----------------------------------------------------
    if (text) {
      // Authenticate AT webhook if secret is configured
      const auth = verifyWebhookSecret(req);
      if (!auth.authorized) {
        return NextResponse.json({ error: 'Unauthorized webhook request', reason: auth.reason }, { status: 401 });
      }

      const normalizedSender = from ? normalizeKenyanPhone(from) : null;
      if (!normalizedSender) {
        return NextResponse.json({ error: 'Invalid Kenyan sender phone number' }, { status: 400 });
      }

      // Check per-phone SMS rate limit (10 inbound queries answered per 24 hours)
      const smsLimit = checkRateLimit(`sms:inbound:${normalizedSender}`, 10, 24 * 60 * 60 * 1000);
      if (!smsLimit.allowed) {
        return NextResponse.json({ error: 'Daily SMS limit reached for phone', code: 'RATE_LIMITED' }, { status: 429 });
      }

      const query = text.trim().toUpperCase();
      let replyMessage = `Karibu Pepea! Dial ${USSD_SERVICE_CODE} on your phone for free admissions steps, KCSE GPA conversion, and CUE scam radar.`;

      if (query.includes('MIT')) {
        replyMessage = `PEPEA MIT GUIDE: Early Action Nov 1, RD Jan 5. 100% Need-blind for international students. Zero Common App fee with waiver. Dial ${USSD_SERVICE_CODE}.`;
      } else if (query.includes('HELP') || query.includes('WAIVER')) {
        replyMessage = `PEPEA WAIVERS: 1) Common App Fee Waiver: Select family income qualifies on profile. 2) CSS Profile Waiver: Email admissions with KCSE results. Free!`;
      }

      await atSMS.send({
        to: [normalizedSender],
        message: replyMessage,
      });

      return NextResponse.json({ success: true, processed: true, replyMessage });
    }

    // ----------------------------------------------------
    // CASE B: Authenticated Outbound SMS Request
    // ----------------------------------------------------
    if (phoneNumber && message) {
      // Must be authenticated by Server Secret or Service Role Key
      const authHeader = req.headers.get('authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      const serverSecret = process.env.AT_WEBHOOK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

      const isAuthorized =
        (Boolean(serverSecret) && token === serverSecret) ||
        verifyWebhookSecret(req).authorized;

      if (!isAuthorized) {
        return NextResponse.json(
          { error: 'Unauthorized: Direct SMS sending requires server authentication token', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      const normalizedRecipient = normalizeKenyanPhone(phoneNumber);
      if (!normalizedRecipient) {
        return NextResponse.json({ error: 'Invalid recipient phone number', code: 'VALIDATION' }, { status: 400 });
      }

      // Enforce rate limiting: 5 SMS per phone per 24 hours
      const smsLimit = checkRateLimit(`sms:outbound:${normalizedRecipient}`, 5, 24 * 60 * 60 * 1000);
      if (!smsLimit.allowed) {
        return NextResponse.json(
          { error: 'Recipient has exceeded 5 SMS daily limit', code: 'RATE_LIMITED' },
          { status: 429 }
        );
      }

      const res = await atSMS.send({
        to: [normalizedRecipient],
        message,
      });

      return NextResponse.json({ success: true, result: res });
    }

    return NextResponse.json({ error: 'Missing text or phoneNumber/message' }, { status: 400 });
  } catch (error: any) {
    console.error('[SMS API Error]', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
