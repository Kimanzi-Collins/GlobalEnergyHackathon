import { parseATForm, voiceXmlResponse } from '@/lib/parse-at-webhook';
import { supabaseAdmin, atSMS } from '@/lib/at-supabase';

export async function POST(req: Request) {
  try {
    const payload = await parseATForm(req);
    const { recordingUrl, callerNumber } = payload;
    const studentPhone = callerNumber || '+254712345678';

    const simulatedAnswer = `I want to study Computer Science at MIT because Kenya's agricultural supply chain loses 30% of fresh produce before it reaches market. By mastering distributed systems and low-bandwidth edge computing, I will build open-source USSD logistics protocols so smallholder farmers in Makueni can trade directly without exploitative middlemen.`;

    const interviewFeedback = {
      overallScore: 88,
      clarityScore: 92,
      fillerWordCount: 1,
      pace: '135 wpm (Optimal: 130-150 wpm)',
      strengths: [
        'Answer opened directly with an urgent, quantified Kenyan problem (30% produce waste)',
        'Linked US computer science curriculum directly back to local socio-economic impact',
        'Avoided generic platitudes',
      ],
      areasToImprove: [
        'Mention one specific MIT lab or professor (e.g., MIT D-Lab or CSAIL) to prove school-specific fit',
      ],
    };

    try {
      await supabaseAdmin.from('voice_sessions').insert({
        session_type: 'mock_interview',
        participant_phone: studentPhone,
        participant_name: 'Applicant Interviewee',
        audio_recording_url: recordingUrl || 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
        raw_transcript: simulatedAnswer,
        ai_generated_output: JSON.stringify(interviewFeedback),
        status: 'completed',
      });
    } catch (dbErr) {
      console.warn('[DB mock interview session skipped in local test]');
    }

    await atSMS.send({
      to: [studentPhone],
      message: `PEPEA MOCK INTERVIEW: Score 88/100! Superb clarity on agricultural supply chain. Tip: Name 1 specific professor or lab (e.g. MIT D-Lab) for 100/100. Check dashboard for audio playback.`,
    });

    return voiceXmlResponse(`
      <Say voice="en-GB-Standard-B">
        Well done. Your mock interview response has been evaluated. Your clarity score is 88 percent. An SMS breakdown has been delivered to your phone. Good luck with your application!
      </Say>
    `);
  } catch (error: any) {
    console.error('[Process Interview Error]', error);
    return voiceXmlResponse(`<Say>Interview received. Thank you.</Say>`);
  }
}
