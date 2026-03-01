import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lines = await prisma.line.findMany({
      where: { areaId: id },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(lines);
  } catch (error) {
    console.error('Error fetching lines:', error);
    return NextResponse.json({ error: 'Failed to fetch lines' }, { status: 500 });
  }
}
