import { normalizeKenyanPhone } from './phone';

export class UpstreamAtError extends Error {
  code = 'UPSTREAM_AT' as const;
  details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'UpstreamAtError';
    this.details = details;
  }
}

export interface SendSmsOptions {
  to: string | string[];
  message: string;
  from?: string;
}

export interface SendWhatsAppOptions {
  to: string;
  message: string;
}

export interface MakeVoiceCallOptions {
  callFrom: string;
  callTo: string[];
}

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const username = process.env.AT_USERNAME || 'sandbox';
const apiKey = process.env.AT_API_KEY || '';
const senderId = process.env.AT_SENDER_ID || 'PEPEA';

let atInstance: any = null;
let atSMSClient: any = null;
let atVoiceClient: any = null;

try {
  if (apiKey && apiKey !== 'dummy_key_for_demo') {
    const AfricasTalking = require('africastalking');
    atInstance = AfricasTalking({ username, apiKey });
    atSMSClient = atInstance.SMS;
    atVoiceClient = atInstance.VOICE;
  }
} catch (err: any) {
  if (!isDemoMode) {
    console.error('[Africa\'s Talking] Client initialization failed:', err.message);
  }
}

/**
 * Sends an SMS message via Africa's Talking.
 * Normalizes all phone numbers to E.164.
 * Live mode throws UpstreamAtError on failure; demo mode provides a mock response if keys are omitted.
 */
export async function sendSms(options: SendSmsOptions): Promise<any> {
  const recipients = (Array.isArray(options.to) ? options.to : [options.to])
    .map((p) => normalizeKenyanPhone(p))
    .filter((p): p is string => p !== null);

  if (recipients.length === 0) {
    throw new UpstreamAtError('No valid Kenyan recipient phone numbers provided for SMS', {
      rawTo: options.to,
    });
  }

  if (atSMSClient) {
    try {
      const response = await atSMSClient.send({
        to: recipients,
        message: options.message,
        from: options.from || (username === 'sandbox' ? undefined : senderId),
      });

      // Check if Africa's Talking returned a failure in recipients array
      const recipientsData = response?.SMSMessageData?.Recipients;
      if (Array.isArray(recipientsData)) {
        const failedRecipients = recipientsData.filter(
          (r: any) => r.status !== 'Success' && r.statusCode !== 101 && r.statusCode !== 100
        );
        if (failedRecipients.length > 0 && !isDemoMode) {
          throw new UpstreamAtError(`AT SMS delivery failed for some recipients`, {
            failedRecipients,
            response,
          });
        }
      }

      return response;
    } catch (err: any) {
      if (!isDemoMode) {
        throw new UpstreamAtError(`Africa's Talking SMS API error: ${err.message}`, {
          recipients,
          originalError: err.message,
        });
      }
      console.warn('[AT SMS] API call failed in demo mode, falling back to mock:', err.message);
    }
  }

  // Demo mode mock fallback
  if (isDemoMode) {
    console.log('[MOCK AT SMS SENT]:', { to: recipients, message: options.message });
    return {
      SMSMessageData: {
        Message: `Sent to ${recipients.length}/${recipients.length} Total Cost: KES 0.8000`,
        Recipients: recipients.map((num) => ({
          statusCode: 101,
          number: num,
          status: 'Success',
          cost: 'KES 0.8000',
          messageId: `MOCK_SMS_${Date.now()}`,
        })),
      },
    };
  }

  throw new UpstreamAtError(
    "Africa's Talking SMS client not configured. Set AT_API_KEY and AT_USERNAME in .env.local",
    { recipients }
  );
}

/**
 * Sends a WhatsApp message via Africa's Talking WhatsApp channel.
 */
export async function sendWhatsApp(options: SendWhatsAppOptions): Promise<any> {
  const normalizedTo = normalizeKenyanPhone(options.to);
  if (!normalizedTo) {
    throw new UpstreamAtError(`Invalid recipient phone for WhatsApp: ${options.to}`);
  }

  if (apiKey && apiKey !== 'dummy_key_for_demo') {
    try {
      // Africa's Talking WhatsApp API endpoint
      const endpoint = 'https://chat.africastalking.com/v1/messages';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apiKey: apiKey,
        },
        body: JSON.stringify({
          username,
          to: normalizedTo,
          message: options.message,
          channel: 'whatsapp',
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`AT WhatsApp returned status ${res.status}: ${text}`);
      }

      return await res.json();
    } catch (err: any) {
      if (!isDemoMode) {
        throw new UpstreamAtError(`Africa's Talking WhatsApp error: ${err.message}`, {
          to: normalizedTo,
          originalError: err.message,
        });
      }
      console.warn('[AT WhatsApp] Live API call failed in demo mode, falling back to mock:', err.message);
    }
  }

  if (isDemoMode) {
    console.log('[MOCK AT WHATSAPP SENT]:', { to: normalizedTo, message: options.message });
    return {
      status: 'queued',
      channel: 'whatsapp',
      recipient: normalizedTo,
      messageId: `MOCK_WA_${Date.now()}`,
    };
  }

  throw new UpstreamAtError(
    "Africa's Talking WhatsApp client not configured. Set AT_API_KEY and AT_USERNAME in .env.local",
    { to: normalizedTo }
  );
}

/**
 * Places an outbound voice call via Africa's Talking Voice API (used for mock interview simulation).
 */
export async function makeVoiceCall(options: MakeVoiceCallOptions): Promise<any> {
  if (atVoiceClient) {
    try {
      return await atVoiceClient.call(options);
    } catch (err: any) {
      if (!isDemoMode) {
        throw new UpstreamAtError(`Africa's Talking Voice error: ${err.message}`, {
          options,
          originalError: err.message,
        });
      }
    }
  }

  if (isDemoMode) {
    console.log('[MOCK AT VOICE CALL]:', options);
    return {
      entries: options.callTo.map((num) => ({
        phoneNumber: num,
        status: 'Queued',
        sessionId: `AT_VOICE_SESSION_${Date.now()}`,
      })),
      errorMessage: 'None',
    };
  }

  throw new UpstreamAtError(
    "Africa's Talking Voice client not configured. Set AT_API_KEY and AT_USERNAME in .env.local"
  );
}
