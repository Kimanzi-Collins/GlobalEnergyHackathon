import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess, zodValidationError } from '@/lib/api-response';
import {
  createEssay,
  getEssayById,
  getEssayByStudentAndType,
  getEssayType,
  getSchoolPrompt,
  getStudentByPhone,
  insertEssayReview,
  insertEssayVersion,
  logConversationMessage,
  updateEssay,
  upsertStudent,
} from '@/lib/db';
import { callGemini } from '@/lib/gemini';
import { normalizeKenyanPhone } from '@/lib/phone';
import { SYSTEM_PROMPT_VERSION } from '@/lib/prompts/system-prompt';
import { buildStudentContext } from '@/lib/student-context';
import type {
  AoPersona,
  Channel,
  EssayReviewRequest,
  EssayReviewResponse,
  EssayReviewResult,
  EssayTypeCode,
} from '@/lib/types';

const EssayReviewRequestSchema = z.object({
  phoneNumber: z.string().min(1, 'phoneNumber cannot be empty'),
  essayType: z.enum([
    'personal_statement',
    'why_us',
    'why_major',
    'community',
    'short_answer',
    'activities',
    'additional_info',
    'scholarship_essay',
    'financial_circumstances',
  ] as const),
  schoolPromptId: z.string().optional(),
  essayId: z.string().optional(),
  draft: z.string().min(1, 'draft is required'),
  persona: z.enum(['ivy_committee_chair', 'kensap_mentor'] as const).optional(),
  channel: z.enum(['web', 'whatsapp', 'sms']).optional(),
});

const EssayReviewResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  rubricScores: z.record(z.string(), z.number()),
  verdict: z.enum(['Strong Admit', 'Borderline / Too Generic', 'Rewrite Required']),
  committeeSummary: z.string(),
  clichesDetected: z.array(z.string()),
  lineEdits: z.array(
    z.object({
      original: z.string(),
      issue: z.string(),
      suggestion: z.string(),
    })
  ),
  kenyanContextTips: z.string(),
  rewriteExample: z.string(),
});

/**
 * POST /api/essays/review
 *
 * Evaluates an essay draft using Google Gemini 2.5 Flash Admissions Officer persona.
 * Persists versions in `essays`, `essay_versions`, and evaluation in `essay_reviews`.
 * Enforces word limits and type-specific rubrics.
 */
