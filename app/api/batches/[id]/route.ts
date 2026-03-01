import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: params.id },
      include: {
        workOrder: { include: { line: true } },
        consumedLots: { include: { materialLot: true } },
        producedLots: { include: { materialLot: true } },
        externalMapping: true
      }
    });
    
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    
    return NextResponse.json(batch);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch batch' }, { status: 500 });
  }
}
