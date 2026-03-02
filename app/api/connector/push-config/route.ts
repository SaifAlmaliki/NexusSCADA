import { NextResponse } from 'next/server';
import { parseSiteFilter, getConnectorConfig } from '@/lib/connector-config';
import { getEdgeConfigTopic } from '@/lib/edge-topics';
import { getMqttClient } from '@/lib/mqtt-platform';

/**
 * Push connector config to edge(s) via MQTT (downstream channel).
 * Payload is identical to GET /api/connector/config (ConnectorConfigDto) for DRY.
 * Query: siteId=uuid or siteIds=uuid1,uuid2. Pushes to each site's edge/{siteId}/config with QoS 1.
 */
export async function POST(req: Request) {
  try {
    const url = req.url ? new URL(req.url) : null;
    const searchParams = url?.searchParams ?? new URLSearchParams();
    const { siteIds } = parseSiteFilter(searchParams);

    if (!siteIds || siteIds.length === 0) {
      return NextResponse.json(
        { error: 'Query param siteId or siteIds is required' },
        { status: 400 }
      );
    }

    const client = getMqttClient();
    const results: { siteId: string; topic: string; ok: boolean }[] = [];

    for (const siteId of siteIds) {
      const config = await getConnectorConfig({
        enabled: true,
        siteId,
      });
      const topic = getEdgeConfigTopic(siteId);
      const payload = JSON.stringify({
        ...config,
        requestId: `push-${Date.now()}-${siteId.slice(0, 8)}`,
      });
      client.publish(topic, payload, { qos: 1 });
      results.push({ siteId, topic, ok: true });
    }

    return NextResponse.json({
      success: true,
      pushed: results.length,
      results,
    });
  } catch (error) {
    console.error('Push config error:', error);
    return NextResponse.json(
      { error: 'Failed to push config to edge' },
      { status: 500 }
    );
  }
}
