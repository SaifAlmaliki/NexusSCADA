import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const syncLogs = await prisma.erpSyncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const orders = await prisma.workOrder.findMany({
      include: {
        batches: true,
        recipe: true,
      },
      orderBy: { plannedStartDate: 'asc' },
      take: 20,
    });

    const variances = orders.map((order) => {
      const firstBatch = order.batches.length
        ? order.batches.reduce((earliest, b) => {
            if (!earliest) return b;
            if (!b.actualStartDate) return earliest;
            if (!earliest.actualStartDate) return b;
            return b.actualStartDate < earliest.actualStartDate ? b : earliest;
          }, order.batches[0] as any)
        : null;

      const planned = order.plannedStartDate;
      const actual = firstBatch?.actualStartDate || order.actualStartDate;

      let varianceLabel = 'N/A';
      let status: 'DELAYED' | 'ON_TRACK' | 'PENDING' = 'PENDING';

      if (planned && actual) {
        const diffMinutes = Math.round((actual.getTime() - planned.getTime()) / 60000);
        varianceLabel = `${diffMinutes >= 0 ? '+' : ''}${diffMinutes} min`;
        status = diffMinutes > 10 ? 'DELAYED' : 'ON_TRACK';
      } else if (planned && !actual) {
        status = 'PENDING';
      }

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        product: order.product,
        recipeName: order.recipe?.name ?? null,
        plannedStart: planned ? planned.toISOString() : null,
        actualStart: actual ? actual.toISOString() : null,
        variance: varianceLabel,
        status,
      };
    });

    return NextResponse.json({
      syncLogs,
      variances,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load ERP bridge data' }, { status: 500 });
  }
}

