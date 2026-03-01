import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Returns full connector configuration for the connector service.
 * Used at startup and for hot-reload. Format optimized for connector consumption.
 */
export async function GET() {
  try {
    const endpoints = await prisma.connectorEndpoint.findMany({
      where: { enabled: true },
      include: {
        site: true,
        area: true,
        line: true,
        equipment: true,
        tags: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const config = endpoints.map((ep) => {
      const siteName = ep.site?.name ?? 'plant';
      const areaName = ep.area?.name ?? 'default';
      const lineName = ep.line?.name ?? 'default';
      const equipmentName = ep.equipment?.name ?? ep.name;

      return {
        id: ep.id,
        name: ep.name,
        protocol: ep.protocol,
        config: ep.config as Record<string, unknown>,
        pollingInterval: ep.pollingInterval,
        hierarchy: {
          siteId: ep.siteId,
          siteName,
          areaId: ep.areaId,
          areaName,
          lineId: ep.lineId,
          lineName,
          equipmentId: ep.equipmentId,
          equipmentName,
        },
        tags: ep.tags.map((t) => ({
          id: t.id,
          sourceId: t.sourceId,
          mqttTopic: t.mqttTopic,
          name: t.name,
          dataType: t.dataType,
          writable: t.writable,
          unit: t.unit,
        })),
      };
    });

    return NextResponse.json({ endpoints: config });
  } catch (error) {
    console.error('Error fetching connector config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}
