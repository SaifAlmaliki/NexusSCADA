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
    const site = await prisma.site.findUnique({
      where: { id },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    if (session.user.siteId && session.user.siteId !== site.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(site);
  } catch (error) {
    console.error('Error fetching site:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const body = await req.json();
    const { name, location, description, timezone, address } = body;

    const site = await prisma.site.findUnique({ where: { id } });
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const data: { name?: string; location?: string; description?: string; timezone?: string; address?: string } = {};
    if (name !== undefined) data.name = String(name).trim() || undefined;
    if (location !== undefined) data.location = location === null || location === '' ? null : String(location);
    if (description !== undefined) data.description = description === null || description === '' ? null : String(description);
    if (timezone !== undefined) data.timezone = timezone === null || timezone === '' ? null : String(timezone);
    if (address !== undefined) data.address = address === null || address === '' ? null : String(address);

    const updated = await prisma.site.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating site:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
