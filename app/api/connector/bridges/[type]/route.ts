import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;

    const bridge = await prisma.bridgeConfig.findUnique({
      where: { type },
    });

    if (!bridge) {
      return NextResponse.json({ error: 'Bridge not found' }, { status: 404 });
    }

    return NextResponse.json(bridge);
  } catch (error) {
    console.error('Error fetching bridge config:', error);
    return NextResponse.json({ error: 'Failed to fetch bridge config' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const data = await req.json();

    const { enabled, config } = data;

    const bridge = await prisma.bridgeConfig.upsert({
      where: { type },
      create: {
        type,
        enabled: Boolean(enabled ?? false),
        config: config ?? {},
      },
      update: {
        ...(enabled !== undefined && { enabled: Boolean(enabled) }),
        ...(config !== undefined && { config }),
      },
    });

    return NextResponse.json(bridge);
  } catch (error) {
    console.error('Error updating bridge config:', error);
    return NextResponse.json({ error: 'Failed to update bridge config' }, { status: 500 });
  }
}
