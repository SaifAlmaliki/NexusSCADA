import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveTopic } from '@/lib/topic';

/**
 * Returns list of energy meters with resolved MQTT topics for Telegraf/connector.
 * Each entry has tagId, meterType, and topic (resolved from tag.mqttTopic + endpoint hierarchy).
 */
export async function GET() {
  try {
    const meters = await prisma.energyMeter.findMany({
      where: { tag: { endpoint: { enabled: true } } },
      include: {
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
      },
    });

    const siteName = (s: { name: string } | null) => s?.name ?? 'plant';
    const areaName = (a: { name: string } | null) => a?.name ?? 'default';
    const lineName = (l: { name: string } | null) => l?.name ?? 'default';
    const equipmentName = (e: { name: string } | null, epName: string) => e?.name ?? epName;

    const list = meters.map((em) => {
      const ep = em.tag.endpoint;
      const hierarchy = {
        siteName: siteName(ep.site),
        areaName: areaName(ep.area),
        lineName: lineName(ep.line),
        equipmentName: equipmentName(ep.equipment, ep.name),
      };
      const topic = resolveTopic(em.tag.mqttTopic, hierarchy, em.tag.name);
      return {
        tagId: em.tagId,
        meterType: em.meterType.toLowerCase(),
        topic,
        tagName: em.tag.name,
      };
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching energy meters for connector:', error);
    return NextResponse.json({ error: 'Failed to fetch energy meters' }, { status: 500 });
  }
}
