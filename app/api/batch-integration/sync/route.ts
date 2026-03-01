import { NextResponse } from 'next/server';
import { syncAllBatches } from '@/lib/batch-sync-worker';

export async function POST() {
  try {
    const result = await syncAllBatches();
    if (result.success) {
      return NextResponse.json({ message: 'Sync completed successfully' });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
