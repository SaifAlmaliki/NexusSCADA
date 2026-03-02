import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Delete energy meter by id */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.energyMeter.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Energy meter not found' }, { status: 404 });
    }

    await prisma.energyMeter.delete({
      where: { id },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting energy meter:', error);
    return NextResponse.json({ error: 'Failed to delete energy meter' }, { status: 500 });
  }
}
