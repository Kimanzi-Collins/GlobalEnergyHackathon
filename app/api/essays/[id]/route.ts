import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getEssayWithHistory, getStudentByPhone } from '@/lib/db';
import { normalizeKenyanPhone } from '@/lib/phone';

/**
 * GET /api/essays/[id]
 * Accepts [id] parameter and ?phoneNumber=...
 * Returns essay detail, versions history (essay_versions), and latest review.
 * Enforces per-student privacy (student A cannot read student B's essays).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const essayId = params.id;
    if (!essayId) {
      return apiError('Essay ID is required', 400, 'VALIDATION');
    }

    const { searchParams } = new URL(req.url);
    const rawPhone = searchParams.get('phoneNumber');

    if (!rawPhone) {
      return apiError(
        'Query parameter phoneNumber is required for authorization',
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
      return apiError('Student profile not found', 404, 'NOT_FOUND');
    }

    const detail = await getEssayWithHistory(essayId, student.id);
    if (!detail) {
      return apiError(
        'Essay not found or does not belong to the authenticated student',
        404,
        'NOT_FOUND'
      );
    }

    return apiSuccess(detail);
  } catch (err: any) {
    console.error(`[API:GET /api/essays/${params.id}] Error:`, err);
    return apiError(
      err?.message || 'Failed to retrieve essay details',
      500,
      'UPSTREAM_DB'
    );
  }
}
