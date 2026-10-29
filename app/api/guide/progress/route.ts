import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess, zodValidationError } from '@/lib/api-response';
import { getOrCreateStudent, updateGuideProgress } from '@/lib/db';
import { normalizeKenyanPhone } from '@/lib/phone';

const GuideProgressSchema = z.object({
  phoneNumber: z.string().min(1, 'phoneNumber is required'),
  stepId: z.string().min(1, 'stepId is required'),
  status: z.enum(['todo', 'in_progress', 'done', 'skipped']),
});

/**
 * POST /api/guide/progress
 * Accepts GuideProgressRequest ({ phoneNumber, stepId, status })
 * Idempotently updates or inserts student guide progress into student_guide_progress.
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError('Invalid JSON in request body', 400, 'VALIDATION');
    }

    const parseResult = GuideProgressSchema.safeParse(body);
    if (!parseResult.success) {
      return zodValidationError(parseResult.error);
    }

    const { phoneNumber: rawPhone, stepId, status } = parseResult.data;

    const normalizedPhone = normalizeKenyanPhone(rawPhone);
    if (!normalizedPhone) {
      return apiError(
        `Invalid Kenyan phone number: ${rawPhone}. Expected Kenyan mobile format (+2547xx or 07xx).`,
        400,
        'VALIDATION',
        { phoneNumber: rawPhone }
      );
    }

    // Get or create student
    const student = await getOrCreateStudent(normalizedPhone);

    // Update progress idempotently
    await updateGuideProgress(student.id, stepId, status);

    return apiSuccess({
      success: true,
      stepId,
      status,
      studentId: student.id,
    });
  } catch (err: any) {
    console.error('[API:POST /api/guide/progress] Error:', err);
    return apiError(
      err?.message || 'Failed to update guide progress',
      500,
      'UPSTREAM_DB'
    );
  }
}
