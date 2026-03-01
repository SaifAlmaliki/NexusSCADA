import { NextResponse } from 'next/server';
import { queryHistorian } from '@/lib/influx';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tagId = searchParams.get('tagId');
  const range = searchParams.get('range') || '-1h'; // Default to last 1 hour

  if (!tagId) {
    return NextResponse.json({ error: 'Missing tagId parameter' }, { status: 400 });
  }

  try {
    // Flux query to fetch historical data for a specific tag
    // This assumes Telegraf writes the data to the "historian" bucket
    // and maps the MQTT JSON payload correctly.
    const fluxQuery = `
      from(bucket: "historian")
        |> range(start: ${range})
        |> filter(fn: (r) => r["_measurement"] == "mqtt_consumer")
        |> filter(fn: (r) => r["tagId"] == "${tagId}")
        |> filter(fn: (r) => r["_field"] == "value")
        |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
        |> yield(name: "mean")
    `;

    const data = await queryHistorian<{ _time: string; _value: number }>(fluxQuery);

    // Format the data for recharts or other UI components
    const formattedData = data.map((row) => ({
      time: row._time,
      value: row._value,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Failed to fetch historical data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}
