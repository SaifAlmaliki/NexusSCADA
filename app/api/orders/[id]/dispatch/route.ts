import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdapter } from '@/lib/batch-adapters';
import { ensureValidBatchPlan, updateOrderFromBatches } from '@/lib/mes/orders';
import type { BatchPlan } from '@/lib/mes/batchPlanning';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const batches: BatchPlan[] = Array.isArray(body?.batches) ? body.batches : [];

    const order = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        line: { include: { area: { include: { site: true } } } },
        batches: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!batches.length) {
      return NextResponse.json({ error: 'No batches provided' }, { status: 400 });
    }

    try {
      ensureValidBatchPlan(order.targetQty, batches);
    } catch (planError: any) {
      return NextResponse.json({ error: planError.message }, { status: 400 });
    }

    const createdBatches = [];

    for (const [index, plan] of batches.entries()) {
      const batchNumber = `B-${order.orderNumber}-${Date.now().toString().slice(-4)}-${index + 1}`;

      const batch = await prisma.batch.create({
        data: {
          batchNumber,
          workOrderId: order.id,
          quantity: plan.quantity,
          status: 'PENDING',
          state: 'IDLE',
          plannedStartDate: plan.plannedStartDate ? new Date(plan.plannedStartDate) : undefined,
          plannedEndDate: plan.plannedEndDate ? new Date(plan.plannedEndDate) : undefined,
        },
      });

      createdBatches.push(batch);

      const config = await prisma.batchIntegrationConfig.findFirst({
        where: { siteId: order.line.area.siteId },
      });

      if (config && config.baseUrl && config.authToken) {
        try {
          const adapter = getAdapter(config.type);
          const externalResponse = await adapter.createBatch(
            {
              baseUrl: config.baseUrl,
              authToken: config.authToken,
              mappingRules: config.mappingRules,
            },
            {
              batchId: batch.batchNumber,
              recipe: order.product,
              quantity: batch.quantity,
            },
          );

          await prisma.batchExternalMapping.create({
            data: {
              mesBatchId: batch.id,
              externalBatchId: externalResponse.externalBatchId,
              externalState: 'IDLE',
              lastSyncAt: new Date(),
            },
          });

          await prisma.batch.update({
            where: { id: batch.id },
            data: { externalBatchId: externalResponse.externalBatchId },
          });
        } catch (syncError: any) {
          console.error('Failed to dispatch to external system:', syncError);
        }
      }
    }

    await updateOrderFromBatches(order.id);

    const updatedOrder = await prisma.workOrder.findUnique({
      where: { id: order.id },
      include: {
        line: true,
        batches: true,
        recipe: true,
      },
    });

    return NextResponse.json({
      order: updatedOrder,
      batches: createdBatches,
    });
  } catch (error: any) {
    console.error('Dispatch error:', error);
    return NextResponse.json({ error: 'Failed to dispatch order' }, { status: 500 });
  }
}
