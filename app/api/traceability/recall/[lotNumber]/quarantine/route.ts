import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ lotNumber: string }> }) {
  try {
    const { lotNumber } = await params;
    const lot = await prisma.materialLot.findUnique({
      where: { lotNumber },
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

    const downstreamLotIds = lot.consumedIn.flatMap(c => 
      c.batch.producedLots.map(p => p.materialLot.id)
    );

    if (downstreamLotIds.length > 0) {
      await prisma.materialLot.updateMany({
        where: { id: { in: downstreamLotIds } },
        data: { status: 'QUARANTINED' }
      });
    }

    return NextResponse.json({ success: true, quarantinedCount: downstreamLotIds.length });
  } catch (error) {
    console.error('Quarantine error:', error);
    return NextResponse.json({ error: 'Failed to quarantine' }, { status: 500 });
  }
}
