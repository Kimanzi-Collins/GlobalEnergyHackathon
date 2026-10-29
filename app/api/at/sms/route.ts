import { NextResponse } from 'next/server';
import { parseATForm } from '@/lib/parse-at-webhook';
import { atSMS } from '@/lib/at-supabase';

export async function POST(req: Request) {
  try {
    const payload = await parseATForm(req);
    const { from, to, text } = payload;

    // Inbound SMS query processing
    if (text) {
      const query = text.trim().toUpperCase();
      let replyMessage = `Karibu Pepea! Dial *384*PEPEA# on your phone for free abroad admissions tracking, KCSE to GPA conversion, and CUE scam check.`;

      if (query.includes('MIT')) {
        replyMessage = `PEPEA MIT GUIDE: Early Action Nov 1, RD Jan 5. 100% Need-blind for international students. Zero Common App fee with waiver. Use Pepea AO Studio to polish your 200w supplement!`;
      } else if (query.includes('HELP') || query.includes('WAIVER')) {
        replyMessage = `PEPEA WAIVERS: 1) Common App Fee Waiver: Select 'Family income qualifies' on profile. 2) CSS Profile Waiver: Email admissions office directly with KCSE results slip. $0 cost!`;
      }

      if (from) {
        await atSMS.send({
          to: [from],
          message: replyMessage,
        });
      }

      return NextResponse.json({ success: true, processed: true, replyMessage });
    }

    // Direct API send request
    const { phoneNumber, message } = payload;
    if (phoneNumber && message) {
      const res = await atSMS.send({
        to: [phoneNumber],
        message,
      });
      return NextResponse.json({ success: true, result: res });
    }

    return NextResponse.json({ error: 'Missing phoneNumber or message' }, { status: 400 });
  } catch (error: any) {
    console.error('[SMS API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
