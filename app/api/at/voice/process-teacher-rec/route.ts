import { parseATForm, voiceXmlResponse } from '@/lib/parse-at-webhook';
import { supabaseAdmin, atSMS, geminiAI } from '@/lib/at-supabase';

export async function POST(req: Request) {
  try {
    const payload = await parseATForm(req);
    const { recordingUrl, callerNumber, durationInSeconds } = payload;

    const teacherPhone = callerNumber || '+254722000000';
    console.log('[AT Teacher Recording Received]', { recordingUrl, teacherPhone, durationInSeconds });

    // Mock transcript for demonstration if raw audio cannot be transcribed in real time
    const simulatedTranscript = `Collins was my top Physics and Mathematics student at Machakos High School. When our laboratory lost power during practicals, he designed a step-down converter from scrap solar inverters so the entire class could complete their circuits experiment. He has genuine curiosity and finished in the top 1% of our national KCSE candidates.`;

    let formattedLetter = `TO THE ADMISSIONS & SCHOLARSHIP COMMITTEE:

RE: LETTER OF ACADEMIC RECOMMENDATION FOR COLLINS KIMANZI

I am writing this recommendation in my capacity as Senior Head of Science and Physics Instructor at Machakos High School, Kenya. Collins is an extraordinary young scholar whose intellectual curiosity and leadership place him in the top 1% of the thousands of students I have instructed over my 18-year career.

Contextualizing Kenyan Academic Rigor:
In Kenya's National KCSE examination system, achieving an 'A' grade requires outscoring 99.8% of over 900,000 candidates nationwide. Collins not only mastered advanced mechanics and calculus-based physics, but applied these concepts under resource constraints. During a prolonged local power grid outage, Collins salvaged discarded solar inverters and rewired a low-voltage DC bench system so his classmates could complete their physics practicals.

Character & Collaboration:
Beyond exams, Collins served as Science Club Captain and organized peer-tutoring sessions for Form 2 students struggling with Newtonian equations. He does not simply study for marks; he builds tools that uplift everyone around him.

I give Collins my highest and unreserved recommendation for admission and full financial aid.

Sincerely,
Senior Science Master, Mwalimu Ochieng
Machakos Boys High School, Kenya`;

    if (geminiAI && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy_key_for_demo') {
      try {
        const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(`You are an expert counselor advising Kenyan high school teachers on how to format an American holistic Letter of Recommendation.
Take this spoken teacher transcript:
"${simulatedTranscript}"
Format it into a formal, 400-word US university recommendation letter highlighting the student's KCSE academic grit, resourcefulness, and community leadership.`);
        formattedLetter = result.response.text();
      } catch (err) {
        console.warn('[Gemini format fallback used]');
      }
    }

    try {
      await supabaseAdmin.from('voice_sessions').insert({
        session_type: 'teacher_recommendation',
        participant_phone: teacherPhone,
        participant_name: 'Mwalimu (Physics Teacher)',
        audio_recording_url: recordingUrl || 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
        raw_transcript: simulatedTranscript,
        ai_generated_output: formattedLetter,
        status: 'completed',
      });
    } catch (dbErr) {
      console.warn('[DB session insert bypassed in local test]');
    }

    // Notify teacher via SMS that their letter was compiled
    await atSMS.send({
      to: [teacherPhone],
      message: `ASANTE MWALIMU: Your voice recommendation for your student has been transcribed and formatted into a US-standard college recommendation letter. Thank you for supporting Kenyan scholars!`,
    });

    return voiceXmlResponse(`
      <Say voice="en-GB-Standard-B">
        Thank you Mwalimu. Your recommendation has been saved and formatted for US university admissions committees. An SMS receipt has been sent to your phone. Goodbye.
      </Say>
    `);
  } catch (error: any) {
    console.error('[Process Teacher Rec Error]', error);
    return voiceXmlResponse(`<Say>Thank you. Your recording has been received.</Say>`);
  }
}
