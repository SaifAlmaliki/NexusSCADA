import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    const { id, tagId } = await params;
    const data = await req.json();

    const { sourceId, mqttTopic, name, dataType, writable, unit } = data;

    const updateData: Record<string, unknown> = {};
    if (sourceId !== undefined) updateData.sourceId = sourceId;
    if (mqttTopic !== undefined) updateData.mqttTopic = mqttTopic;
    if (name !== undefined) updateData.name = name;
    if (dataType !== undefined) updateData.dataType = dataType;
    if (writable !== undefined) updateData.writable = Boolean(writable);
    if (unit !== undefined) updateData.unit = unit;

    const existing = await prisma.connectorTag.findFirst({
      where: { id: tagId, endpointId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    const tag = await prisma.connectorTag.update({
      where: { id: tagId },
      data: updateData,
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error updating connector tag:', error);
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    const { id, tagId } = await params;

    const existing = await prisma.connectorTag.findFirst({
      where: { id: tagId, endpointId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    await prisma.connectorTag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting connector tag:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
