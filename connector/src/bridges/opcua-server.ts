/**
 * OPC UA Server Bridge - Exposes MQTT data as OPC UA nodes.
 * Subscribes to plant/# and creates variables in the address space.
 */

import mqtt from 'mqtt';
import {
  OPCUAServer,
  Variant,
  DataType,
} from 'node-opcua';

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const CONFIG_API_URL = process.env.CONFIG_API_URL || 'http://localhost:3000';
const DEFAULT_PORT = 4841;

let server: OPCUAServer | null = null;
let mqttClient: mqtt.MqttClient | null = null;
const topicValues: Map<string, unknown> = new Map();
const nodeCache: Map<string, boolean> = new Map();

export async function startOpcUaServerBridge(): Promise<void> {
  const bridgeConfig = await fetchBridgeConfig('OPC_UA_SERVER');
  if (!bridgeConfig?.enabled) {
    console.log('[OPC UA Bridge] Disabled');
    return;
  }

  const port = (bridgeConfig.config as Record<string, unknown>)?.port as number ?? DEFAULT_PORT;

  server = new OPCUAServer({
    port,
    resourcePath: '/UA/Connector',
    buildInfo: {
      productName: 'Nexus Connector OPC UA Bridge',
      buildNumber: '1.0',
      buildDate: new Date(),
    },
  });

  await server.initialize();

  const addressSpace = server.engine.addressSpace!;
  const namespace = addressSpace.getOwnNamespace();
  const rootFolder = addressSpace.rootFolder.objects;

  const plantFolder = namespace.addFolder(rootFolder, {
    browseName: 'Plant',
    nodeId: 'ns=1;s=Plant',
  });

  mqttClient = mqtt.connect(MQTT_URL);
  mqttClient.on('connect', () => {
    mqttClient!.subscribe('plant/#', (err) => {
      if (err) console.error('[OPC UA Bridge] Subscribe error:', err);
      else console.log('[OPC UA Bridge] Subscribed to plant/#');
    });
  });
  mqttClient.on('message', (topic: string, payload: Buffer) => {
    if (topic.endsWith('/set')) return;
    try {
      const data = JSON.parse(payload.toString());
      const value = data.value;
      topicValues.set(topic, value);
      ensureNodeExists(namespace as unknown as { addVariable: (o: Record<string, unknown>) => unknown }, plantFolder, topic, value);
    } catch {
      // ignore
    }
  });

  await server.start();
  console.log(`[OPC UA Bridge] Server listening on port ${port}`);
}

function ensureNodeExists(
  namespace: { addVariable: (options: Record<string, unknown>) => unknown },
  parent: unknown,
  topic: string,
  value: unknown
) {
  if (nodeCache.has(topic)) return;

  const parts = topic.split('/').filter(Boolean);
  if (parts[0] !== 'plant') return;

  const nodeId = 'ns=1;s=' + topic.replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '_');
  const browseName = parts[parts.length - 1] || 'value';

  const dataType = typeof value === 'number' ? 'Double' : typeof value === 'boolean' ? 'Boolean' : 'String';

  try {
    namespace.addVariable({
      componentOf: parent,
      nodeId,
      browseName,
      dataType,
      value: {
        get: () => {
          const v = topicValues.get(topic);
          return new Variant({
            dataType: typeof v === 'number' ? DataType.Double : typeof v === 'boolean' ? DataType.Boolean : DataType.String,
            value: v ?? value,
          });
        },
      },
    });
    nodeCache.set(topic, true);
  } catch (e) {
    console.warn('[OPC UA Bridge] Failed to add variable:', nodeId, e);
  }
}

async function fetchBridgeConfig(type: string): Promise<{ enabled: boolean; config: Record<string, unknown> } | null> {
  try {
    const res = await fetch(`${CONFIG_API_URL}/api/connector/bridges`);
    if (!res.ok) return null;
    const bridges = await res.json();
    const bridge = bridges.find((b: { type: string }) => b.type === type);
    return bridge || null;
  } catch {
    return null;
  }
}

export async function stopOpcUaServerBridge(): Promise<void> {
  if (mqttClient) {
    mqttClient.end();
    mqttClient = null;
  }
  if (server) {
    await server.shutdown();
    server = null;
  }
  topicValues.clear();
  nodeCache.clear();
}
