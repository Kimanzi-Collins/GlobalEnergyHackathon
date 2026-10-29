import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';
import type { ApiError } from './types';

/**
 * Standard helper to build uniform ApiError responses matching lib/types.ts ApiError.
 */
export function apiError(
  message: string,
  status: number = 400,
  code: ApiError['code'] = 'VALIDATION',
  details?: Record<string, unknown>
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: message,
      code,
      details,
    },
    { status }
  );
}

/**
 * Formats Zod validation errors into an ApiError response.
 */
export function zodValidationError(error: ZodError): NextResponse<ApiError> {
  const issues = error.issues || [];
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of issues) {
    const path = issue.path.join('.') || '_root';
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }

  const primaryMessage = issues[0]?.message || 'Validation failed';

  return apiError(primaryMessage, 400, 'VALIDATION', {
    validationErrors: fieldErrors,
  });
}

/**
 * Standard success response helper.
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}
