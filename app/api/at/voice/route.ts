import { voiceXmlResponse } from '@/lib/parse-at-webhook';

export async function POST(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  return voiceXmlResponse(`
    <Say voice="en-GB-Standard-B">
      Welcome to Pepea Admissions Voice Studio.
      Press 1 if you are an applicant taking a 30 second live mock interview.
      Press 2 if you are a high school teacher recording a student recommendation letter.
    </Say>
    <GetDigits timeout="12" numDigits="1" callbackUrl="${baseUrl}/api/at/voice/branch">
      <Say>Please press 1 or 2 on your phone keypad now.</Say>
    </GetDigits>
  `);
}
