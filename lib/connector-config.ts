import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

/**
 * Parse site filter from request search params.
 * Supports ?siteId=uuid or ?siteIds=uuid1,uuid2.
 * Reusable for any connector API that needs site scoping.
 */
export function parseSiteFilter(searchParams: URLSearchParams): { siteIds: string[] | null } {
  const siteId = searchParams.get('siteId');
  const siteIdsParam = searchParams.get('siteIds');
  if (siteId && siteId.trim()) {
    return { siteIds: [siteId.trim()] };
  }
  if (siteIdsParam && siteIdsParam.trim()) {
    const ids = siteIdsParam.split(',').map((s) => s.trim()).filter(Boolean);
    return ids.length ? { siteIds: ids } : { siteIds: null };
  }
  return { siteIds: null };
}

/** Connector config endpoint DTO (one endpoint entry). */
export interface ConnectorConfigEndpointDto {
  id: string;
  name: string;
  protocol: string;
  config: Record<string, unknown>;
  pollingInterval: number;
  hierarchy: {
    siteId: string;
    siteName: string;
    areaId: string | null;
    areaName: string;
    lineId: string | null;
    lineName: string;
    equipmentId: string | null;
    equipmentName: string;
  };
  tags: Array<{
    id: string;
    sourceId: string;
    mqttTopic: string;
    name: string;
    dataType: string | null;
    writable: boolean;
    unit: string | null;
  }>;
}

export interface ConnectorConfigDto {
  endpoints: ConnectorConfigEndpointDto[];
}

/**
 * Fetch connector config for given Prisma where clause.
 * Single place for endpoint mapping; used by GET /api/connector/config.
 */
export async function getConnectorConfig(
  where: Prisma.ConnectorEndpointWhereInput
): Promise<ConnectorConfigDto> {
  const endpoints = await prisma.connectorEndpoint.findMany({
    where,
    include: {
      site: true,
      area: true,
      line: true,
      equipment: true,
      tags: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const config: ConnectorConfigEndpointDto[] = endpoints.map((ep) => {
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

  return { endpoints: config };
}
