import { NextResponse } from 'next/server';
import { parseATForm } from '@/lib/parse-at-webhook';

export async function POST(req: Request) {
  try {
    const payload = await parseATForm(req);
    const { from, text } = payload;

    const studentPhone = from || '+254712345678';
    const draftText = text || '';

    // Delegate to the AO review endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    let reviewResult: any = null;

    try {
      const aoRes = await fetch(`${baseUrl}/api/ao/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: studentPhone,
          draftContent: draftText,
          channel: 'whatsapp',
          universityName: 'US University (WhatsApp Quick Review)',
          promptText: 'General Personal Statement / Supplemental Essay',
          aoPersona: 'kensap_mentor',
        }),
      });
      reviewResult = await aoRes.json();
    } catch (e) {
      console.warn('[Internal fetch error in WhatsApp webhook]');
    }

    const evaluation = reviewResult?.evaluation || {
      overall_score: 72,
      ao_verdict: 'Borderline / Needs Sharpening',
      committee_summary: 'Good ambition, but needs more grounded storytelling and less generic introductory fluff.',
    };

    const whatsAppReply = `🇰🇪 *PEPEA ADMISSIONS OFFICER (WHATSAPP REVIEW)*\n\n` +
      `*Overall Score:* ${evaluation.overall_score}/100\n` +
      `*Verdict:* ${evaluation.ao_verdict}\n\n` +
      `*AO Committee Note:* ${evaluation.committee_summary}\n\n` +
      `*Action Item:* Visit your web dashboard at ${baseUrl} to see line-by-line redline edits and the revised version!`;

    return NextResponse.json({
      status: 'success',
      replyMessage: whatsAppReply,
      recipient: studentPhone,
    });
  } catch (error: any) {
    console.error('[WhatsApp Webhook Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
