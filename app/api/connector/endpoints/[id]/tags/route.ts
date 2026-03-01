import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tags = await prisma.connectorTag.findMany({
      where: { endpointId: id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching connector tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    const { sourceId, mqttTopic, name, dataType, writable = false, unit } = data;

    if (!sourceId || !name) {
      return NextResponse.json(
        { error: 'sourceId and name are required' },
        { status: 400 }
      );
    }

    const tag = await prisma.connectorTag.create({
      data: {
        endpointId: id,
        sourceId,
        mqttTopic: mqttTopic || `plant/{site}/{equipment}/${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name,
        dataType: dataType || null,
        writable: Boolean(writable),
        unit: unit || null,
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error creating connector tag:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
