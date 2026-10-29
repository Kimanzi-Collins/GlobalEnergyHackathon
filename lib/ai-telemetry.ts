import { supabaseAdmin } from '@/lib/at-supabase';
import type { ModuleKey, Channel } from '@/lib/types';

export interface LogAiCallParams {
  module: ModuleKey;
  channel: Channel;
  model: string;
  durationMs: number;
  promptTokensEstimate: number;
  completionTokensEstimate: number;
  costUsdEstimate: number;
  studentPhone?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Logs token usage, latency, and estimated cost for each Gemini call.
 * Uses structured JSON console logging and attempts insertion into `ai_calls` table if present.
 */
export async function logAiCall(params: LogAiCallParams): Promise<void> {
  const logPayload = {
    tag: '[AI_TELEMETRY]',
    timestamp: new Date().toISOString(),
    ...params,
  };

  // 1. Structured console log (always available in Vercel/Next logs)
  console.log(JSON.stringify(logPayload));

  // 2. Best-effort persistence to Supabase ai_calls table if configured
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('ai_calls').insert({
        module: params.module,
        channel: params.channel,
        model: params.model,
        duration_ms: params.durationMs,
        prompt_tokens: params.promptTokensEstimate,
        completion_tokens: params.completionTokensEstimate,
        cost_usd: params.costUsdEstimate,
        student_phone: params.studentPhone || null,
        success: params.success,
        error_message: params.errorMessage || null,
      });
    } catch {
      // Non-blocking
    }
  }
}
