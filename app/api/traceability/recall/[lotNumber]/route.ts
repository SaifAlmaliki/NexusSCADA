import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { lotNumber: string } }) {
  try {
    const lot = await prisma.materialLot.findUnique({
      where: { lotNumber: params.lotNumber },
      include: {
        consumedIn: {
          include: {
            batch: {
              include: {
                producedLots: {
                  include: { materialLot: true }
                }
              }
            }
          }
        }
      }
    });

    if (!lot) {
      return NextResponse.json({ error: 'Lot not found' }, { status: 404 });
    }

    // Find downstream lots
    const downstreamLots: any[] = [];
    
    for (const consumption of lot.consumedIn) {
      for (const production of consumption.batch.producedLots) {
        downstreamLots.push({
          id: production.materialLot.id,
          lotNumber: production.materialLot.lotNumber,
          materialName: production.materialLot.materialName,
          status: production.materialLot.status,
          quantity: production.materialLot.quantity,
          unit: production.materialLot.unit,
          producedInBatch: consumption.batch.batchNumber
        });
      }
    }

    return NextResponse.json({
      ...lot,
      downstreamLots
    });
  } catch (error) {
    console.error('Recall fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch recall data' }, { status: 500 });
  }
}
