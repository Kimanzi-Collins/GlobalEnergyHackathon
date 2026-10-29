import { geminiAI } from '@/lib/at-supabase';
import { buildSystemPrompt } from '@/lib/prompts/system-prompt';
import type { Channel, ModuleKey, StudentContext } from '@/lib/types';
import type { z } from 'zod';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export class UpstreamAiError extends Error {
  code = 'UPSTREAM_AI' as const;
  details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'UpstreamAiError';
    this.details = details;
  }
}

export interface CallGeminiOptions<T = any> {
  module: ModuleKey;
  channel: Channel;
  context?: StudentContext;
  verifiedData?: string;
  userInput: string;
  json?: boolean;
  schema?: z.ZodSchema<T>;
}

export interface CallGeminiResult<T = any> {
  text: string;
  data?: T;
}

/**
 * Executes a call to Google Gemini 2.5 Flash with timeout, retry,
 * and JSON parsing with schema validation.
 */
export async function callGemini<T = any>(
  options: CallGeminiOptions<T>
): Promise<CallGeminiResult<T>> {
  const { module, channel, context, verifiedData, userInput, json = false, schema } = options;

  // Build the system prompt
  const systemInstruction = buildSystemPrompt({
    module,
    channel,
    context,
    verifiedData,
  });

  const apiKey = process.env.GEMINI_API_KEY || '';
  const isPlaceholderKey =
    !apiKey ||
    apiKey === 'your_gemini_api_key_here' ||
    apiKey === 'dummy_key_for_demo' ||
    apiKey.startsWith('your_');

  // If Gemini client is not initialized or key is placeholder
  if (!geminiAI || isPlaceholderKey) {
    if (isDemoMode) {
      return getDemoFallback<T>(module, userInput, json);
    }
    const err = new Error('Gemini client not initialized: missing valid GEMINI_API_KEY');
    (err as any).code = 'UPSTREAM_AI';
    throw err;
  }

  const model = geminiAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction,
    generationConfig: json ? { responseMimeType: 'application/json' } : undefined,
  });

  // Helper to execute single generation with 8s timeout
  async function attemptCall(): Promise<string> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error('Gemini API call timed out after 8000ms'));
      }, 8000);
    });

    try {
      const response = await Promise.race([
        model.generateContent(userInput),
        timeoutPromise,
      ]);
      clearTimeout(timer!);
      return response.response.text();
    } catch (err) {
      clearTimeout(timer!);
      throw err;
    }
  }

  let textResponse: string | null = null;
  let lastError: any = null;

  // Try call with 1 retry (2 attempts total)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      textResponse = await attemptCall();
      break;
    } catch (err) {
      lastError = err;
      if (attempt === 1) {
        console.warn(`[Gemini] Attempt 1 failed (${(err as Error).message}), retrying...`);
        // Brief pause before retry
        await new Promise((res) => setTimeout(res, 300));
      }
    }
  }

  // Handle failure
  if (!textResponse) {
    if (isDemoMode) {
      console.warn('[Gemini] Live call failed in demo mode, returning fallback:', lastError?.message);
      return getDemoFallback<T>(module, userInput, json);
    }
    const err = new Error(`Gemini service error: ${lastError?.message || 'Unknown upstream failure'}`);
    (err as any).code = 'UPSTREAM_AI';
    (err as any).details = { originalError: lastError?.message };
    throw err;
  }

  // If not JSON, return text
  if (!json) {
    return { text: textResponse };
  }

  // Parse JSON
  let parsed: any;
  try {
    // Strip markdown code fences if model enclosed JSON
    let cleaned = textResponse.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    if (isDemoMode) {
      return getDemoFallback<T>(module, userInput, json);
    }
    const err = new Error(`Gemini returned invalid JSON: ${(parseErr as Error).message}`);
    (err as any).code = 'UPSTREAM_AI';
    (err as any).details = { rawResponse: textResponse };
    throw err;
  }

  // Schema validation
  if (schema) {
    const valResult = schema.safeParse(parsed);
    if (!valResult.success) {
      if (isDemoMode) {
        return getDemoFallback<T>(module, userInput, json);
      }
      const err = new Error('Gemini response did not match expected schema');
      (err as any).code = 'UPSTREAM_AI';
      (err as any).details = { validationIssues: valResult.error.issues, parsed };
      throw err;
    }
    return { text: textResponse, data: valResult.data };
  }

  return { text: textResponse, data: parsed as T };
}

/**
 * Deterministic fallback for presentation demo mode only.
 */
