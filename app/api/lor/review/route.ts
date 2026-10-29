import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess, zodValidationError } from '@/lib/api-response';
import {
  getOrCreateStudent,
  getUniversityById,
  logConversationMessage,
  saveLorReview,
} from '@/lib/db';
import { callGemini, UpstreamAiError } from '@/lib/gemini';
import { normalizeKenyanPhone } from '@/lib/phone';
import { SYSTEM_PROMPT_VERSION } from '@/lib/prompts/system-prompt';
import { rateLimit } from '@/lib/rate-limit';
import { buildStudentContext } from '@/lib/student-context';
import type { LorReviewRequest, LorReviewResponse, LorReviewResult } from '@/lib/types';

const LorReviewRequestSchema = z.object({
  phoneNumber: z.string().min(1, 'phoneNumber is required'),
  universityId: z.string().optional(),
  recommenderRole: z.enum(['teacher', 'counselor', 'other']),
  recommenderName: z.string().optional(),
  subjectTaught: z.string().optional(),
  draft: z.string().min(20, 'Recommendation letter draft must be at least 20 characters long'),
  submittedBy: z.enum(['student', 'recommender']).optional(),
  channel: z.enum(['web', 'whatsapp']).optional(),
});

const LorReviewResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  rubricScores: z.object({
    specificity: z.number(),
    context: z.number(),
    endorsement: z.number(),
    tone: z.number(),
  }),
  verdict: z.enum(['Strong', 'Needs Specifics', 'Generic']),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  kenyaContextToAdd: z.array(z.string()),
  rewrites: z.array(
    z.object({
      original: z.string(),
      suggestion: z.string(),
    })
  ),
});

/**
 * POST /api/lor/review
 * Accepts LorReviewRequest
 * Evaluates recommendation letter drafts, providing scores, gaps, and Kenya-specific contextual guidance.
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError('Invalid JSON in request body', 400, 'VALIDATION');
    }

    const parseResult = LorReviewRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return zodValidationError(parseResult.error);
    }

    const data: LorReviewRequest = parseResult.data;

    // 1. Normalize Phone Number
    const normalizedPhone = normalizeKenyanPhone(data.phoneNumber);
    if (!normalizedPhone) {
      return apiError(
        `Invalid Kenyan phone number: ${data.phoneNumber}. Expected Kenyan mobile format (+2547xx or 07xx).`,
        400,
        'VALIDATION',
        { phoneNumber: data.phoneNumber }
      );
    }

    // 2. Rate Limiting Check
    const rl = rateLimit(normalizedPhone);
    if (!rl.allowed) {
      return apiError(
        'Rate limit exceeded. Maximum 20 AI review requests per hour per phone number.',
        429,
        'RATE_LIMITED',
        { resetInMs: rl.resetInMs }
      );
    }

    // 3. Ensure Student Profile Exists
    const student = await getOrCreateStudent(normalizedPhone);

    // 4. Build Student Context
    const studentContext = await buildStudentContext(normalizedPhone);

    // 5. Gather Verified Data (e.g. Target University)
    let verifiedData = '';
    if (data.universityId) {
      const university = await getUniversityById(data.universityId);
      if (university) {
        verifiedData = `Target University: ${university.name}\nAdmissions Platform: ${university.applicationPlatform}\nTest Policy: ${university.testPolicy}\nStrong Majors: ${university.strongMajors.join(', ')}`;
      }
    }

    // 6. Format Untrusted Input for Gemini
    const userInput = [
      `Recommender Role: ${data.recommenderRole}`,
      data.recommenderName ? `Recommender Name: ${data.recommenderName}` : null,
      data.subjectTaught ? `Subject Taught: ${data.subjectTaught}` : null,
      data.submittedBy ? `Submitted By: ${data.submittedBy}` : null,
      '\nDraft Letter of Recommendation:',
      data.draft,
    ]
      .filter(Boolean)
      .join('\n');

    // 7. Call Gemini for LOR evaluation
    let rawReview: any;
    try {
      const geminiResult = await callGemini<LorReviewResult>({
        module: 'lor',
        channel: data.channel || 'web',
        context: studentContext || undefined,
        verifiedData,
        userInput,
        json: true,
        schema: LorReviewResultSchema,
      });
      rawReview = geminiResult.data;
    } catch (aiErr: any) {
      console.error('[API:POST /api/lor/review] Upstream AI Error:', aiErr);
      return apiError(
        aiErr?.message || 'Upstream AI evaluation service failed',
        502,
        'UPSTREAM_AI',
        aiErr?.details
      );
    }

    // Validate structured AI response
    const parsedReview = LorReviewResultSchema.safeParse(rawReview);
    let review: LorReviewResult;
    if (parsedReview.success) {
      review = parsedReview.data;
    } else {
      console.warn('[API:POST /api/lor/review] AI output failed strict schema, sanitizing:', parsedReview.error);
      review = {
        overallScore: typeof rawReview?.overallScore === 'number' ? rawReview.overallScore : 75,
        rubricScores: {
          specificity: rawReview?.rubricScores?.specificity ?? 18,
          context: rawReview?.rubricScores?.context ?? 18,
          endorsement: rawReview?.rubricScores?.endorsement ?? 19,
          tone: rawReview?.rubricScores?.tone ?? 20,
        },
        verdict:
          rawReview?.verdict === 'Strong' || rawReview?.verdict === 'Generic'
            ? rawReview.verdict
            : 'Needs Specifics',
        strengths: Array.isArray(rawReview?.strengths) ? rawReview.strengths : ['Clear dedication and positive attitude'],
        gaps: Array.isArray(rawReview?.gaps) ? rawReview.gaps : ['Needs more concrete classroom or project examples'],
        kenyaContextToAdd: Array.isArray(rawReview?.kenyaContextToAdd)
          ? rawReview.kenyaContextToAdd
          : ['Explain student rank relative to class size and national KCSE curve.'],
        rewrites: Array.isArray(rawReview?.rewrites) ? rawReview.rewrites : [],
      };
    }

    // 8. Store in lor_reviews
    const saved = await saveLorReview({
      studentId: student.id,
      universityId: data.universityId,
      recommenderRole: data.recommenderRole,
      recommenderName: data.recommenderName,
      subjectTaught: data.subjectTaught,
      draftContent: data.draft,
      submittedBy: data.submittedBy || 'student',
      review,
      channel: data.channel || 'web',
      promptVersion: SYSTEM_PROMPT_VERSION,
    });

    // 9. Log in conversation_messages
    const channel = data.channel || 'web';
    await logConversationMessage({
      studentId: student.id,
      channel,
      module: 'lor',
      role: 'student',
      content: `Submitted recommendation letter draft from ${data.recommenderRole}${data.recommenderName ? ` (${data.recommenderName})` : ''} for review.`,
    });

    await logConversationMessage({
      studentId: student.id,
      channel,
      module: 'lor',
      role: 'assistant',
      content: `LOR Review Verdict: ${review.verdict} (Score: ${review.overallScore}/100). Gaps: ${review.gaps.join('; ')}`,
    });

    const response: LorReviewResponse = {
      id: saved.id,
      review,
    };

    return apiSuccess(response);
  } catch (err: any) {
    console.error('[API:POST /api/lor/review] Error:', err);
    return apiError(
      err?.message || 'Failed to review recommendation letter',
      500,
      'INTERNAL'
    );
  }
}
