import { getDbClient } from './client';

export interface FlaggedAgency {
  id: string;
  entityName: string;
  entityType: 'illegal_agency' | 'unaccredited_university';
  locationCity: string;
  warningReason?: string;
  cueNoticeDate: string;
}

export function mapFlaggedAgencyRow(row: any): FlaggedAgency {
  return {
    id: row.id,
    entityName: row.entity_name,
    entityType: row.entity_type,
    locationCity: row.location_city,
    warningReason: row.warning_reason ?? undefined,
    cueNoticeDate: row.cue_notice_date || 'January 2026',
  };
}

/**
 * Searches the Commission for University Education (CUE) blacklist of flagged rogue agencies & unaccredited universities.
 */
export async function searchFlaggedAgencies(query: string): Promise<FlaggedAgency[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const db = getDbClient();

  const { data, error } = await db
    .from('flagged_agencies')
    .select('*')
    .or(`entity_name.ilike.%${trimmed}%,location_city.ilike.%${trimmed}%`);

  if (error) {
    throw new Error(`[DB Error: searchFlaggedAgencies] ${error.message}`);
  }

  return (data || []).map(mapFlaggedAgencyRow);
}

/**
 * Retrieves all flagged agencies for USSD numbered flow or full listing.
 */
export async function getAllFlaggedAgencies(): Promise<FlaggedAgency[]> {
  const db = getDbClient();

  const { data, error } = await db
    .from('flagged_agencies')
    .select('*')
    .order('entity_name', { ascending: true });

  if (error) {
    throw new Error(`[DB Error: getAllFlaggedAgencies] ${error.message}`);
  }

  return (data || []).map(mapFlaggedAgencyRow);
}
