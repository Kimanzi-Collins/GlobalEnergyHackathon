import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess, zodValidationError } from '@/lib/api-response';
import {
  getOrCreateStudent,
  logConversationMessage,
} from '@/lib/db';
import { callGemini } from '@/lib/gemini';
import { normalizeKenyanPhone } from '@/lib/phone';
import { rateLimit } from '@/lib/rate-limit';
import { buildStudentContext } from '@/lib/student-context';
import type { ChatRequest, ChatResponse, ModuleKey } from '@/lib/types';

const ChatRequestSchema = z.object({
  phoneNumber: z.string().min(1, 'phoneNumber is required'),
  message: z.string().min(1, 'message cannot be empty'),
  channel: z.enum(['whatsapp', 'web']),
  module: z
    .enum(['guide', 'gpa', 'aid', 'essay', 'lor', 'advisor', 'context', 'cue', 'interview'])
    .optional(),
});

/**
 * Classifies student intent into one of the nine Pepea modules.
 */
function classifyIntent(message: string): ModuleKey {
  const m = message.toLowerCase();

  // 1. CUE & Scam Detection
  if (
    m.includes('scam') ||
    m.includes('agency') ||
    m.includes('agent') ||
    m.includes('blacklist') ||
    m.includes('cue') ||
    m.includes('legit') ||
    m.includes('fraud') ||
    m.includes('fake')
  ) {
    return 'cue';
  }

  // 2. GPA & KCSE Conversion
  if (
    m.includes('gpa') ||
    m.includes('convert') ||
    m.includes('kcse grade') ||
    m.includes('points') ||
    m.includes('84 points') ||
    m.includes('mean grade')
  ) {
    return 'gpa';
  }

  // 3. Financial Aid & Scholarships
  if (
    m.includes('aid') ||
    m.includes('scholarship') ||
    m.includes('tuition') ||
    m.includes('fee waiver') ||
    m.includes('cost') ||
    m.includes('afford') ||
    m.includes('css profile') ||
    m.includes('full ride')
  ) {
    return 'aid';
  }

  // 4. Recommendation Letters
  if (
    m.includes('recommendation') ||
    m.includes('lor') ||
    m.includes('teacher letter') ||
    m.includes('counselor letter') ||
    m.includes('recommender')
  ) {
    return 'lor';
  }

  // 5. Essays
  if (
    m.includes('essay') ||
    m.includes('personal statement') ||
    m.includes('supplemental') ||
    m.includes('common app prompt') ||
    m.includes('draft') ||
    m.includes('rewrite')
  ) {
    return 'essay';
  }

  // 6. Mock Interview
  if (
    m.includes('interview') ||
    m.includes('voice call') ||
    m.includes('mock interview') ||
    m.includes('practice answer')
  ) {
    return 'interview';
  }

  // 7. University Advisory & Matching
  if (
    m.includes('university') ||
    m.includes('universities') ||
    m.includes('college') ||
    m.includes('colleges') ||
    m.includes('reach') ||
    m.includes('target') ||
    m.includes('likely') ||
    m.includes('harvard') ||
    m.includes('mit') ||
    m.includes('stanford') ||
    m.includes('school list')
  ) {
    return 'advisor';
  }

  // 8. Application Guide & Process
  if (
    m.includes('how to apply') ||
    m.includes('guide') ||
    m.includes('step') ||
    m.includes('deadline') ||
    m.includes('timeline') ||
    m.includes('visa') ||
    m.includes('common app') ||
    m.includes('checklist')
  ) {
    return 'guide';
  }

  // Default to student context building
  return 'context';
}

function getQuickReplies(module: ModuleKey): string[] {
  switch (module) {
    case 'gpa':
      return ['Application Steps', 'Find Aid', 'College Matches'];
    case 'aid':
      return ['Fee Waivers', 'CSS Profile', 'Top Colleges'];
    case 'essay':
      return ['Review Essay', 'School Prompts', 'Application Steps'];
    case 'lor':
      return ['Review Letter', 'What to Tell Teacher', 'Application Steps'];
    case 'advisor':
      return ['Check Aid', 'Review Essays', 'Next Deadline'];
    case 'cue':
      return ['Verify Agency', 'Free Resources', 'Common App Steps'];
    case 'interview':
      return ['Practice Voice', 'Advisory', 'Application Steps'];
    case 'guide':
    case 'context':
    default:
      return ['Convert KCSE to GPA', 'College Matches', 'Find Aid'];
  }
}

/**
 * POST /api/chat
 * Multi-channel router endpoint for Web Assistant and Africa's Talking WhatsApp webhook.
 * Classifies module intent, loads student context, prompts Gemini 2.5 Flash,
 * and maintains durable conversation history.
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError('Invalid JSON in request body', 400, 'VALIDATION');
    }

    const parseResult = ChatRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return zodValidationError(parseResult.error);
    }

    const { phoneNumber: rawPhone, message, channel, module: explicitModule } = parseResult.data;

    // 1. Normalize Phone Number
    const normalizedPhone = normalizeKenyanPhone(rawPhone);
    if (!normalizedPhone) {
      return apiError(
        `Invalid Kenyan phone number: ${rawPhone}. Expected Kenyan mobile format (+2547xx or 07xx).`,
        400,
        'VALIDATION',
        { phoneNumber: rawPhone }
      );
    }

    // 2. Check Rate Limit (AI limit: 20 calls/hr)
    const rl = rateLimit(normalizedPhone);
    if (!rl.allowed) {
      return apiError(
        'Rate limit reached. Please wait a short while before sending another message.',
        429,
        'RATE_LIMITED',
        { resetInMs: rl.resetInMs }
      );
    }

    // 3. Ensure Student Profile & Context
    const student = await getOrCreateStudent(normalizedPhone);
    const studentContext = await buildStudentContext(normalizedPhone);

    // 4. Determine Active Module
    const activeModule: ModuleKey = explicitModule || classifyIntent(message);

    // 5. Call Gemini 2.5 Flash
    let reply: string;
    try {
      const aiResult = await callGemini({
        module: activeModule,
        channel,
        context: studentContext || undefined,
        userInput: message,
        json: false,
      });

      reply = aiResult?.text || 'Karibu Pepea! How can I assist your US application journey today?';
    } catch (aiErr: any) {
      console.error('[API:POST /api/chat] Upstream AI Error:', aiErr);
      return apiError(
        aiErr?.message || 'Chat assistant temporarily unavailable',
        502,
        'UPSTREAM_AI',
        aiErr?.details
      );
    }

    // WhatsApp formatting ergonomics (max ~900 chars per AGENTS.md rule 42)
    if (channel === 'whatsapp' && reply.length > 950) {
      reply = reply.slice(0, 940) + '...\n\n_Reply to continue._';
    }

    // 6. Log Conversation History
    await logConversationMessage({
      studentId: student.id,
      channel,
      module: activeModule,
      role: 'student',
      content: message,
    });

    await logConversationMessage({
      studentId: student.id,
      channel,
      module: activeModule,
      role: 'assistant',
      content: reply,
    });

    // 7. Generate Quick Replies
    const quickReplies = getQuickReplies(activeModule);

    const response: ChatResponse = {
      reply,
      module: activeModule,
      quickReplies,
    };

    return apiSuccess(response);
  } catch (err: any) {
    console.error('[API:POST /api/chat] Error:', err);
    return apiError(
      err?.message || 'Internal chat processing error',
      500,
      'INTERNAL'
    );
  }
}
