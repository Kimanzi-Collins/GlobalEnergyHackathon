import { parseATForm, voiceXmlResponse } from '@/lib/parse-at-webhook';

export async function POST(req: Request) {
  const payload = await parseATForm(req);
  const dtmfDigits = payload.dtmfDigits || '1';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (dtmfDigits === '2') {
    // Teacher Recommendation recording flow
    return voiceXmlResponse(`
      <Say voice="en-GB-Standard-B">
        Thank you Mwalimu. After the beep, please speak for 30 seconds about how this student showed academic grit, curiosity, or solved a difficult problem in your school. Press hash when you are finished.
      </Say>
      <Record finishOnKey="#" maxLength="45" trimSilence="true" playBeep="true" callbackUrl="${baseUrl}/api/at/voice/process-teacher-rec"/>
    `);
  }

  // Option 1: Live Mock Interview
  return voiceXmlResponse(`
    <Say voice="en-GB-Standard-B">
      Admissions Committee Question: You have 30 seconds. Why are you applying to study in the United States, and what specific problem in Kenya do you want to solve when you graduate? Speak after the beep and press hash when finished.
    </Say>
    <Record finishOnKey="#" maxLength="45" trimSilence="true" playBeep="true" callbackUrl="${baseUrl}/api/at/voice/process-interview"/>
  `);
}
