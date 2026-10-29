import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getStudentByPhone } from '@/lib/db';
import { normalizeKenyanPhone } from '@/lib/phone';
import type { StudentProfile } from '@/lib/types';

/**
 * GET /api/students/me?phoneNumber=+254712345678
 *
 * Reads a student profile by phone number (passed via query param or Authorization Bearer header).
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    let rawPhone = searchParams.get('phoneNumber') || searchParams.get('phone');

    // Also check Authorization header if phone not in query
    if (!rawPhone) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        rawPhone = authHeader.replace('Bearer ', '').trim();
      }
    }

    if (!rawPhone) {
      return apiError(
        'Missing phoneNumber in query parameters (?phoneNumber=...) or Authorization header',
        400,
        'VALIDATION'
      );
    }

    const normalizedPhone = normalizeKenyanPhone(rawPhone);
    if (!normalizedPhone) {
      return apiError(
        `Invalid Kenyan phone number format: "${rawPhone}"`,
        400,
        'VALIDATION',
        { rawPhone }
      );
    }

    const student = await getStudentByPhone(normalizedPhone);
    if (!student) {
      return apiError(
        `Student profile not found for phone number: ${normalizedPhone}`,
        404,
        'NOT_FOUND'
      );
    }

    return apiSuccess<{ student: StudentProfile }>({ student }, 200);
  } catch (error: any) {
    console.error('[API:GET /api/students/me] Error:', error);
    return apiError(
      error?.message || 'Internal server error while retrieving student profile',
      500,
      error?.code || 'INTERNAL'
    );
  }
}
