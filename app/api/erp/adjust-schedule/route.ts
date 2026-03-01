import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Fetch all pending and in-progress orders
    const orders = await prisma.workOrder.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      orderBy: {
        plannedStartDate: 'asc'
      }
    });

    if (orders.length === 0) {
      return NextResponse.json({ message: 'No orders to adjust' });
    }

    // Simulate schedule adjustment logic
    // If an order is delayed, shift subsequent orders
    let currentShift = 0;
    let adjustedCount = 0;

    for (const order of orders) {
      if (order.status === 'IN_PROGRESS' && order.plannedEndDate && order.actualStartDate) {
        // Calculate delay
        const now = new Date();
        if (now > order.plannedEndDate) {
          currentShift = now.getTime() - order.plannedEndDate.getTime();
        }
      } else if (order.status === 'PENDING' && currentShift > 0 && order.plannedStartDate && order.plannedEndDate) {
        // Shift this order
        const newStart = new Date(order.plannedStartDate.getTime() + currentShift);
        const newEnd = new Date(order.plannedEndDate.getTime() + currentShift);

        await prisma.workOrder.update({
          where: { id: order.id },
          data: {
            plannedStartDate: newStart,
            plannedEndDate: newEnd,
            varianceReason: 'Auto-adjusted due to previous order delay'
          }
        });
        adjustedCount++;
      }
    }

    return NextResponse.json({ success: true, adjustedCount });
  } catch (error: any) {
    console.error('Schedule Adjustment Error:', error);
    return NextResponse.json({ error: 'Failed to adjust schedule' }, { status: 500 });
  }
}
