import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const orders = await prisma.workOrder.findMany({
      include: {
        line: true,
        batches: true,
        recipe: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Ensure we have a line
    let line = await prisma.line.findFirst();
    if (!line) {
      const site = await prisma.site.create({ data: { name: 'Main Plant' } });
      const area = await prisma.area.create({ data: { name: 'Mixing Area', siteId: site.id } });
      line = await prisma.line.create({ data: { name: 'Line 1', areaId: area.id } });
    }

    const order = await prisma.workOrder.create({
      data: {
        orderNumber: data.orderNumber || `ORD-${Date.now()}`,
        product: data.product,
        targetQty: data.targetQty,
        lineId: line.id,
        recipeId: data.recipeId || undefined,
        plannedStartDate: data.plannedStartDate ? new Date(data.plannedStartDate) : undefined,
        plannedEndDate: data.plannedEndDate ? new Date(data.plannedEndDate) : undefined,
      },
      include: {
        line: true,
        batches: true,
        recipe: true,
      },
    });
    
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
