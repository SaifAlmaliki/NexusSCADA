import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const endpoint = await prisma.connectorEndpoint.findUnique({
      where: { id },
      include: {
        site: true,
        area: true,
        line: true,
        equipment: true,
        tags: true,
      },
    });

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json(endpoint);
  } catch (error) {
    console.error('Error fetching connector endpoint:', error);
    return NextResponse.json({ error: 'Failed to fetch endpoint' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    const { name, protocol, enabled, siteId, areaId, lineId, equipmentId, config, pollingInterval } = data;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (protocol !== undefined) updateData.protocol = protocol;
    if (enabled !== undefined) updateData.enabled = Boolean(enabled);
    if (siteId !== undefined) updateData.siteId = siteId;
    if (areaId !== undefined) updateData.areaId = areaId || null;
    if (lineId !== undefined) updateData.lineId = lineId || null;
    if (equipmentId !== undefined) updateData.equipmentId = equipmentId || null;
    if (config !== undefined) updateData.config = config;
    if (pollingInterval !== undefined) updateData.pollingInterval = Number(pollingInterval) || 1000;

    const endpoint = await prisma.connectorEndpoint.update({
      where: { id },
      data: updateData,
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
    console.error('Error updating connector endpoint:', error);
    return NextResponse.json({ error: 'Failed to update endpoint' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.connectorEndpoint.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting connector endpoint:', error);
    return NextResponse.json({ error: 'Failed to delete endpoint' }, { status: 500 });
  }
}
