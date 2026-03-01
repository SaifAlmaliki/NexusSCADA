import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Check if we already have material lots
    const count = await prisma.materialLot.count();
    if (count > 0) {
      return NextResponse.json({ message: 'Traceability data already seeded' });
    }

    // Create some users if none exist
    let user = await prisma.user.findFirst({ where: { role: 'OPERATOR' } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'operator@nexus.com',
          name: 'John Operator',
          role: 'OPERATOR'
        }
      });
    }

    // Create WorkOrder and Batch
    const line = await prisma.line.findFirst() || await prisma.line.create({
      data: {
        name: 'Line 1',
        area: {
          create: {
            name: 'Mixing Area',
            site: {
              create: {
                name: 'Main Plant'
              }
            }
          }
        }
      }
    });

    const workOrder = await prisma.workOrder.create({
      data: {
        orderNumber: `WO-${Date.now()}`,
        product: 'Industrial Lubricant XL',
        targetQty: 1000,
        lineId: line.id,
        status: 'COMPLETED'
      }
    });

    const batch = await prisma.batch.create({
      data: {
        batchNumber: 'BATCH-456',
        quantity: 1000,
        workOrderId: workOrder.id,
        status: 'COMPLETED',
        startTime: new Date(Date.now() - 86400000),
        endTime: new Date()
      }
    });

    // Create Material Lots
    const acidLot = await prisma.materialLot.create({
      data: {
        lotNumber: 'A123',
        materialName: '98% Acid',
        type: 'RAW_MATERIAL',
        quantity: 5000,
        expiryDate: new Date(Date.now() + 31536000000), // +1 year
        supplier: 'ChemCorp Inc.',
        status: 'RELEASED'
      }
    });

    const solventLot = await prisma.materialLot.create({
      data: {
        lotNumber: 'S789',
        materialName: 'Base Solvent',
        type: 'RAW_MATERIAL',
        quantity: 2000,
        expiryDate: new Date(Date.now() + 31536000000),
        supplier: 'Solvents R Us',
        status: 'RELEASED'
      }
    });

    const catalystLot = await prisma.materialLot.create({
      data: {
        lotNumber: 'C456',
        materialName: 'Catalyst',
        type: 'RAW_MATERIAL',
        quantity: 50,
        expiryDate: new Date('2027-03-01'),
        supplier: 'CatChem',
        status: 'RELEASED'
      }
    });

    const productLot = await prisma.materialLot.create({
      data: {
        lotNumber: 'P789',
        materialName: 'Industrial Lubricant XL',
        type: 'FINISHED_GOOD',
        quantity: 380,
        status: 'RELEASED'
      }
    });

    const wasteLot = await prisma.materialLot.create({
      data: {
        lotNumber: 'W-BATCH-456',
        materialName: 'Waste Sludge',
        type: 'INTERMEDIATE',
        quantity: 27,
        status: 'REJECTED'
      }
    });

    // Link Consumption
    await prisma.materialConsumption.createMany({
      data: [
        { batchId: batch.id, materialLotId: acidLot.id, quantityUsed: 250 },
        { batchId: batch.id, materialLotId: solventLot.id, quantityUsed: 150 },
        { batchId: batch.id, materialLotId: catalystLot.id, quantityUsed: 5 },
      ]
    });

    // Link Production
    await prisma.materialProduction.createMany({
      data: [
        { batchId: batch.id, materialLotId: productLot.id, quantity: 380, isWaste: false },
        { batchId: batch.id, materialLotId: wasteLot.id, quantity: 27, isWaste: true, wasteReason: 'pH deviation' },
      ]
    });

    // Add Signature
    await prisma.signature.create({
      data: {
        batchId: batch.id,
        userId: user.id,
        role: 'OPERATOR',
        meaning: 'Executed'
      }
    });

    return NextResponse.json({ success: true, message: 'Seeded traceability data' });
  } catch (error: any) {
    console.error('Seed Error:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
