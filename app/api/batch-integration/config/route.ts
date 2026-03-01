import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const configs = await prisma.batchIntegrationConfig.findMany({
      include: { site: true }
    });
    return NextResponse.json(configs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch configs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Ensure we have a site
    let site = await prisma.site.findFirst();
    if (!site) {
      site = await prisma.site.create({ data: { name: 'Main Plant' } });
    }

    const config = await prisma.batchIntegrationConfig.create({
      data: {
        siteId: site.id,
        type: data.type || 'rest',
        baseUrl: data.baseUrl,
        authToken: data.authToken,
        pollingInterval: data.pollingInterval || 30,
        mappingRules: data.mappingRules || {}
      }
    });
    
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
