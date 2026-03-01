import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdapter } from '@/lib/batch-adapters';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const order = await prisma.workOrder.findUnique({
      where: { id: params.id },
      include: { line: { include: { area: { include: { site: true } } } } }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Create the batch in MES
    const batchNumber = `B-${order.orderNumber}-${Date.now().toString().slice(-4)}`;
    
    const batch = await prisma.batch.create({
      data: {
        batchNumber,
        workOrderId: order.id,
        quantity: order.targetQty,
        status: 'PENDING',
        state: 'IDLE',
      }
    });

    // Update order status
    await prisma.workOrder.update({
      where: { id: order.id },
      data: { status: 'IN_PROGRESS' }
    });

    // Try to sync with external system if configured
    const config = await prisma.batchIntegrationConfig.findFirst({
      where: { siteId: order.line.area.siteId }
    });

    if (config && config.baseUrl && config.authToken) {
      try {
        const adapter = getAdapter(config.type);
        const externalResponse = await adapter.createBatch({
          baseUrl: config.baseUrl,
          authToken: config.authToken,
          mappingRules: config.mappingRules
        }, {
          batchId: batch.batchNumber,
          recipe: order.product,
          quantity: batch.quantity
        });

        // Create mapping
        await prisma.batchExternalMapping.create({
          data: {
            mesBatchId: batch.id,
            externalBatchId: externalResponse.externalBatchId,
            externalState: 'IDLE',
            lastSyncAt: new Date()
          }
        });

        // Update batch with external ID
        await prisma.batch.update({
          where: { id: batch.id },
          data: { externalBatchId: externalResponse.externalBatchId }
        });
      } catch (syncError: any) {
        console.error('Failed to dispatch to external system:', syncError);
        // We still return success for the MES creation, but log the sync error
      }
    }

    return NextResponse.json(batch);
  } catch (error: any) {
    console.error('Dispatch error:', error);
    return NextResponse.json({ error: 'Failed to dispatch order' }, { status: 500 });
  }
}
