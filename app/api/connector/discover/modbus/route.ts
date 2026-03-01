import { NextResponse } from 'next/server';
import { ModbusTCPClient } from 'jsmodbus';
import { Socket } from 'net';

export async function POST(req: Request) {
  try {
    const { host, port = 502, unitId = 1, startAddress = 0, count = 100 } = await req.json();

    if (!host || typeof host !== 'string') {
      return NextResponse.json(
        { error: 'host is required' },
        { status: 400 }
      );
    }

    const socket = new Socket();
    const client = new ModbusTCPClient(socket, Number(unitId));

    await new Promise<void>((resolve, reject) => {
      socket.connect({ host, port: Number(port) }, () => resolve());
      socket.on('error', reject);
    });

    const results: Array<{
      address: number;
      type: 'holding' | 'input';
      values: number[];
      sourceId: string;
    }> = [];

    try {
      const holdingResp = await client.readHoldingRegisters(Number(startAddress), Number(count));
      const holdingValues = holdingResp.response.body.valuesAsArray as number[];
      const holdingChunks = findNonZeroRanges(holdingValues, Number(startAddress));
      for (const { start: addr, values } of holdingChunks) {
        results.push({
          address: addr,
          type: 'holding',
          values,
          sourceId: `${addr}:holding:${values.length}`,
        });
      }
    } catch (err) {
      console.warn('Modbus holding scan failed:', err);
    }

    try {
      const inputResp = await client.readInputRegisters(Number(startAddress), Number(count));
      const inputValues = inputResp.response.body.valuesAsArray as number[];
      const inputChunks = findNonZeroRanges(inputValues, Number(startAddress));
      for (const { start: addr, values } of inputChunks) {
        results.push({
          address: addr,
          type: 'input',
          values,
          sourceId: `${addr}:input:${values.length}`,
        });
      }
    } catch (err) {
      console.warn('Modbus input scan failed:', err);
    }

    socket.destroy();

    return NextResponse.json({ registers: results });
  } catch (error) {
    console.error('Modbus discovery error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Discovery failed' },
      { status: 500 }
    );
  }
}

function findNonZeroRanges(
  values: number[],
  baseAddress: number
): Array<{ start: number; values: number[] }> {
  const chunks: Array<{ start: number; values: number[] }> = [];
  let chunkStart = -1;
  let chunkValues: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v !== 0 && v !== undefined) {
      if (chunkStart < 0) {
        chunkStart = baseAddress + i;
        chunkValues = [v];
      } else {
        chunkValues.push(v);
      }
    } else {
      if (chunkStart >= 0) {
        chunks.push({ start: chunkStart, values: chunkValues });
        chunkStart = -1;
      }
    }
  }
  if (chunkStart >= 0) {
    chunks.push({ start: chunkStart, values: chunkValues });
  }
  return chunks;
}
