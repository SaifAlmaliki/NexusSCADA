import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const bridges = await prisma.bridgeConfig.findMany({
      orderBy: { type: 'asc' },
    });
    return NextResponse.json(bridges);
  } catch (error) {
    console.error('Error fetching bridge configs:', error);
    return NextResponse.json({ error: 'Failed to fetch bridge configs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const { type, enabled = false, config = {} } = data;

    if (!type) {
      return NextResponse.json(
        { error: 'type is required (OPC_UA_SERVER or MODBUS_SLAVE)' },
        { status: 400 }
      );
    }

    const validTypes = ['OPC_UA_SERVER', 'MODBUS_SLAVE'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'type must be OPC_UA_SERVER or MODBUS_SLAVE' },
        { status: 400 }
      );
    }

    const bridge = await prisma.bridgeConfig.upsert({
      where: { type },
      create: {
        type,
        enabled: Boolean(enabled),
        config,
      },
      update: {
        enabled: Boolean(enabled),
        config,
      },
    });

    return NextResponse.json(bridge);
  } catch (error) {
    console.error('Error saving bridge config:', error);
    return NextResponse.json({ error: 'Failed to save bridge config' }, { status: 500 });
  }
}
