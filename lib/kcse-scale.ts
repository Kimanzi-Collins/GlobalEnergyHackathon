import type { KcseGradeBand } from '@/lib/types';

/**
 * Offline copy of `kcse_grade_scale` (supabase/seed_02_modules.sql) used by the landing-page demo.
 * GPA values are an INDICATIVE heuristic (pepea_heuristic_v1), not an official evaluation.
 * The real conversion lives in the GPA API (BE-API-02); keep both in sync.
 */
export const KCSE_SCALE: KcseGradeBand[] = [
  { grade: 'A', pointsPerSubject: 12, aggregateMin: 81, aggregateMax: 84, gpa40: 4.0, ussdCode: 1 },
  { grade: 'A-', pointsPerSubject: 11, aggregateMin: 74, aggregateMax: 80, gpa40: 3.85, ussdCode: 2 },
  { grade: 'B+', pointsPerSubject: 10, aggregateMin: 67, aggregateMax: 73, gpa40: 3.5, ussdCode: 3 },
  { grade: 'B', pointsPerSubject: 9, aggregateMin: 60, aggregateMax: 66, gpa40: 3.2, ussdCode: 4 },
  { grade: 'B-', pointsPerSubject: 8, aggregateMin: 53, aggregateMax: 59, gpa40: 2.9, ussdCode: 5 },
  { grade: 'C+', pointsPerSubject: 7, aggregateMin: 46, aggregateMax: 52, gpa40: 2.6, ussdCode: 6 },
];
