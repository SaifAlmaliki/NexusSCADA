import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queryHistorian } from '@/lib/influx';
import { buildEnergyConsumptionQuery } from '@/lib/energy-queries';
import { prisma } from '@/lib/prisma';
import type { HierarchyLevel } from '@/lib/energy-queries';

const LEVELS: HierarchyLevel[] = ['line', 'area', 'site', 'multi-plant'];

/** GET /api/energy/consumption?start=...&end=...&level=line|area|site|multi-plant&siteId=&areaId=&lineId= */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const level = (searchParams.get('level') || 'site') as HierarchyLevel;
    const siteIdParam = searchParams.get('siteId') ?? undefined;
    const areaIdParam = searchParams.get('areaId') ?? undefined;
    const lineIdParam = searchParams.get('lineId') ?? undefined;
    const window = searchParams.get('window') || '5m';

    if (!startParam || !endParam) {
      return NextResponse.json(
        { error: 'start and end query parameters are required (RFC3339 or relative -1h)' },
        { status: 400 }
      );
    }

    const start = startParam === 'now' || startParam === '' ? 'now()' : startParam.startsWith('-') ? startParam : `time(v: "${startParam}")`;
    const stop = endParam === 'now' || endParam === '' ? 'now()' : endParam.startsWith('-') ? endParam : `time(v: "${endParam}")`;

    if (!LEVELS.includes(level)) {
      return NextResponse.json(
        { error: `level must be one of: ${LEVELS.join(', ')}` },
        { status: 400 }
      );
    }

    let allowedSiteIds: string[] | null = null;
    if (session.user.siteId) {
      allowedSiteIds = [session.user.siteId];
      if (siteIdParam && siteIdParam !== session.user.siteId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    let siteName: string | undefined;
    let areaName: string | undefined;
    let lineName: string | undefined;

    if (siteIdParam) {
      const site = await prisma.site.findFirst({
        where: { id: siteIdParam, ...(allowedSiteIds && { id: { in: allowedSiteIds } }) },
      });
      if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
      siteName = site.name;
    }
    if (areaIdParam) {
      const area = await prisma.area.findFirst({
        where: { id: areaIdParam },
        include: { site: true },
      });
      if (!area) return NextResponse.json({ error: 'Area not found' }, { status: 404 });
      if (allowedSiteIds && !allowedSiteIds.includes(area.siteId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      areaName = area.name;
    }
    if (lineIdParam) {
      const line = await prisma.line.findFirst({
        where: { id: lineIdParam },
        include: { area: { include: { site: true } } },
      });
      if (!line) return NextResponse.json({ error: 'Line not found' }, { status: 404 });
      if (allowedSiteIds && !allowedSiteIds.includes(line.area.siteId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      lineName = line.name;
    }

    const fluxQuery = buildEnergyConsumptionQuery({
      start,
      stop,
      siteName,
      areaName,
      lineName,
      aggregateWindow: window,
    });

    let rows: Array<{ _time: string; _value: number; site?: string; area?: string; line?: string; equipment?: string }> = [];
    try {
      rows = await queryHistorian(fluxQuery);
    } catch (influxErr) {
      console.error('InfluxDB energy query error:', influxErr);
      return NextResponse.json({ series: [] });
    }

    const series = rows.map((r) => ({
      time: r._time,
      value: r._value,
      site: r.site,
      area: r.area,
      line: r.line,
      equipment: r.equipment,
    }));

    return NextResponse.json({ series });
  } catch (err) {
    console.error('Energy consumption query failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch energy consumption' },
      { status: 500 }
    );
  }
}
