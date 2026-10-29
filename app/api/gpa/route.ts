import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess, zodValidationError } from '@/lib/api-response';
import {
  getAllGradeBands,
  getGradeBand,
  getGradeBandByPoints,
  getStudentByPhone,
  insertGpaConversion,
  updateStudentGpa,
} from '@/lib/db';
import { normalizeKenyanPhone } from '@/lib/phone';
import type { Channel, GpaConvertRequest, GpaConvertResponse, KcseGradeBand } from '@/lib/types';

const GRADE_POINTS_MAP: Record<string, number> = {
  A: 12,
  'A-': 11,
  'B+': 10,
  B: 9,
  'B-': 8,
  'C+': 7,
  C: 6,
  'C-': 5,
  'D+': 4,
  D: 3,
  'D-': 2,
  E: 1,
};

const GpaConvertSchema = z
  .object({
    phoneNumber: z.string().optional(),
    meanGrade: z.string().optional(),
    points: z.number().int().min(7, 'Points must be at least 7').max(84, 'Points cannot exceed 84').optional(),
    subjects: z.record(z.string(), z.string()).optional(),
    channel: z.enum(['ussd', 'sms', 'whatsapp', 'web']).optional(),
  })
  .refine(
    (data) => Boolean(data.meanGrade || data.points !== undefined || (data.subjects && Object.keys(data.subjects).length > 0)),
    {
      message: 'At least one of meanGrade, points (7-84), or subjects must be provided.',
      path: ['meanGrade'],
    }
  );

/**
 * GET /api/gpa
 *
 * Returns the full KCSE to US GPA conversion scale and explanatory metadata.
 */
export async function GET() {
  try {
    const scale = await getAllGradeBands();

    return apiSuccess({
      scale,
      scaleMetadata: {
        system: 'KCSE',
        country: 'Kenya',
        maxAggregatePoints: 84,
        minAggregatePoints: 7,
        scale: 4.0 as const,
        indicative: true as const,
        method: 'pepea_heuristic_v1',
        description:
          'Indicative conversion scale translating Kenyan KCSE national examination performance to a standard US 4.0 unweighted GPA scale.',
      },
    });
  } catch (error: any) {
    console.error('[API:GET /api/gpa] Error:', error);
    return apiError(
      error?.message || 'Failed to retrieve KCSE grade conversion scale',
      500,
      'INTERNAL'
    );
  }
}

/**
 * POST /api/gpa
 *
 * Converts KCSE performance (mean grade, aggregate points, or subject grades)
 * to an indicative US 4.0 unweighted GPA.
 */
export async function POST(req: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return apiError('Invalid JSON payload in request body', 400, 'VALIDATION');
    }

    const parseResult = GpaConvertSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return zodValidationError(parseResult.error);
    }

    const { phoneNumber, meanGrade, points, subjects, channel = 'web' } = parseResult.data;

    let matchedBand: KcseGradeBand | null = null;
    let method = 'pepea_heuristic_v1';
    let computedPoints: number | undefined = points;

    // 1. If points is provided directly (7-84)
    if (typeof points === 'number') {
      matchedBand = await getGradeBandByPoints(points);
      method = 'kcse_aggregate_points_lookup';
    }
    // 2. Else if subjects map is provided, calculate average points and map to 7-subject scale
    else if (subjects && Object.keys(subjects).length > 0) {
      const subjectEntries = Object.entries(subjects);
      let totalSubjectPoints = 0;
      let validSubjectCount = 0;

      for (const [, gradeVal] of subjectEntries) {
        const norm = String(gradeVal).trim().toUpperCase();
        if (norm in GRADE_POINTS_MAP) {
          totalSubjectPoints += GRADE_POINTS_MAP[norm];
          validSubjectCount++;
        }
      }

      if (validSubjectCount === 0) {
        return apiError(
          'None of the provided subjects had a valid KCSE grade (A, A-, B+, B, B-, C+, C, C-, D+, D, D-, E)',
          400,
          'VALIDATION',
          { subjects }
        );
      }

      const avgPoints = totalSubjectPoints / validSubjectCount;
      computedPoints = Math.max(7, Math.min(84, Math.round(avgPoints * 7)));
      matchedBand = await getGradeBandByPoints(computedPoints);
      method = 'kcse_subject_average_calculation';
    }
    // 3. Else if meanGrade is provided
    else if (meanGrade) {
      matchedBand = await getGradeBand(meanGrade);
      method = 'kcse_mean_grade_lookup';
    }

    if (!matchedBand) {
      return apiError(
        'Could not map the provided KCSE grade or points to a recognized grade band',
        400,
        'VALIDATION',
        { meanGrade, points, subjects }
      );
    }

    const explanation =
      `The Kenya Certificate of Secondary Education (KCSE) is a rigorous national examination taken at the end of Form 4. ` +
      `A mean grade of ${matchedBand.grade} (${matchedBand.aggregateMin}–${matchedBand.aggregateMax} points) represents strong academic achievement ` +
      `within Kenya's competitive national curriculum. On an unweighted 4.0 US scale, this translates indicatively to a ${matchedBand.gpa40.toFixed(2)} GPA. ` +
      `Note: This is an indicative institutional heuristic for college matching, not an official credential evaluation.`;

    // Lookup student if phone number is provided
    let studentId: string | undefined = undefined;
    if (phoneNumber) {
      const normalizedPhone = normalizeKenyanPhone(phoneNumber);
      if (normalizedPhone) {
        const student = await getStudentByPhone(normalizedPhone);
        if (student) {
          studentId = student.id;
          await updateStudentGpa(normalizedPhone, matchedBand.grade, matchedBand.gpa40);
        }
      }
    }

    // Persist conversion in gpa_conversions
    await insertGpaConversion({
      studentId,
      input: {
        meanGrade,
        points: computedPoints,
        subjects,
      },
      gpaUnweighted: matchedBand.gpa40,
      gpaScale: 4.0,
      method,
      explanation,
      channel: channel as Channel,
    });

    const responsePayload: GpaConvertResponse = {
      gpaUnweighted: matchedBand.gpa40,
      scale: 4.0,
      meanGrade: matchedBand.grade,
      method,
      explanation,
      indicative: true,
    };

    return apiSuccess(responsePayload, 200);
  } catch (error: any) {
    console.error('[API:POST /api/gpa] Error:', error);
    return apiError(
      error?.message || 'Internal error during GPA conversion',
      500,
      error?.code || 'INTERNAL'
    );
  }
}
