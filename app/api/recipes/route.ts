import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      orderBy: [{ name: 'asc' }, { version: 'desc' }]
    });
    return NextResponse.json(recipes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, productType, version = 1, parameters } = data;

    if (!name || !productType) {
      return NextResponse.json(
        { error: 'Name and product type are required' },
        { status: 400 }
      );
    }

    const recipe = await prisma.recipe.create({
      data: {
        name,
        productType,
        version: version || 1,
        parameters: parameters || {},
        status: 'active'
      }
    });

    return NextResponse.json(recipe);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
  }
}
