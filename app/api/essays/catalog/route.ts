import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getEssayCatalog } from '@/lib/db';
import type { EssayCatalogResponse } from '@/lib/types';

/**
 * GET /api/essays/catalog
 * Accepts optional ?universityId=... and ?type=...
 * Returns EssayCatalogResponse ({ types, schools })
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const universityId = searchParams.get('universityId') || undefined;
    const type = searchParams.get('type') || undefined;

    const catalog: EssayCatalogResponse = await getEssayCatalog(universityId, type);

    return apiSuccess(catalog);
  } catch (err: any) {
    console.error('[API:GET /api/essays/catalog] Error:', err);
    return apiError(
      err?.message || 'Failed to retrieve essay catalog',
      500,
      'UPSTREAM_DB'
    );
  }
}
