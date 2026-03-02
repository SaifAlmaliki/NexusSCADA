import { NextResponse } from 'next/server';
import { parseSiteFilter, getConnectorConfig } from '@/lib/connector-config';

/**
 * Returns connector configuration for the connector service.
 * Used at startup and for hot-reload. Format optimized for connector consumption.
 *
 * Optional query params (edge-per-site):
 * - siteId: single site UUID; return only endpoints for this site.
 * - siteIds: comma-separated site UUIDs; return only endpoints for these sites.
 * If omitted, returns all enabled endpoints.
 */
export async function GET(req: Request) {
  try {
    const url = req.url ? new URL(req.url) : null;
    const searchParams = url?.searchParams ?? new URLSearchParams();
    const { siteIds } = parseSiteFilter(searchParams);

    const where = {
      enabled: true,
      ...(siteIds && siteIds.length > 0 && { siteId: { in: siteIds } }),
    };

    const config = await getConnectorConfig(where);
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching connector config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}
