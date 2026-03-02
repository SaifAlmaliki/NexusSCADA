import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
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

    const { id } = await params;
    const area = await prisma.area.findUnique({ where: { id } });
    if (!area) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 });
    }

    const body = await req.json();
    const name = body?.name != null ? String(body.name).trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const updated = await prisma.area.update({
      where: { id },
      data: { name },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating area:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
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

    const { id } = await params;
    const area = await prisma.area.findUnique({ where: { id } });
    if (!area) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 });
    }

    await prisma.area.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting area:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
