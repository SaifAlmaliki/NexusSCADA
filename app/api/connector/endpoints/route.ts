import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const endpoints = await prisma.connectorEndpoint.findMany({
      include: {
        site: true,
        area: true,
        line: true,
        equipment: true,
        tags: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(endpoints);
  } catch (error) {
    console.error('Error fetching connector endpoints:', error);
    return NextResponse.json({ error: 'Failed to fetch endpoints' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const { name, protocol, enabled = true, siteId, areaId, lineId, equipmentId, config, pollingInterval = 1000 } = data;

    if (!name || !protocol || !siteId) {
      return NextResponse.json(
        { error: 'name, protocol, and siteId are required' },
        { status: 400 }
      );
    }

    const validProtocols = ['OPC_UA', 'MODBUS_TCP', 'S7'];
    if (!validProtocols.includes(protocol)) {
      return NextResponse.json(
        { error: 'protocol must be OPC_UA, MODBUS_TCP, or S7' },
        { status: 400 }
      );
    }

    const endpoint = await prisma.connectorEndpoint.create({
      data: {
        name,
        protocol,
        enabled: Boolean(enabled),
        siteId,
        areaId: areaId || null,
        lineId: lineId || null,
        equipmentId: equipmentId || null,
        config: config || {},
        pollingInterval: Number(pollingInterval) || 1000,
      },
      include: {
        site: true,
        area: true,
        line: true,
        equipment: true,
        tags: true,
      },
    });

    return NextResponse.json(endpoint);
  } catch (error) {
    console.error('Error creating connector endpoint:', error);
    return NextResponse.json({ error: 'Failed to create endpoint' }, { status: 500 });
  }
}
