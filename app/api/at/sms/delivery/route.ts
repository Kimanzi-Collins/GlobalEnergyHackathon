import { NextResponse } from 'next/server';
import { parseATForm } from '@/lib/parse-at-webhook';
import { verifyWebhookSecret } from '@/lib/webhook-auth';
import { supabaseAdmin } from '@/lib/at-supabase';

/**
 * Africa's Talking SMS Delivery Report Webhook
 * AT POSTs: id, status, phoneNumber, networkCode, failureReason, retryCount
 */
export async function POST(req: Request) {
  // 1. Webhook Secret Authentication
  const auth = verifyWebhookSecret(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized', reason: auth.reason }, { status: 401 });
  }

  try {
    const payload = await parseATForm(req);
    const { id, status, phoneNumber, failureReason } = payload;

    if (!id) {
      return NextResponse.json({ error: 'Missing message id' }, { status: 400 });
    }

    console.log(`[AT SMS Delivery Report] ID=${id} Status=${status} Phone=${phoneNumber} Reason=${failureReason || 'none'}`);

    // If matching row exists in conversation_messages, update status or note
    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('conversation_messages')
          .update({
            // Provider message id matches
            module: status === 'Success' ? 'sms_delivered' : 'sms_failed',
          })
          .eq('provider_message_id', id);
      } catch (dbErr) {
        // Non-blocking log
        console.warn('[AT SMS Delivery DB update non-fatal error]:', (dbErr as Error).message);
      }
    }

    return NextResponse.json({ received: true, id, status });
  } catch (err: any) {
    console.error('[AT SMS Delivery Webhook Error]', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
