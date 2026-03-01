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
