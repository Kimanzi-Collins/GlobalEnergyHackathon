import { getDbClient } from './client';
import type {
  University,
  UniversityMatch,
  MatchTier,
  AidOutlook,
} from '../types';

export function mapUniversityRow(row: any): University {
  return {
    id: row.id,
    name: row.name,
    meets100PctNeed: Boolean(row.meets_100_pct_need),
    isNeedBlindIntl: Boolean(row.is_need_blind_intl),
    edEaDeadline: row.ed_ea_deadline,
    rdDeadline: row.rd_deadline,
    applicationPlatform: row.application_platform || 'common_app',
    cssProfileRequired: row.css_profile_required !== false,
    testPolicy: row.test_policy || 'optional',
    strongMajors: Array.isArray(row.strong_majors) ? row.strong_majors : [],
    websiteUrl: row.website_url ?? undefined,
    dataVerifiedAt: row.data_verified_at ?? null,
  };
}

export interface AdvisorCriteria {
  kcseGrade?: string;
  minSat?: number;
  needsFullAid?: boolean;
  major?: string;
}

/**
 * Retrieves candidate universities for advisory matching.
 * In live mode, only universities in the DB are queried.
 */
export async function getUniversitiesForAdvisor(criteria?: AdvisorCriteria): Promise<University[]> {
  const db = getDbClient();
  let query = db.from('universities').select('*');

  if (criteria?.needsFullAid) {
    // International students needing full aid prioritize 100% need schools
    query = query.eq('meets_100_pct_need', true);
  }

  const { data, error } = await query.order('name', { ascending: true });

  if (error) {
    throw new Error(`[DB Error: getUniversitiesForAdvisor] ${error.message}`);
  }

  return (data || []).map(mapUniversityRow);
}

/**
 * Retrieves a single university by its ID.
 */
export async function getUniversityById(id: string): Promise<University | null> {
  const db = getDbClient();
  const { data, error } = await db
    .from('universities')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return mapUniversityRow(data);
}

export interface SaveUniversityMatchItem {
  universityId: string;
  tier: MatchTier;
  fitScore: number;
  aidOutlook: AidOutlook;
  reasons: string[];
  studentStatus?: string;
}

/**
 * Saves or updates matched universities for a student in university_matches.
 */
export async function saveUniversityMatches(
  studentId: string,
  matches: SaveUniversityMatchItem[]
): Promise<void> {
  if (!matches || matches.length === 0) return;

  const db = getDbClient();

  const upsertRows = matches.map((m) => ({
    student_id: studentId,
    university_id: m.universityId,
    tier: m.tier,
    fit_score: m.fitScore,
    aid_outlook: m.aidOutlook,
    reasons: m.reasons,
    student_status: m.studentStatus || 'suggested',
    created_at: new Date().toISOString(),
  }));

  const { error } = await db
    .from('university_matches')
    .upsert(upsertRows, { onConflict: 'student_id,university_id' });

  if (error) {
    throw new Error(`[DB Error: saveUniversityMatches] ${error.message}`);
  }
}

/**
 * Retrieves existing university matches for a student with populated university data.
 */
export async function getStudentUniversityMatches(studentId: string): Promise<UniversityMatch[]> {
  const db = getDbClient();

  const { data, error } = await db
    .from('university_matches')
    .select(`
      tier,
      fit_score,
      aid_outlook,
      reasons,
      universities (*)
    `)
    .eq('student_id', studentId);

  if (error) {
    throw new Error(`[DB Error: getStudentUniversityMatches] ${error.message}`);
  }

  if (!data) return [];

  return data
    .filter((row: any) => row.universities)
    .map((row: any) => ({
      university: mapUniversityRow(row.universities),
      tier: row.tier as MatchTier,
      fitScore: row.fit_score,
      aidOutlook: row.aid_outlook as AidOutlook,
      reasons: Array.isArray(row.reasons) ? row.reasons : [],
    }));
}
