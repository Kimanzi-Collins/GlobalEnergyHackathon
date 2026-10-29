import { NextResponse } from 'next/server';
import { parseATForm } from '@/lib/parse-at-webhook';
import { sendWhatsAppMessage } from '@/lib/at';
import { verifyWebhookSecret } from '@/lib/webhook-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { normalizeKenyanPhone } from '@/lib/phone';
import { saveConversationMessage } from '@/lib/db';
import { POST as handleChat } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';

// De-duplicate retries by provider_message_id (store last 500 ids for 1 hour)
const processedMessageIds = new Map<string, number>();

function isDuplicateMessage(id?: string): boolean {
  if (!id) return false;
  const now = Date.now();
  // Clean entries older than 1 hour
  if (processedMessageIds.size > 500) {
    for (const [key, timestamp] of processedMessageIds.entries()) {
      if (now - timestamp > 60 * 60 * 1000) processedMessageIds.delete(key);
    }
  }
  if (processedMessageIds.has(id)) return true;
  processedMessageIds.set(id, now);
  return false;
}

/**
 * Splits replies exceeding WhatsApp 900-character single-bubble threshold.
 */
function splitWhatsAppMessage(text: string, maxLength = 900): string[] {
  if (text.length <= maxLength) return [text];
  const parts: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      parts.push(remaining);
      break;
    }
    // Find optimal break on newline or space
    let breakIdx = remaining.lastIndexOf('\n\n', maxLength);
    if (breakIdx === -1 || breakIdx < maxLength / 2) {
      breakIdx = remaining.lastIndexOf('\n', maxLength);
    }
    if (breakIdx === -1 || breakIdx < maxLength / 2) {
      breakIdx = remaining.lastIndexOf(' ', maxLength);
    }
    if (breakIdx === -1) breakIdx = maxLength;

    parts.push(remaining.slice(0, breakIdx).trim());
    remaining = remaining.slice(breakIdx).trim();
  }

  return parts;
}

/**
 * Live Africa's Talking WhatsApp Webhook Handler: /api/at/whatsapp
 *
 * Responsibilities:
 * 1. Verifies shared webhook secret (`verifyWebhookSecret`).
 * 2. De-duplicates retries using `provider_message_id` / `id`.
 * 3. Normalizes sender phone to E.164.
 * 4. Checks STOP/HELP ergonomics:
 *    - STOP: opt-out acknowledgment.
 *    - HELP: quick command summary.
 * 5. Calls `/api/chat` with `channel: 'whatsapp'`.
 * 6. Splits replies > 900 chars and dispatches them via AT WhatsApp Send API.
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate webhook request
    const auth = verifyWebhookSecret(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized webhook request', reason: auth.reason }, { status: 401 });
    }

    const payload = await parseATForm(req);
    const { from, text, id } = payload;

    // 2. De-duplicate retries by message id
    if (id && isDuplicateMessage(id)) {
      console.log(`[WhatsApp Webhook] Ignored duplicate message ID: ${id}`);
      return NextResponse.json({ status: 'ignored_duplicate', id });
    }

    const studentPhone = from ? normalizeKenyanPhone(from) : null;
    if (!studentPhone) {
      return NextResponse.json({ error: 'Invalid or missing sender phone number' }, { status: 400 });
    }

    const incomingText = (text || '').trim();
    if (!incomingText) {
      return NextResponse.json({ status: 'empty_text_ignored' });
    }

    // 3. Ergonomics: STOP & HELP handling
    const upper = incomingText.toUpperCase();
    if (upper === 'STOP' || upper === 'UNSUBSCRIBE') {
      const stopMsg = `Pepea: You have been unsubscribed from WhatsApp admissions updates. To resume, message START or Karibu anytime!`;
      await sendWhatsAppMessage({ to: studentPhone, message: stopMsg });
      return NextResponse.json({ status: 'unsubscribed', recipient: studentPhone });
    }

    if (upper === 'HELP' || upper === 'MENU') {
      const helpMsg =
        `*PEPEA WHATSAPP HELP*\n\n` +
        `• Send your KCSE grade (e.g. "I got an A- in KCSE") for GPA & 100% aid matches.\n` +
        `• Paste your essay draft for an Admissions Officer review.\n` +
        `• Ask about application fee waivers (Common App & CSS Profile are $0).\n` +
        `• Ask about rogue agencies to run our CUE radar check.\n\n` +
        `Reply with any question to begin!`;
      await sendWhatsAppMessage({ to: studentPhone, message: helpMsg });
      return NextResponse.json({ status: 'help_sent', recipient: studentPhone });
    }

    // 4. Per-phone rate limit (20 chat calls per hour)
    const rateCheck = checkRateLimit(`wa:${studentPhone}`, 20, 60 * 60 * 1000);
    if (!rateCheck.allowed) {
      const limitMsg = `Pepea: You have reached the hourly AI query limit. Please try again in ${Math.ceil(rateCheck.resetInMs / 60000)} minutes.`;
      await sendWhatsAppMessage({ to: studentPhone, message: limitMsg });
      return NextResponse.json({ error: 'Rate limit exceeded', code: 'RATE_LIMITED' }, { status: 429 });
    }

    // 5. Delegate to the multi-channel chat router
    const chatReq = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: studentPhone,
        message: incomingText,
        channel: 'whatsapp',
      }),
    });

    const chatRes = await handleChat(chatReq);
    const chatData = await chatRes.json();

    let reply = chatData.reply || 'Karibu Pepea! How can I assist with your US university applications today?';

    // Format quick-reply buttons into readable WhatsApp message footer if present
    if (Array.isArray(chatData.quickReplies) && chatData.quickReplies.length > 0) {
      reply += `\n\n*Quick Options:*\n` + chatData.quickReplies.map((r: string, idx: number) => `[${idx + 1}] ${r}`).join('\n');
    }

    // 6. Split messages exceeding 900 chars and send via AT WhatsApp API
    const messageParts = splitWhatsAppMessage(reply, 900);
    for (const part of messageParts) {
      await sendWhatsAppMessage({
        to: studentPhone,
        message: part,
      });
    }

    return NextResponse.json({
      status: 'success',
      partsSent: messageParts.length,
      module: chatData.module,
      recipient: studentPhone,
    });
  } catch (error: any) {
    console.error('[WhatsApp Webhook Error]', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
