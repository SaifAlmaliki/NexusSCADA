import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const count = await prisma.recipe.count();
    if (count > 0) {
      return NextResponse.json({ message: 'Recipes already seeded' });
    }

    await prisma.recipe.createMany({
      data: [
        { name: 'Polymer A', version: 2, productType: 'Resin', status: 'active' },
        { name: 'Solvent Mix B', version: 1, productType: 'Solvent', status: 'active' },
        { name: 'Catalyst C', version: 4, productType: 'Catalyst', status: 'active' },
        { name: 'Polymer A', version: 1, productType: 'Resin', status: 'archived' },
        { name: 'Resin D', version: 3, productType: 'Resin', status: 'active' },
      ]
    });

    return NextResponse.json({ message: 'Recipes seeded successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to seed recipes' }, { status: 500 });
  }
}
