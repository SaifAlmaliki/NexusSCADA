import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { state } = await req.json();
    
    // Validate state
    const validStates = ['IDLE', 'SETUP', 'RUNNING', 'HOLD', 'COMPLETE', 'ABORT'];
    if (!validStates.includes(state)) {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    const batch = await prisma.batch.update({
      where: { id: params.id },
      data: { state: state as any }
    });
    
    // In a real app, we would also push this state change to the external system
    // if it's a bidirectional integration.
    
    return NextResponse.json(batch);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update batch state' }, { status: 500 });
  }
}
