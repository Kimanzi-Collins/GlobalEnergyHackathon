import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Supabase Initialization (Safe initialization)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key';

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// 2. Google Gemini Initialization
const geminiApiKey = process.env.GEMINI_API_KEY || '';
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
  console.warn('[Africa\'s Talking] Running in simulated mode:', (err as Error).message);
}

// Fallback Mock Implementations to ensure 100% demo uptime
export const atSMS = {
  send: async (options: { to: string[]; message: string; from?: string }) => {
    if (atSMSClient) {
      return atSMSClient.send({
        to: options.to,
        message: options.message,
        from: options.from || process.env.AT_SENDER_ID || undefined,
      });
    }
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
  },
};

export const atVoice = {
  call: async (options: { callFrom: string; callTo: string[] }) => {
    if (atVoiceClient) {
      return atVoiceClient.call(options);
    }
    console.log('[MOCK AT VOICE OUTBOUND CALL]:', options);
    return {
      entries: options.callTo.map((num) => ({
        phoneNumber: num,
        status: 'Queued',
        sessionId: `AT_VOICE_SESSION_${Date.now()}`,
      })),
      errorMessage: 'None',
    };
  },
};
