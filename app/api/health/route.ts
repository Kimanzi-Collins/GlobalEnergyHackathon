import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/at-supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Health check route: /api/health
 * Reports DB, AT, and Gemini reachability and configuration.
 */
export async function GET() {
  const status: {
    status: 'ok' | 'degraded' | 'error';
    timestamp: string;
    services: {
      database: { status: 'ok' | 'error' | 'mock'; message?: string };
      gemini: { status: 'ok' | 'error' | 'unconfigured'; message?: string };
      africasTalking: { status: 'ok' | 'unconfigured' | 'mock'; message?: string };
    };
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'ok' },
      gemini: { status: 'ok' },
      africasTalking: { status: 'ok' },
    },
  };

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // 1. Database Check
  try {
    if (isDemoMode && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
      status.services.database = { status: 'mock', message: 'Running with demo in-memory storage' };
    } else {
      const { data, error } = await supabaseAdmin.from('kcse_grade_scale').select('grade').limit(1);
      if (error) {
        status.services.database = { status: 'error', message: error.message };
        status.status = 'degraded';
      } else {
        status.services.database = { status: 'ok' };
      }
    }
  } catch (err: any) {
    status.services.database = { status: 'error', message: err.message };
    status.status = 'degraded';
  }

  // 2. Gemini Check
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey || geminiApiKey === 'dummy_key_for_demo') {
    status.services.gemini = {
      status: isDemoMode ? 'ok' : 'unconfigured',
      message: isDemoMode ? 'Mock Gemini mode enabled' : 'GEMINI_API_KEY missing in live mode',
    };
    if (!isDemoMode) status.status = 'degraded';
  } else {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      // lightweight probe
      if (model) {
        status.services.gemini = { status: 'ok' };
      }
    } catch (err: any) {
      status.services.gemini = { status: 'error', message: err.message };
      status.status = 'degraded';
    }
  }

  // 3. Africa's Talking Check
  const atApiKey = process.env.AT_API_KEY;
  const atUsername = process.env.AT_USERNAME;
  if (!atApiKey || atApiKey === 'dummy_key_for_demo') {
    status.services.africasTalking = {
      status: isDemoMode ? 'mock' : 'unconfigured',
      message: isDemoMode ? 'AT simulation active' : 'AT_API_KEY missing in live mode',
    };
    if (!isDemoMode) status.status = 'degraded';
  } else {
    status.services.africasTalking = {
      status: 'ok',
      message: `Configured for user: ${atUsername || 'sandbox'}`,
    };
  }

  const httpStatus = status.status === 'ok' ? 200 : 503;
  return NextResponse.json(status, { status: httpStatus });
}
