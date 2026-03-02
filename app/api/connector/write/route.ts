import { NextResponse } from 'next/server';
import { getMqttClient } from '@/lib/mqtt-platform';

/**
 * Publish a write command to MQTT for the connector to execute.
 * Body: { topic: string, value: unknown } OR { unitId: string, tagId: string, value: unknown }
 * When unitId/tagId are used, topic is built as plant/default/default/default/{unitId}/{tagId}
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { topic, unitId, tagId, value } = data;

    let writeTopic: string;
    if (topic) {
      writeTopic = topic.endsWith('/set') ? topic : `${topic}/set`;
    } else if (unitId && tagId) {
      const tagSlug = String(tagId).toLowerCase().replace(/[^a-z0-9]/g, '_');
      const unitSlug = String(unitId).toLowerCase().replace(/[^a-z0-9]/g, '_');
      writeTopic = `plant/default/default/default/${unitSlug}/${tagSlug}/set`;
    } else {
      return NextResponse.json(
        { error: 'Either topic or (unitId and tagId) are required' },
        { status: 400 }
      );
    }

    const client = getMqttClient();
    const payload = JSON.stringify({ value, timestamp: new Date().toISOString() });
    client.publish(writeTopic, payload);

    return NextResponse.json({ success: true, topic: writeTopic });
  } catch (error) {
    console.error('Connector write error:', error);
    return NextResponse.json({ error: 'Failed to publish write command' }, { status: 500 });
  }
}
