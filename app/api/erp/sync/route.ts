import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchErpOrders, pushStatusesToErp } from '@/lib/erp/mockErpClient';

export async function POST() {
  try {
    const erpOrders = await fetchErpOrders();

    let importedCount = 0;

    for (const erp of erpOrders) {
      await prisma.workOrder.upsert({
        where: {
          erpOrderId: erp.erpOrderId,
        },
        update: {
          orderNumber: erp.orderNumber,
          product: erp.product,
          targetQty: erp.targetQty,
          plannedStartDate: erp.plannedStartDate ? new Date(erp.plannedStartDate) : undefined,
          plannedEndDate: erp.plannedEndDate ? new Date(erp.plannedEndDate) : undefined,
        },
        create: {
          erpOrderId: erp.erpOrderId,
          orderNumber: erp.orderNumber,
          product: erp.product,
          targetQty: erp.targetQty,
          line: {
            connectOrCreate: {
              where: { id: 'default-line' },
              create: {
                id: 'default-line',
                name: 'Line 1',
                area: {
                  connectOrCreate: {
                    where: { id: 'default-area' },
                    create: {
                      id: 'default-area',
                      name: 'Area 1',
                      site: {
                        connectOrCreate: {
                          where: { id: 'default-site' },
                          create: {
                            id: 'default-site',
                            name: 'Main Plant',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          plannedStartDate: erp.plannedStartDate ? new Date(erp.plannedStartDate) : undefined,
          plannedEndDate: erp.plannedEndDate ? new Date(erp.plannedEndDate) : undefined,
        },
      });

      importedCount += 1;
    }

    await prisma.erpSyncLog.create({
      data: {
        syncType: 'ORDER_IMPORT',
        status: 'SUCCESS',
        recordsProcessed: importedCount,
      },
    });

    const mesOrders = await prisma.workOrder.findMany({
      include: { batches: true },
    });

    await pushStatusesToErp();

    await prisma.erpSyncLog.create({
      data: {
        syncType: 'STATUS_UPDATE',
        status: 'SUCCESS',
        recordsProcessed: mesOrders.length,
      },
    });

    return NextResponse.json({ importedCount, statusUpdates: mesOrders.length });
  } catch (error: any) {
    console.error('ERP sync failed', error);

    await prisma.erpSyncLog.create({
      data: {
        syncType: 'ORDER_IMPORT',
        status: 'FAILED',
        recordsProcessed: 0,
        errorMessage: error.message,
      },
    });

    return NextResponse.json({ error: 'ERP sync failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Simulate fetching data from SAP/Oracle
    const mockErpOrders = [
      {
        erpOrderId: `ERP-${Date.now()}-1`,
        orderNumber: `WO-${Date.now()}-1`,
        product: 'Industrial Lubricant XL',
        targetQty: 5000,
        plannedStartDate: new Date(),
        plannedEndDate: new Date(Date.now() + 86400000), // +1 day
      },
      {
        erpOrderId: `ERP-${Date.now()}-2`,
        orderNumber: `WO-${Date.now()}-2`,
        product: 'Coolant Premium',
        targetQty: 2000,
        plannedStartDate: new Date(Date.now() + 86400000),
        plannedEndDate: new Date(Date.now() + 172800000), // +2 days
      }
    ];

    // Get a line to assign orders to
    const line = await prisma.line.findFirst();
    if (!line) {
      return NextResponse.json({ error: 'No production lines found' }, { status: 400 });
    }

    let processed = 0;
    for (const order of mockErpOrders) {
      await prisma.workOrder.upsert({
        where: { erpOrderId: order.erpOrderId },
        update: {
          targetQty: order.targetQty,
          plannedStartDate: order.plannedStartDate,
          plannedEndDate: order.plannedEndDate,
        },
        create: {
          erpOrderId: order.erpOrderId,
          orderNumber: order.orderNumber,
          product: order.product,
          targetQty: order.targetQty,
          plannedStartDate: order.plannedStartDate,
          plannedEndDate: order.plannedEndDate,
          lineId: line.id,
          status: 'PENDING'
        }
      });
      processed++;
    }

    // Log the sync
    await prisma.erpSyncLog.create({
      data: {
        syncType: 'ORDER_IMPORT',
        status: 'SUCCESS',
        recordsProcessed: processed,
      }
    });

    return NextResponse.json({ success: true, processed });
  } catch (error: any) {
    console.error('ERP Sync Error:', error);
    await prisma.erpSyncLog.create({
      data: {
        syncType: 'ORDER_IMPORT',
        status: 'FAILED',
        errorMessage: error.message,
      }
    });
    return NextResponse.json({ error: 'Failed to sync with ERP' }, { status: 500 });
  }
}
