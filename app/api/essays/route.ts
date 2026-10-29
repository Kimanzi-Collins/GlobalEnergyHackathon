import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getStudentByPhone, getStudentEssays } from '@/lib/db';
import { normalizeKenyanPhone } from '@/lib/phone';
import type { Essay } from '@/lib/types';

/**
 * GET /api/essays
 * Accepts ?phoneNumber=...
 * Returns list of student's essays (Essay[]) with latest version number and score.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPhone = searchParams.get('phoneNumber');

    if (!rawPhone) {
      return apiError(
        'Query parameter phoneNumber is required',
        400,
        'VALIDATION',
        { parameter: 'phoneNumber' }
      );
    }

    const normalizedPhone = normalizeKenyanPhone(rawPhone);
    if (!normalizedPhone) {
      return apiError(
        `Invalid Kenyan phone number: ${rawPhone}. Expected Kenyan mobile format (+2547xx or 07xx).`,
        400,
        'VALIDATION',
        { phoneNumber: rawPhone }
      );
    }

    const student = await getStudentByPhone(normalizedPhone);
    if (!student) {
      // If student not yet registered, return empty list
      return apiSuccess<Essay[]>([]);
    }

    const essays: Essay[] = await getStudentEssays(student.id);

    return apiSuccess<Essay[]>(essays);
  } catch (err: any) {
    console.error('[API:GET /api/essays] Error:', err);
    return apiError(
      err?.message || 'Failed to retrieve student essays',
      500,
      'UPSTREAM_DB'
    );
  }
}
