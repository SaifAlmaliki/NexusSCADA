import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { parameters, status } = data;

    const updateData: { parameters?: object; status?: string } = {};
    if (parameters !== undefined) updateData.parameters = parameters;
    if (status !== undefined) updateData.status = status;

    const recipe = await prisma.recipe.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(recipe);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 });
  }
}