function getDemoFallback<T>(module: ModuleKey, userInput: string, json: boolean): CallGeminiResult<T> {
  if (module === 'essay' && json) {
    const lower = userInput.toLowerCase();
    const cliches: string[] = [];
    if (lower.includes('since childhood') || lower.includes('since my childhood')) {
      cliches.push('Since childhood');
    }
    if (lower.includes('prestigious') || lower.includes('most prestigious')) {
      cliches.push('Prestigious university');
    }
    if (lower.includes('wipe away tears') || lower.includes('poverty')) {
      cliches.push('Poverty plea cliché');
    }
    if (lower.includes('golden opportunity')) {
      cliches.push('Golden opportunity');
    }
    if (lower.includes('school captain') || lower.includes('headboy')) {
      cliches.push('Listing resume titles without reflection');
    }

    const words = userInput.split(/\s+/).filter(Boolean).length;
    const isShort = words < 80;
    const overallScore = Math.max(45, Math.min(88, 75 - cliches.length * 8 + (isShort ? -5 : 6)));

    const verdict: 'Strong Admit' | 'Borderline / Too Generic' | 'Rewrite Required' =
      overallScore >= 78 ? 'Strong Admit' : overallScore >= 60 ? 'Borderline / Too Generic' : 'Rewrite Required';

    const fallbackEssayReview = {
      overallScore,
      rubricScores: {
        specificity: overallScore > 70 ? 20 : 13,
        voice: overallScore > 70 ? 19 : 12,
        reflection: overallScore > 70 ? 19 : 13,
        clarity_for_us_reader: 18,
      },
      verdict,
      committeeSummary:
        cliches.length > 0
          ? `The applicant shows clear intellectual grit, but falls into the Kenyan 'Insha' composition trap with ${cliches.length} generic tropes. Needs vivid micro-moments instead of platitudes.`
          : 'Clear potential and authentic voice, but lacks specific faculty, lab, or course connections.',
      clichesDetected: cliches.length > 0 ? cliches : ['Generic ambition without grounding'],
      lineEdits: [
        {
          original: 'I have always dreamed of joining this prestigious institution.',
          issue: 'Flattery without concrete academic justification.',
          suggestion: 'Identify the exact course or professor whose research directly matches your project.',
        },
      ],
      kenyanContextTips:
        'Admissions committees love KCSE grit, but an American reader does not know what "School Captain" or "82 points" means. Ground your leadership in a specific conflict you resolved.',
      rewriteExample:
        'Instead of "Since childhood I loved science": "At 2:00 AM in our Machakos boarding dorm, when the KPLC blackout hit during mock exam week, I wired a spare 12V motorcycle battery to four LED diodes so my study group could finish their Calculus sets."',
    };

    return {
      text: JSON.stringify(fallbackEssayReview),
      data: fallbackEssayReview as unknown as T,
    };
  }

  if (module === 'lor' && json) {
    const fallbackLorReview = {
      overallScore: 82,
      rubricScores: { specificity: 20, context: 21, endorsement: 21, tone: 20 },
      verdict: 'Strong',
      strengths: [
        'Clear ranking of the student relative to their high school class',
        'Specific academic project example illustrating intellectual stamina',
      ],
      gaps: [
        'Needs context on the KCSE grading curve for an American reader unfamiliar with Kenyan national exams',
      ],
      kenyaContextToAdd: [
        'State that an A- or A in KCSE places the applicant in the top 1% nationally in Kenya.',
      ],
      rewrites: [
        {
          original: 'He is a very hardworking and disciplined student in my class.',
          suggestion:
            'When our school laboratory lacked reagents for titration experiments, he organized peer study sets that improved the class average by two full grade bands.',
        },
      ],
    };

    return {
      text: JSON.stringify(fallbackLorReview),
      data: fallbackLorReview as unknown as T,
    };
  }

  if (module === 'advisor') {
    return {
      text: 'Based on your academic profile and full-aid requirements, we have prioritized schools that meet 100% of demonstrated need for international students. Your reach, target, and likely matches reflect the competitive holistic admissions landscape for East African candidates.',
      data: undefined,
    };
  }

  if (module === 'aid') {
    return {
      text: 'For Kenyan students needing full financial support, institutional need-based grants and Common App fee waivers offer the most viable path. Prioritize submitting the CSS Profile before priority deadlines.',
      data: undefined,
    };
  }

  return {
    text: 'Pepea is ready to assist you on your US university journey. You can convert your KCSE grade to a US GPA, explore college matches, or get your essays reviewed.',
    data: undefined,
  };
}
