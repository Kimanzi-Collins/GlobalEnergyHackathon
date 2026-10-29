import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// 1. Supabase Initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!isDemoMode) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      '[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in live mode. ' +
      'Set these in .env.local or enable NEXT_PUBLIC_DEMO_MODE=true for local presentation demo.'
    );
  }
}

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://demo.supabase.co',
  supabaseKey || 'demo-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// 2. Google Gemini Initialization
const geminiApiKey = process.env.GEMINI_API_KEY || '';
if (!isDemoMode && !geminiApiKey) {
  console.warn('[Gemini] GEMINI_API_KEY is not set. Gemini calls will fail in live mode.');
}
export const geminiAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// 3. Africa's Talking Client Initialization
const username = process.env.AT_USERNAME || 'sandbox';
const apiKey = process.env.AT_API_KEY || '';

let africastalkingInstance: any = null;
let atSMSClient: any = null;
let atVoiceClient: any = null;

try {
  if (apiKey && apiKey !== 'dummy_key_for_demo') {
    const AfricasTalking = require('africastalking');
    africastalkingInstance = AfricasTalking({
      username,
      apiKey,
    });
    atSMSClient = africastalkingInstance.SMS;
    atVoiceClient = africastalkingInstance.VOICE;
  }
} catch (err) {
  if (!isDemoMode) {
    console.error('[Africa\'s Talking] Failed to initialize in live mode:', (err as Error).message);
  }
}

// SMS sender
export const atSMS = {
  send: async (options: { to: string[]; message: string; from?: string }) => {
    if (atSMSClient) {
      return atSMSClient.send({
        to: options.to,
        message: options.message,
        from: options.from || process.env.AT_SENDER_ID || undefined,
      });
    }

    if (isDemoMode) {
      console.log('[MOCK AT SMS SENT]:', options);
      return {
        SMSMessageData: {
          Message: 'Sent to 1/1 Total Cost: KES 0.8000',
          Recipients: options.to.map((num) => ({
            statusCode: 101,
            number: num,
            status: 'Success',
            cost: 'KES 0.8000',
            messageId: `MOCK_MSG_${Date.now()}`,
          })),
        },
      };
    }

    throw new Error('[Africa\'s Talking] SMS service not initialized. Missing AT_API_KEY or failed setup in live mode.');
  },
};

// Outbound voice caller
export const atVoice = {
  call: async (options: { callFrom: string; callTo: string[] }) => {
    if (atVoiceClient) {
      return atVoiceClient.call(options);
    }

    if (isDemoMode) {
      console.log('[MOCK AT VOICE OUTBOUND CALL]:', options);
      return {
        entries: options.callTo.map((num) => ({
          phoneNumber: num,
          status: 'Queued',
          sessionId: `AT_VOICE_SESSION_${Date.now()}`,
        })),
        errorMessage: 'None',
      };
    }

    throw new Error('[Africa\'s Talking] Voice service not initialized. Missing AT_API_KEY or failed setup in live mode.');
  },
};