export async function POST(req: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return apiError('Invalid JSON payload in request body', 400, 'VALIDATION');
    }

    const parseResult = EssayReviewRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return zodValidationError(parseResult.error);
    }

    const {
      phoneNumber,
      essayType,
      schoolPromptId,
      essayId,
      draft,
      persona = 'ivy_committee_chair',
      channel = 'web',
    } = parseResult.data;

    // 1. Normalize phone number
    const normalizedPhone = normalizeKenyanPhone(phoneNumber);
    if (!normalizedPhone) {
      return apiError(
        `Invalid Kenyan phone number: "${phoneNumber}". Must be a valid Kenyan mobile number.`,
        400,
        'VALIDATION',
        { phoneNumber }
      );
    }

    // 2. Fetch essay type metadata and check school-specific requirement
    const essayTypeMeta = await getEssayType(essayType as EssayTypeCode);
    if (!essayTypeMeta) {
      return apiError(`Unrecognized essay type: ${essayType}`, 400, 'VALIDATION');
    }

    if (essayTypeMeta.scope === 'school_specific' && !schoolPromptId) {
      return apiError(
        `schoolPromptId is required for school-specific essay type '${essayType}'. Please select a target school prompt.`,
        400,
        'VALIDATION',
        { essayType, scope: essayTypeMeta.scope }
      );
    }

    // 3. Validate draft length
    const words = draft.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (wordCount < 15) {
      return apiError(
        `Essay draft is too short (${wordCount} words). Please provide a draft of at least 15 words.`,
        400,
        'VALIDATION',
        { wordCount, minRequired: 15 }
      );
    }

    // 4. Fetch school prompt if provided
    let schoolPrompt: any = null;
    if (schoolPromptId) {
      schoolPrompt = await getSchoolPrompt(schoolPromptId);
      if (!schoolPrompt) {
        return apiError(
          `School essay prompt with id '${schoolPromptId}' was not found`,
          404,
          'NOT_FOUND',
          { schoolPromptId }
        );
      }
    }

    const wordLimit = schoolPrompt?.wordLimit || essayTypeMeta.defaultWordLimit;

    // 5. Ensure student exists or register initial profile
    let student = await getStudentByPhone(normalizedPhone);
    if (!student) {
      const created = await upsertStudent({
        phoneNumber: normalizedPhone,
        fullName: 'Student',
        preferredChannel: channel,
      });
      student = created.student;
    }

    // 6. Resolve or create Essay row
    let targetEssay = essayId ? await getEssayById(essayId) : null;
    if (!targetEssay) {
      targetEssay = await getEssayByStudentAndType(
        student.id,
        essayType as EssayTypeCode,
        schoolPromptId
      );
    }

    if (!targetEssay) {
      targetEssay = await createEssay({
        studentId: student.id,
        essayType: essayType as EssayTypeCode,
        schoolPromptId: schoolPrompt?.id,
        universityId: schoolPrompt?.universityId,
        title: schoolPrompt?.title || essayTypeMeta.label,
        status: 'drafting',
      });
    }

    // 7. Insert new version
    const nextVersionNo = (targetEssay.latestVersionNo || 0) + 1;
    const versionRecord = await insertEssayVersion({
      essayId: targetEssay.id,
      versionNo: nextVersionNo,
      content: draft,
      wordCount,
      channel: channel as Channel,
    });

    // 8. Build student context & verified data for Gemini
    const studentContext = await buildStudentContext(normalizedPhone);

    const verifiedDataParts = [
      `Essay Type: ${essayTypeMeta.label} (${essayTypeMeta.code})`,
      `Rubric: ${JSON.stringify(essayTypeMeta.rubric)}`,
      `Word Limit: ${wordLimit ? `${wordLimit} words` : 'None specified'}`,
    ];

    if (schoolPrompt) {
      verifiedDataParts.push(
        `Target University: ${schoolPrompt.universityName || 'Selected University'}`,
        `Prompt Title: ${schoolPrompt.title}`,
        `Prompt Question: "${schoolPrompt.promptText}"`
      );
    }

    verifiedDataParts.push(
      `AO Review Persona: ${persona === 'kensap_mentor' ? 'KenSAP Alumni Mentor' : 'Ivy League Admissions Committee Chair'}`
    );

    const verifiedData = verifiedDataParts.join('\n');

    // Untrusted user input wrapping to protect against prompt injection (BE-AI-03)
    const userInput = [
      `Please evaluate the following draft for ${schoolPrompt?.title || essayTypeMeta.label}.`,
      `Current Word Count: ${wordCount} words (Word limit: ${wordLimit || 'unlimited'}).`,
      '',
      '=== BEGIN UNTRUSTED STUDENT ESSAY DRAFT ===',
      draft,
      '=== END UNTRUSTED STUDENT ESSAY DRAFT ===',
    ].join('\n');

    // 9. Call Gemini with module: 'essay', json: true
    let geminiResult;
    try {
      geminiResult = await callGemini<EssayReviewResult>({
        module: 'essay',
        channel: channel as Channel,
        context: studentContext || undefined,
        verifiedData,
        userInput,
        json: true,
        schema: EssayReviewResultSchema,
      });
    } catch (aiErr: any) {
      console.error('[API:POST /api/essays/review] Gemini failure:', aiErr);
      return apiError(
        `AI Evaluation failed: ${aiErr?.message || 'Upstream service unavailable'}`,
        502,
        'UPSTREAM_AI',
        aiErr?.details
      );
    }

    const review: EssayReviewResult = geminiResult.data!;

    // 10. Persist review to essay_reviews
    await insertEssayReview({
      essayId: targetEssay.id,
      essayVersionId: versionRecord.id,
      studentId: student.id,
      essayType: essayType as EssayTypeCode,
      schoolPromptId: schoolPrompt?.id,
      universityName: schoolPrompt?.universityName,
      promptText: schoolPrompt?.promptText || essayTypeMeta.label,
      promptVersion: SYSTEM_PROMPT_VERSION,
      aoPersona: persona,
      draftContent: draft,
      overallScore: review.overallScore,
      specificityScore: review.rubricScores?.specificity,
      voiceScore: review.rubricScores?.voice,
      schoolFitScore: review.rubricScores?.fit || review.rubricScores?.school_fit,
      aoVerdict: review.verdict,
      committeeSummary: review.committeeSummary,
      lineByLineCritique: review,
      kenyanContextTips: review.kenyanContextTips,
      rewriteExample: review.rewriteExample,
      channel: channel as Channel,
    });

    // 11. Update essay's latest version and score
    await updateEssay(targetEssay.id, {
      latestVersionNo: nextVersionNo,
      latestScore: review.overallScore,
      status: 'in_review',
    });

    // 12. Log to conversation_messages
    await logConversationMessage({
      studentId: student.id,
      channel: channel as Channel,
      module: 'essay',
      role: 'student',
      content: `Submitted draft for ${schoolPrompt?.title || essayTypeMeta.label} (${wordCount} words)`,
    });

    await logConversationMessage({
      studentId: student.id,
      channel: channel as Channel,
      module: 'essay',
      role: 'assistant',
      content: `PEPEA AO REVIEW [${review.verdict}]: Score ${review.overallScore}/100. ${review.committeeSummary}`,
    });

    // 13. Return typed response
    const responsePayload: EssayReviewResponse = {
      essayId: targetEssay.id,
      versionNo: nextVersionNo,
      wordCount,
      wordLimit,
      review,
    };

    return apiSuccess(responsePayload, 200);
  } catch (error: any) {
    console.error('[API:POST /api/essays/review] Error:', error);
    return apiError(
      error?.message || 'Internal server error while evaluating essay',
      500,
      error?.code || 'INTERNAL'
    );
  }
}
