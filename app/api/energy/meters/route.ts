import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidMeterType } from '@/lib/energy';

const energyMeterInclude = {
  tag: {
    include: {
      endpoint: {
        include: {
          site: true,
          area: true,
          line: true,
          equipment: true,
        },
      },
    },
  },
} as const;

function toMeterWithHierarchy(em: Awaited<ReturnType<typeof prisma.energyMeter.findFirst>> & { tag: { endpoint: { site: unknown; area: unknown; line: unknown; equipment: unknown } } }) {
  if (!em) return null;
  const ep = em.tag.endpoint;
  return {
    id: em.id,
    tagId: em.tagId,
    meterType: em.meterType,
    tag: {
      id: em.tag.id,
      name: em.tag.name,
      sourceId: em.tag.sourceId,
      unit: em.tag.unit,
      endpoint: {
        id: ep.id,
        name: ep.name,
        siteId: ep.siteId,
        site: ep.site,
        areaId: ep.areaId,
        area: ep.area,
        lineId: ep.lineId,
        line: ep.line,
        equipmentId: ep.equipmentId,
        equipment: ep.equipment,
      },
    },
  };
}

/** List energy meters with optional filter by siteId, areaId, lineId */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId') ?? undefined;
    const areaId = searchParams.get('areaId') ?? undefined;
    const lineId = searchParams.get('lineId') ?? undefined;

    const where: Parameters<typeof prisma.energyMeter.findMany>[0]['where'] = {};
    const endpointWhere: { siteId?: string; areaId?: string; lineId?: string } = {};
    if (session.user.siteId) endpointWhere.siteId = session.user.siteId;
    if (siteId) endpointWhere.siteId = siteId;
    if (areaId) endpointWhere.areaId = areaId;
    if (lineId) endpointWhere.lineId = lineId;
    if (Object.keys(endpointWhere).length > 0) {
      where.tag = { endpoint: endpointWhere };
    }

    const meters = await prisma.energyMeter.findMany({
      where,
      include: energyMeterInclude,
      orderBy: { createdAt: 'desc' },
    });

    const result = meters.map((m) => toMeterWithHierarchy(m as never));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing energy meters:', error);
    return NextResponse.json({ error: 'Failed to list energy meters' }, { status: 500 });
  }
}

/** Create energy meter: validate tag exists and meterType, persist */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tagId, meterType } = body;

    if (!tagId || !meterType) {
      return NextResponse.json(
        { error: 'tagId and meterType are required' },
        { status: 400 }
      );
    }

    if (!isValidMeterType(meterType)) {
      return NextResponse.json(
        { error: `meterType must be one of: KWH, KW, POWER_FACTOR` },
        { status: 400 }
      );
    }

    const tag = await prisma.connectorTag.findUnique({
      where: { id: tagId },
      include: { endpoint: true },
    });
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }
    if (session.user.siteId && tag.endpoint.siteId !== session.user.siteId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.energyMeter.findUnique({
      where: { tagId },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'This tag is already configured as an energy meter' },
        { status: 409 }
      );
    }

    const energyMeter = await prisma.energyMeter.create({
      data: { tagId, meterType },
      include: energyMeterInclude,
    });

    return NextResponse.json(toMeterWithHierarchy(energyMeter as never));
  } catch (error) {
    console.error('Error creating energy meter:', error);
    return NextResponse.json({ error: 'Failed to create energy meter' }, { status: 500 });
  }
}
