import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: ADMIN required' }, { status: 403 });
    }

    const { id: areaId } = await params;
    const area = await prisma.area.findUnique({ where: { id: areaId } });
    if (!area) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 });
    }

    const body = await req.json();
    const name = body?.name != null ? String(body.name).trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const line = await prisma.line.create({
      data: { name, areaId },
    });
    return NextResponse.json(line);
  } catch (error) {
    console.error('Error creating line:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
