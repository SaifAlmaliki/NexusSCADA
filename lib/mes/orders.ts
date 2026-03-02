import { prisma } from '@/lib/prisma';
import type { BatchPlan } from './batchPlanning';

export async function updateOrderFromBatches(orderId: string) {
  const batches = await prisma.batch.findMany({
    where: { workOrderId: orderId },
  });

  if (!batches.length) {
    return prisma.workOrder.update({
      where: { id: orderId },
      data: {
        actualQty: 0,
        status: 'PENDING',
      },
    });
  }

  const actualQty = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);

  const allCompleted = batches.every((b) => b.state === 'COMPLETE');
  const anyRunning = batches.some((b) => b.state === 'RUNNING' || b.state === 'SETUP');
  const anyHold = batches.some((b) => b.state === 'HOLD');

  let status: 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' = 'PENDING';

  if (allCompleted) {
    status = 'COMPLETED';
  } else if (anyHold) {
    status = 'PAUSED';
  } else if (anyRunning) {
    status = 'IN_PROGRESS';
  } else {
    status = 'PENDING';
  }

  return prisma.workOrder.update({
    where: { id: orderId },
    data: {
      actualQty,
      status,
    },
  });
}

export function ensureValidBatchPlan(orderTargetQty: number, plan: BatchPlan[]) {
  const total = plan.reduce((sum, b) => sum + (b.quantity || 0), 0);

  if (!total) {
    throw new Error('Batch plan must contain at least one batch with quantity');
  }

  if (total > orderTargetQty) {
    throw new Error('Total batch quantity exceeds order target quantity');
  }
}

