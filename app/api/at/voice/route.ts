import { voiceXmlResponse } from '@/lib/parse-at-webhook';

/**
 * Africa's Talking Voice entry point. The only voice flow is the live mock
 * admissions interview, so the call goes straight to the question and records
 * the answer.
 */
export async function POST(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  return voiceXmlResponse(`
    <Say voice="en-GB-Standard-B">
      Welcome to the Pepea mock admissions interview.
      Admissions Committee Question: You have 30 seconds. Why are you applying to study in the United States, and what specific problem in Kenya do you want to solve when you graduate? Speak after the beep and press hash when finished.
    </Say>
    <Record finishOnKey="#" maxLength="45" trimSilence="true" playBeep="true" callbackUrl="${baseUrl}/api/at/voice/process-interview"/>
  `);
}
