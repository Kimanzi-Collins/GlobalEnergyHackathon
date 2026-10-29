import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess, zodValidationError } from '@/lib/api-response';
import { upsertStudent } from '@/lib/db';
import { normalizeKenyanPhone } from '@/lib/phone';
import type { UpsertStudentRequest, UpsertStudentResponse } from '@/lib/types';

const UpsertStudentSchema = z.object({
  phoneNumber: z.string().min(1, 'phoneNumber cannot be empty'),
  fullName: z.string().optional(),
  county: z.string().optional(),
  schoolName: z.string().optional(),
  schoolType: z
    .enum(['national', 'extra_county', 'county', 'sub_county', 'private', 'other'])
    .optional(),
  kcseYear: z.number().int().min(1989).max(2030).optional(),
  kcseGrade: z.string().optional(),
  kcsePoints: z.number().int().min(7).max(84).optional(),
  kcseSubjectGrades: z.record(z.string(), z.string()).optional(),
  gpaEquivalent: z.number().min(0).max(4.0).optional(),
  satScore: z.number().int().min(400).max(1600).optional(),
  actScore: z.number().int().min(1).max(36).optional(),
  englishTest: z
    .object({
      type: z.string(),
      score: z.number(),
    })
    .optional(),
  intendedMajors: z.array(z.string()).optional(),
  needsFullAid: z.boolean().optional(),
  familyIncomeBand: z
    .enum(['under_5k', '5k_20k', '20k_60k', '60k_100k', 'over_100k', 'unknown'])
    .optional(),
  maxFamilyContributionUsd: z.number().optional(),
  activities: z
    .array(
      z.object({
        title: z.string(),
        role: z.string().optional(),
        years: z.number().optional(),
        summary: z.string().optional(),
      })
    )
    .optional(),
  preferredChannel: z.enum(['ussd', 'sms', 'whatsapp', 'web', 'voice']).optional(),
  preferredLanguage: z.enum(['en', 'sw']).optional(),
  activeModule: z
    .enum(['guide', 'gpa', 'aid', 'essay', 'lor', 'advisor', 'context', 'cue', 'interview'])
    .optional(),
  consentGivenAt: z.string().optional(),
});

/**
 * POST /api/students
 *
 * Upserts a student profile.
 * Validates Kenyan phone number, normalizes to E.164, and updates or creates record.
 * Never overwrites existing profile fields with defaults.
 */
export async function POST(req: NextRequest) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return apiError('Invalid JSON payload in request body', 400, 'VALIDATION');
    }

    const parseResult = UpsertStudentSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return zodValidationError(parseResult.error);
    }

    const data = parseResult.data;

    // Validate and normalize phone number
    const normalizedPhone = normalizeKenyanPhone(data.phoneNumber);
    if (!normalizedPhone) {
      return apiError(
        `Invalid Kenyan phone number: "${data.phoneNumber}". Must be a valid Safaricom/Airtel/Telkom mobile number.`,
        400,
        'VALIDATION',
        { rawPhoneNumber: data.phoneNumber }
      );
    }

    const upsertPayload: UpsertStudentRequest = {
      ...data,
      phoneNumber: normalizedPhone,
    };

    const { student, created } = await upsertStudent(upsertPayload);

    const responsePayload: UpsertStudentResponse = {
      student,
      created,
    };

    return apiSuccess(responsePayload, created ? 201 : 200);
  } catch (error: any) {
    console.error('[API:POST /api/students] Error:', error);
    return apiError(
      error?.message || 'Internal server error while saving student profile',
      500,
      error?.code || 'INTERNAL'
    );
  }
}
