import { NextResponse } from 'next/server';

export interface ATWebhookPayload {
  sessionId?: string;
  serviceCode?: string;
  phoneNumber?: string;
  callerNumber?: string;
  destinationNumber?: string;
  text?: string;
  dtmfDigits?: string;
  recordingUrl?: string;
  durationInSeconds?: string;
  currencyCode?: string;
  amount?: string;
  from?: string;
  to?: string;
  date?: string;
  id?: string;
  [key: string]: any;
}

/**
 * Robustly parses Africa's Talking incoming form-data or JSON webhooks.
 */
export async function parseATForm(req: Request): Promise<ATWebhookPayload> {
  const contentType = req.headers.get('content-type') || '';
  const result: Record<string, any> = {};

  try {
    if (contentType.includes('application/json')) {
      const json = await req.json();
      return json;
    }

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        result[key] = value.toString();
      });
      return result;
    }

    // Fallback: parse raw text
    const rawText = await req.text();
    const params = new URLSearchParams(rawText);
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  } catch (error) {
    console.error('[AT Parse Error]', error);
    return {};
  }
}

/**
 * Returns an Africa's Talking compliant USSD response.
 * Prepend CON to keep session open, or END to close session.
 */
export function ussdResponse(message: string, isEnd: boolean = false): Response {
  const prefix = isEnd ? 'END ' : 'CON ';
  return new Response(`${prefix}${message.trim()}`, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

/**
 * Returns an Africa's Talking compliant Voice XML response.
 */
export function voiceXmlResponse(xmlBody: string): Response {
  const trimmed = xmlBody.trim();
  const xml = trimmed.startsWith('<?xml')
    ? trimmed
    : `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n${trimmed}\n</Response>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
    },
  });
}
