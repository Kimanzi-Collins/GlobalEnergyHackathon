import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getGuideWithProgress, getStudentByPhone } from '@/lib/db';
import { normalizeKenyanPhone } from '@/lib/phone';
import type { GuideResponse } from '@/lib/types';

/**
 * GET /api/guide
 * Accepts optional ?phoneNumber=...
 * Returns GuideResponse ({ steps: Array<GuideStep & { status: ProgressStatus }>, completed: number, total: number })
 * Steps are ordered by step_order ascending.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPhone = searchParams.get('phoneNumber');

    let studentId: string | undefined;

    if (rawPhone) {
      const normalizedPhone = normalizeKenyanPhone(rawPhone);
      if (normalizedPhone) {
        const student = await getStudentByPhone(normalizedPhone);
        if (student) {
          studentId = student.id;
        }
      }
    }

    const response: GuideResponse = await getGuideWithProgress(studentId);
    return apiSuccess(response);
  } catch (err: any) {
    console.error('[API:GET /api/guide] Error:', err);
    return apiError(
      err?.message || 'Failed to retrieve application guide',
      500,
      'UPSTREAM_DB'
    );
  }
}
