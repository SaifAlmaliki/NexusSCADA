import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const unitId = searchParams.get('unitId');

  if (!unitId) {
    return NextResponse.json({ error: 'Missing unitId parameter' }, { status: 400 });
  }

  try {
    const setpoints = await prisma.scadaSetpoint.findMany({
      where: { unitId },
      select: { tagId: true, value: true }
    });
    const map = Object.fromEntries(setpoints.map(s => [s.tagId, s.value]));
    return NextResponse.json(map);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch setpoints' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { unitId, tagId, value } = await request.json();

    if (!unitId || !tagId || value == null) {
      return NextResponse.json(
        { error: 'unitId, tagId, and value are required' },
        { status: 400 }
      );
    }

    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(numValue)) {
      return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
    }

    const setpoint = await prisma.scadaSetpoint.upsert({
      where: {
        unitId_tagId: { unitId, tagId }
      },
      create: { unitId, tagId, value: numValue },
      update: { value: numValue }
    });

    return NextResponse.json(setpoint);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save setpoint' }, { status: 500 });
  }
}
