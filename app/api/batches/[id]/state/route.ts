import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateOrderFromBatches } from '@/lib/mes/orders';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { state } = await req.json();

    const validStates = ['IDLE', 'SETUP', 'RUNNING', 'HOLD', 'COMPLETE', 'ABORT'];
    if (!validStates.includes(state)) {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    const existing = await prisma.batch.findUnique({
      where: { id },
      include: { workOrder: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    const now = new Date();

    const data: any = { state: state as any };

    if (state === 'RUNNING' && !existing.actualStartDate) {
      data.actualStartDate = now;
    }

    if ((state === 'COMPLETE' || state === 'ABORT') && !existing.actualEndDate) {
      data.actualEndDate = now;
    }

    const batch = await prisma.batch.update({
      where: { id },
      data,
    });

    await updateOrderFromBatches(existing.workOrderId);

    return NextResponse.json(batch);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update batch state' }, { status: 500 });
  }
}
