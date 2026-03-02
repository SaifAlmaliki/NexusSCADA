import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let sites = await prisma.site.findMany({
      orderBy: { name: 'asc' },
    });

    if (sites.length === 0) {
      const defaultSite = await prisma.site.create({
        data: {
          name: 'Plant Alpha (NY)',
          location: 'New York, USA',
        }
      });
      sites = [defaultSite];
    }

    return NextResponse.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: ADMIN required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, location, description, timezone, address } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const existing = await prisma.site.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return NextResponse.json({ error: 'Site with this name already exists' }, { status: 400 });
    }

    const site = await prisma.site.create({
      data: {
        name: name.trim(),
        location: location == null || location === '' ? null : String(location),
        description: description == null || description === '' ? null : String(description),
        timezone: timezone == null || timezone === '' ? null : String(timezone),
        address: address == null || address === '' ? null : String(address),
      },
    });
    return NextResponse.json(site);
  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
