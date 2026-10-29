import { supabaseAdmin } from '@/lib/at-supabase';
import type { Channel, KcseGradeBand } from '@/lib/types';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const DEFAULT_KCSE_GRADE_BANDS: KcseGradeBand[] = [
  { grade: 'A',  pointsPerSubject: 12, aggregateMin: 81, aggregateMax: 84, gpa40: 4.00, ussdCode: 1 },
  { grade: 'A-', pointsPerSubject: 11, aggregateMin: 74, aggregateMax: 80, gpa40: 3.85, ussdCode: 2 },
  { grade: 'B+', pointsPerSubject: 10, aggregateMin: 67, aggregateMax: 73, gpa40: 3.50, ussdCode: 3 },
  { grade: 'B',  pointsPerSubject: 9,  aggregateMin: 60, aggregateMax: 66, gpa40: 3.20, ussdCode: 4 },
  { grade: 'B-', pointsPerSubject: 8,  aggregateMin: 53, aggregateMax: 59, gpa40: 2.90, ussdCode: 5 },
  { grade: 'C+', pointsPerSubject: 7,  aggregateMin: 46, aggregateMax: 52, gpa40: 2.60, ussdCode: 6 },
  { grade: 'C',  pointsPerSubject: 6,  aggregateMin: 39, aggregateMax: 45, gpa40: 2.30, ussdCode: 7 },
  { grade: 'C-', pointsPerSubject: 5,  aggregateMin: 32, aggregateMax: 38, gpa40: 2.00, ussdCode: 8 },
  { grade: 'D+', pointsPerSubject: 4,  aggregateMin: 25, aggregateMax: 31, gpa40: 1.70, ussdCode: 9 },
  { grade: 'D',  pointsPerSubject: 3,  aggregateMin: 18, aggregateMax: 24, gpa40: 1.30, ussdCode: 10 },
  { grade: 'D-', pointsPerSubject: 2,  aggregateMin: 11, aggregateMax: 17, gpa40: 1.00, ussdCode: 11 },
  { grade: 'E',  pointsPerSubject: 1,  aggregateMin: 7,  aggregateMax: 10, gpa40: 0.00, ussdCode: 12 },
];

function toKcseGradeBand(row: any): KcseGradeBand {
  return {
    grade: row.grade,
    pointsPerSubject: Number(row.points_per_subject),
    aggregateMin: Number(row.aggregate_min),
    aggregateMax: Number(row.aggregate_max),
    gpa40: Number(row.gpa_4_0),
    ussdCode: Number(row.ussd_code),
  };
}

/**
 * Retrieves all KCSE grade conversion scale bands from Supabase,
 * falling back to deterministic defaults in demo mode.
 */
export async function getAllGradeBands(): Promise<KcseGradeBand[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('kcse_grade_scale')
      .select('*')
      .order('points_per_subject', { ascending: false });

    if (error) {
      if (isDemoMode) {
        return DEFAULT_KCSE_GRADE_BANDS;
      }
      throw new Error(`[DB:getAllGradeBands] Failed to query grade scale: ${error.message}`);
    }

    if (!data || data.length === 0) {
      if (isDemoMode) {
        return DEFAULT_KCSE_GRADE_BANDS;
      }
      return DEFAULT_KCSE_GRADE_BANDS;
    }

    return data.map(toKcseGradeBand);
  } catch (err) {
    if (isDemoMode) {
      return DEFAULT_KCSE_GRADE_BANDS;
    }
    throw err;
  }
}

/**
 * Looks up a grade band by mean grade string (case-insensitive, e.g. "A", "a-", "B+").
 */
export async function getGradeBand(grade: string): Promise<KcseGradeBand | null> {
  const normalized = grade.trim().toUpperCase();
  const bands = await getAllGradeBands();
  return bands.find((b) => b.grade.toUpperCase() === normalized) || null;
}

/**
 * Looks up a grade band by aggregate points (7 to 84).
 */
export async function getGradeBandByPoints(points: number): Promise<KcseGradeBand | null> {
  const bands = await getAllGradeBands();
  return bands.find((b) => points >= b.aggregateMin && points <= b.aggregateMax) || null;
}

/**
 * Stores a GPA conversion record into gpa_conversions.
 */
export async function insertGpaConversion(params: {
  studentId?: string;
  input: Record<string, unknown>;
  gpaUnweighted: number;
  gpaScale?: number;
  method: string;
  explanation: string;
  channel?: Channel;
}): Promise<string> {
  const record = {
    student_id: params.studentId || null,
    input: params.input,
    gpa_unweighted: params.gpaUnweighted,
    gpa_scale: params.gpaScale || 4.0,
    method: params.method,
    explanation: params.explanation,
    channel: params.channel || 'web',
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('gpa_conversions')
      .insert(record)
      .select('id')
      .single();

    if (error) {
      if (!isDemoMode) {
        throw new Error(`[DB:insertGpaConversion] Insert failed: ${error.message}`);
      }
      return `demo-gpa-conv-${Date.now()}`;
    }

    return data?.id || `conv-${Date.now()}`;
  } catch (err) {
    if (!isDemoMode) throw err;
    return `demo-gpa-conv-${Date.now()}`;
  }
}

export async function getKcseGradeScale(): Promise<KcseGradeBand[]> {
  return getAllGradeBands();
}
