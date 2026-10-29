import { getDbClient } from './client';
import type {
  AidProgram,
  AidProgramType,
  AidMatch,
  IncomeBand,
} from '../types';

export function mapAidProgramRow(row: any): AidProgram {
  return {
    id: row.id,
    name: row.name,
    programType: row.program_type as AidProgramType,
    provider: row.provider,
    universityId: row.university_id ?? undefined,
    coversFullCost: Boolean(row.covers_full_cost),
    amountUsdMin: row.amount_usd_min ?? undefined,
    amountUsdMax: row.amount_usd_max ?? undefined,
    requiresCssProfile: Boolean(row.requires_css_profile),
    deadline: row.deadline ?? undefined,
    eligibilityMd: row.eligibility_md ?? undefined,
    howToApplyMd: row.how_to_apply_md ?? undefined,
    officialUrl: row.official_url ?? undefined,
    dataVerifiedAt: row.data_verified_at ?? null,
  };
}

export interface AidCriteria {
  incomeBand?: IncomeBand;
  needsFullAid?: boolean;
}

/**
 * Retrieves aid programs eligible for Kenyan students.
 */
export async function getAidPrograms(criteria?: AidCriteria): Promise<AidProgram[]> {
  const db = getDbClient();
  let query = db.from('aid_programs').select('*').eq('kenya_eligible', true);

  if (criteria?.needsFullAid) {
    query = query.eq('covers_full_cost', true);
  }

  const { data, error } = await query.order('name', { ascending: true });

  if (error) {
    throw new Error(`[DB Error: getAidPrograms] ${error.message}`);
  }

  return (data || []).map(mapAidProgramRow);
}

export interface SaveStudentAidMatchItem {
  programId: string;
  matchScore: number;
  reasons: string[];
  status?: string;
}

/**
 * Saves or updates student financial aid matches in student_aid_matches.
 */
export async function saveStudentAidMatches(
  studentId: string,
  matches: SaveStudentAidMatchItem[]
): Promise<void> {
  if (!matches || matches.length === 0) return;

  const db = getDbClient();

  const upsertRows = matches.map((m) => ({
    student_id: studentId,
    program_id: m.programId,
    match_score: m.matchScore,
    reasons: m.reasons,
    status: m.status || 'suggested',
    created_at: new Date().toISOString(),
  }));

  const { error } = await db
    .from('student_aid_matches')
    .upsert(upsertRows, { onConflict: 'student_id,program_id' });

  if (error) {
    throw new Error(`[DB Error: saveStudentAidMatches] ${error.message}`);
  }
}

/**
 * Retrieves existing student aid matches with populated aid program data.
 */
export async function getStudentAidMatches(studentId: string): Promise<AidMatch[]> {
  const db = getDbClient();

  const { data, error } = await db
    .from('student_aid_matches')
    .select(`
      match_score,
      reasons,
      aid_programs (*)
    `)
    .eq('student_id', studentId);

  if (error) {
    throw new Error(`[DB Error: getStudentAidMatches] ${error.message}`);
  }

  if (!data) return [];

  return data
    .filter((row: any) => row.aid_programs)
    .map((row: any) => ({
      program: mapAidProgramRow(row.aid_programs),
      matchScore: row.match_score,
      reasons: Array.isArray(row.reasons) ? row.reasons : [],
    }));
}
