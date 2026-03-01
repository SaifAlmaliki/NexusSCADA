import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { batchId } = await req.json();

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        workOrder: {
          include: {
            line: {
              include: {
                equipment: {
                  include: {
                    anomalies: true,
                    downtimes: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Gather context for Gemini
    const anomalies = batch.workOrder.line.equipment.flatMap(e => e.anomalies);
    const downtimes = batch.workOrder.line.equipment.flatMap(e => e.downtimes);
    
    const context = `
      Batch Number: ${batch.batchNumber}
      Product: ${batch.workOrder.product}
      Planned Start: ${batch.plannedStartDate}
      Planned End: ${batch.plannedEndDate}
      Actual Start: ${batch.actualStartDate}
      Actual End: ${batch.actualEndDate}
      Quantity: ${batch.quantity}
      
      Anomalies during this period: ${JSON.stringify(anomalies)}
      Downtimes during this period: ${JSON.stringify(downtimes)}
    `;

    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following manufacturing batch data and provide a concise root cause analysis for why this batch was delayed or overrun. Focus on the anomalies and downtimes provided. If no anomalies or downtimes exist, suggest potential operational inefficiencies. Keep it under 3 sentences.\n\nData:\n${context}`,
    });

    const rootCause = response.text || 'Unable to determine root cause.';

    // Update the batch with the root cause
    await prisma.batch.update({
      where: { id: batchId },
      data: { rootCause }
    });

    return NextResponse.json({ success: true, rootCause });
  } catch (error: any) {
    console.error('Root Cause Analysis Error:', error);
    return NextResponse.json({ error: 'Failed to generate root cause analysis' }, { status: 500 });
  }
}
