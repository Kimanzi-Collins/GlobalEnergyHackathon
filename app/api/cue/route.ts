import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getAllFlaggedAgencies, searchFlaggedAgencies } from '@/lib/db';

const CUE_OFFICIAL_ADVISORY =
  'Commission for University Education (CUE) Official Notice (January 2026): ' +
  'Students and parents are cautioned against unaccredited foreign institutions and rogue commercial agencies ' +
  'promising guaranteed admission or charging exorbitant application fees. Submitting through Common App is direct and free with a fee waiver, ' +
  'and EducationUSA advising is completely free. Note: An entity NOT appearing on this list does NOT confirm legitimacy; ' +
  'always verify foreign institutions on official US Department of Education / CHEA accreditation databases.';

/**
 * GET /api/cue
 * Accepts ?q=...
 * Searches the flagged_agencies table in Supabase DB for matching entity names or cities.
 * Returns matching flagged entities alongside the official CUE safety advisory.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    let agencies;
    if (query && query.trim()) {
      agencies = await searchFlaggedAgencies(query.trim());
    } else {
      agencies = await getAllFlaggedAgencies();
    }

    return apiSuccess({
      query: query?.trim() || null,
      matches: agencies,
      totalFound: agencies.length,
      isFlagged: agencies.length > 0,
      advisory: CUE_OFFICIAL_ADVISORY,
      officialResources: [
        {
          name: 'EducationUSA Kenya (US Embassy Nairobi & Kisumu)',
          url: 'https://educationusa.state.gov',
          cost: 'Free',
        },
        {
          name: 'Common App Direct Application',
          url: 'https://www.commonapp.org',
          cost: 'Free fee waivers available',
        },
        {
          name: 'US Council for Higher Education Accreditation (CHEA)',
          url: 'https://www.chea.org',
          cost: 'Official accreditation verification',
        },
      ],
    });
  } catch (err: any) {
    console.error('[API:GET /api/cue] Error:', err);
    return apiError(
      err?.message || 'Failed to search CUE flagged agencies',
      500,
      'UPSTREAM_DB'
    );
  }
}
