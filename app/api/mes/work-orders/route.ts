import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch work orders with their associated line and area
    const workOrders = await prisma.workOrder.findMany({
      include: {
        line: {
          include: {
            area: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(workOrders);
  } catch (error) {
    console.error('Failed to fetch work orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderNumber, product, targetQty, lineId } = body;

    const newOrder = await prisma.workOrder.create({
      data: {
        orderNumber,
        product,
        targetQty,
        lineId,
      },
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Failed to create work order:', error);
    return NextResponse.json(
      { error: 'Failed to create work order' },
      { status: 500 }
    );
  }
}
