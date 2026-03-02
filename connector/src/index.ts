import mqtt from 'mqtt';
import { OpcUaConnector } from './protocols/OpcUaConnector';
import { ModbusConnector, ModbusTag } from './protocols/ModbusConnector';
import { S7Connector } from './protocols/S7Connector';
import {
  loadConfig,
  resolveTopic,
  getEdgeSiteId,
  type ConnectorConfig,
  type ConnectorEndpointConfig,
  type ConnectorTagConfig,
  startConfigPolling,
} from './config/loader';
import {
  getEdgeStatusTopic,
  getEdgeConfigTopic,
  getEdgeAckTopic,
  getEdgeDownstreamSubscribeTopic,
} from './edge-topics';
import { startOpcUaServerBridge, stopOpcUaServerBridge } from './bridges/opcua-server';
import { startModbusSlaveBridge, stopModbusSlaveBridge } from './bridges/modbus-slave';

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const SIMULATION_MODE = process.env.SIMULATION_MODE === 'true';
const HEARTBEAT_INTERVAL_MS = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '30000', 10);
const BACKOFF_MIN_MS = parseInt(process.env.BACKOFF_MIN_MS || '1000', 10);
const BACKOFF_MAX_MS = parseInt(process.env.BACKOFF_MAX_MS || '60000', 10);

const mqttClient = mqtt.connect(MQTT_URL, {
  reconnectPeriod: 0, // we handle reconnect with exponential backoff
});

let reconnectAttempt = 0;
let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

function scheduleReconnect() {
  if (reconnectTimeoutId) return;
  reconnectAttempt++;
  const delay = Math.min(BACKOFF_MAX_MS, BACKOFF_MIN_MS * Math.pow(2, reconnectAttempt - 1));
  console.log(`[MQTT] Reconnecting in ${delay}ms (attempt ${reconnectAttempt})...`);
  reconnectTimeoutId = setTimeout(() => {
    reconnectTimeoutId = null;
    mqttClient.reconnect();
  }, delay);
}

let heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
let currentEdgeSiteId: string | null = null;

// Track active connectors for cleanup on config reload
const activeConnectors: Array<{ stop: () => void }> = [];

// Map of topic (without /set) -> write handler for write commands
const writeHandlers: Map<string, (value: unknown) => Promise<void>> = new Map();

let writeCommandsSubscribed = false;

function startHeartbeat(siteId: string) {
  stopHeartbeat();
  heartbeatIntervalId = setInterval(() => {
    if (!mqttClient.connected) return;
    const topic = getEdgeStatusTopic(siteId);
    const payload = JSON.stringify({
      ts: new Date().toISOString(),
      status: 'online',
    });
    mqttClient.publish(topic, payload, { qos: 1 });
  }, HEARTBEAT_INTERVAL_MS);
  console.log(`[Edge] Heartbeat started on ${getEdgeStatusTopic(siteId)} every ${HEARTBEAT_INTERVAL_MS}ms`);
}

function stopHeartbeat() {
  if (heartbeatIntervalId) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }
}

function subscribeDownstream(siteId: string) {
  const topic = getEdgeDownstreamSubscribeTopic(siteId);
  mqttClient.subscribe(topic, { qos: 1 }, (err) => {
    if (err) console.error('[Edge] Failed to subscribe to downstream:', err);
    else console.log(`[Edge] Subscribed to downstream ${topic}`);
  });
}

mqttClient.on('connect', () => {
  reconnectAttempt = 0;
  console.log(`[MQTT] Connected to broker at ${MQTT_URL}`);
  runConnectors();
  if (!writeCommandsSubscribed) {
    subscribeToWriteCommands();
    writeCommandsSubscribed = true;
  }
  const edgeSiteId = getEdgeSiteId();
  currentEdgeSiteId = edgeSiteId;
  if (edgeSiteId) {
    startHeartbeat(edgeSiteId);
    subscribeDownstream(edgeSiteId);
  }
});

mqttClient.on('disconnect', () => {
  stopHeartbeat();
});

mqttClient.on('close', () => {
  stopHeartbeat();
  scheduleReconnect();
});

mqttClient.on('error', (err) => {
  console.error('[MQTT] Connection error:', err);
});

function publishData(
  protocol: string,
  tagName: string,
  value: unknown,
  topic: string
) {
  const payload = {
    protocol,
    tagId: tagName,
    value,
    quality: 'good',
    timestamp: new Date().toISOString(),
  };
  mqttClient.publish(topic, JSON.stringify(payload));
}

function stopAllConnectors() {
  for (const c of activeConnectors) {
    c.stop();
  }
  activeConnectors.length = 0;
  writeHandlers.clear();
  stopOpcUaServerBridge().catch(() => {});
  stopModbusSlaveBridge().catch(() => {});
}

function subscribeToWriteCommands() {
  mqttClient.subscribe('plant/+/+/+/+/+/set', (err) => {
    if (err) console.error('[MQTT] Failed to subscribe to write commands:', err);
    else console.log('[MQTT] Subscribed to write commands (plant/+/+/+/+/+/set)');
  });
  mqttClient.on('message', (topic: string, payload: Buffer) => {
    const siteId = currentEdgeSiteId;
    if (siteId && topic === getEdgeConfigTopic(siteId)) {
      try {
        const data = JSON.parse(payload.toString()) as ConnectorConfig & { requestId?: string; messageId?: string };
        const config: ConnectorConfig = { endpoints: data.endpoints ?? [] };
        if (config.endpoints.length > 0) {
          runConnectors(config);
        }
        const requestId = data.requestId ?? data.messageId ?? '';
        const ackPayload = JSON.stringify({
          requestId,
          success: true,
          ts: new Date().toISOString(),
        });
        mqttClient.publish(getEdgeAckTopic(siteId), ackPayload, { qos: 1 });
      } catch (e) {
        console.error('[Edge] Failed to apply config from downstream:', e);
        if (siteId) {
          try {
            const data = JSON.parse(payload.toString()) as { requestId?: string; messageId?: string };
            const requestId = data.requestId ?? data.messageId ?? '';
            mqttClient.publish(
              getEdgeAckTopic(siteId),
              JSON.stringify({
                requestId,
                success: false,
                error: e instanceof Error ? e.message : String(e),
                ts: new Date().toISOString(),
              }),
              { qos: 1 }
            );
          } catch (_) {}
        }
      }
      return;
    }
    if (topic.endsWith('/set')) {
      const baseTopic = topic.slice(0, -4);
      const handler = writeHandlers.get(baseTopic);
      if (handler) {
        try {
          const data = JSON.parse(payload.toString());
          const value = data.value ?? data;
          handler(value).catch((e) => console.error('[Write] Failed:', e));
        } catch (e) {
          console.error('[Write] Invalid payload:', e);
        }
      }
    }
  });
}

async function runConnectors(incomingConfig?: ConnectorConfig) {
  let config: ConnectorConfig;
  if (incomingConfig) {
    config = incomingConfig;
  } else {
    try {
      config = await loadConfig();
    } catch (err) {
      console.error('[Config] Failed to load config:', err);
      return;
    }
  }

  stopAllConnectors();

  if (config.endpoints.length === 0 && !SIMULATION_MODE) {
    console.log('[Connector] No endpoints configured. Waiting for config.');
    return;
  }

  if (SIMULATION_MODE && config.endpoints.some((ep) => !hasRealConfig(ep))) {
    console.log('--- RUNNING IN SIMULATION MODE ---');
    startSimulation(config);
    return;
  }

  for (const ep of config.endpoints) {
    if (!hasRealConfig(ep)) {
      console.warn(`[${ep.protocol}] Skipping ${ep.name} - no connection config`);
      continue;
    }
    try {
      await startEndpoint(ep);
    } catch (e) {
      console.error(`[${ep.protocol}] Failed to start ${ep.name}:`, e);
    }
  }

  // Hot-reload: poll config
  const stopPolling = startConfigPolling((newConfig) => {
    console.log('[Config] Reloading...');
    runConnectors(newConfig);
  });
  activeConnectors.push({ stop: stopPolling });

  // Start protocol bridges (OPC UA server, Modbus slave)
  startOpcUaServerBridge().catch((e) => console.warn('[OPC UA Bridge]', e));
  startModbusSlaveBridge().catch((e) => console.warn('[Modbus Bridge]', e));
}

function hasRealConfig(ep: ConnectorEndpointConfig): boolean {
  const c = ep.config as Record<string, unknown>;
  if (ep.protocol === 'OPC_UA') return !!c.endpoint;
  if (ep.protocol === 'MODBUS_TCP') return !!c.host;
  if (ep.protocol === 'S7') return !!c.host;
  return false;
}

async function startEndpoint(ep: ConnectorEndpointConfig) {
  const cfg = ep.config as Record<string, unknown>;

  if (ep.protocol === 'OPC_UA') {
    const endpoint = (cfg.endpoint as string) || 'opc.tcp://localhost:4840';
    const opcua = new OpcUaConnector(endpoint);
    await opcua.connect();
    const nodeIds = ep.tags.map((t) => t.sourceId);
    await opcua.monitorTags(nodeIds, (sourceId, value) => {
      const tag = ep.tags.find((t) => t.sourceId === sourceId);
      const topic = tag
        ? resolveTopic(tag.mqttTopic, ep.hierarchy, tag.name)
        : `plant/${ep.hierarchy.siteName}/${ep.hierarchy.equipmentName}/${String(sourceId).toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      publishData('opcua', tag?.name ?? sourceId, value, topic);
    });
    for (const tag of ep.tags.filter((t) => t.writable)) {
      const topic = resolveTopic(tag.mqttTopic, ep.hierarchy, tag.name);
      writeHandlers.set(topic, (v) => opcua.write(tag.sourceId, v));
    }
    activeConnectors.push({
      stop: () => opcua.disconnect(),
    });
  } else if (ep.protocol === 'MODBUS_TCP') {
    const host = (cfg.host as string) || 'localhost';
    const port = (cfg.port as number) || 502;
    const unitId = (cfg.unitId as number) ?? 1;
    const modbus = new ModbusConnector(host, port, unitId);
    await modbus.connect();
    const modbusTags = ep.tags.map(parseModbusSourceId);
    modbus.startPolling(modbusTags, ep.pollingInterval, (name, value) => {
      const tag = ep.tags.find((t) => t.name === name);
      const topic = tag
        ? resolveTopic(tag.mqttTopic, ep.hierarchy, tag.name)
        : `plant/${ep.hierarchy.siteName}/${ep.hierarchy.equipmentName}/${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      publishData('modbus', name, value, topic);
    });
    for (const tag of ep.tags.filter((t) => t.writable)) {
      const topic = resolveTopic(tag.mqttTopic, ep.hierarchy, tag.name);
      const parsed = parseModbusSourceId(tag);
      writeHandlers.set(topic, async (v) => {
        if (parsed.type === 'coil') {
          await modbus.writeCoil(parsed.address, Boolean(v));
        } else {
          await modbus.writeRegister(parsed.address, Number(v));
        }
      });
    }
    activeConnectors.push({
      stop: () => modbus.disconnect(),
    });
  } else if (ep.protocol === 'S7') {
    const host = (cfg.host as string) || 'localhost';
    const rack = (cfg.rack as number) ?? 0;
    const slot = (cfg.slot as number) ?? 1;
    const s7 = new S7Connector(host, rack, slot);
    await s7.connect();
    const s7Tags: Record<string, string> = {};
    for (const t of ep.tags) {
      s7Tags[t.name] = t.sourceId;
    }
    s7.startPolling(s7Tags, ep.pollingInterval, (name, value) => {
      const tag = ep.tags.find((t) => t.name === name);
      const topic = tag
        ? resolveTopic(tag.mqttTopic, ep.hierarchy, tag.name)
        : `plant/${ep.hierarchy.siteName}/${ep.hierarchy.equipmentName}/${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      publishData('s7', name, value, topic);
    });
    for (const tag of ep.tags.filter((t) => t.writable)) {
      const topic = resolveTopic(tag.mqttTopic, ep.hierarchy, tag.name);
      writeHandlers.set(topic, (v) => s7.write(tag.name, v));
    }
    activeConnectors.push({
      stop: () => s7.disconnect(),
    });
  }
}

/**
 * Parse Modbus sourceId: "address:type:length" e.g. "100:holding:1"
 */
function parseModbusSourceId(tag: ConnectorTagConfig): ModbusTag {
  const parts = tag.sourceId.split(':');
  const address = parseInt(parts[0] || '0', 10);
  const type = (parts[1] || 'holding') as ModbusTag['type'];
  const length = parseInt(parts[2] || '1', 10);
  return {
    name: tag.name,
    address,
    length,
    type,
  };
}

function startSimulation(config: ConnectorConfig) {
  const hierarchy = config.endpoints[0]?.hierarchy ?? {
    siteName: 'plant',
    equipmentName: 'reactor1',
    areaName: 'default',
    lineName: 'default',
  };

  const makeTopic = (tagName: string) =>
    `plant/${hierarchy.siteName}/${hierarchy.equipmentName}/${tagName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const t1 = setInterval(() => {
    publishData('opcua', 'T101', +(80 + Math.random() * 10).toFixed(1), makeTopic('T101'));
    publishData('opcua', 'P101', +(2.0 + Math.random() * 0.5).toFixed(2), makeTopic('P101'));
  }, 2000);

  const t2 = setInterval(() => {
    publishData('modbus', 'L101', +(60 + Math.random() * 5).toFixed(1), makeTopic('L101'));
    publishData('modbus', 'F101', +(120 + Math.random() * 15).toFixed(1), makeTopic('F101'));
  }, 2000);

  const t3 = setInterval(() => {
    publishData('s7', 'S101', Math.floor(150 + Math.random() * 10), makeTopic('S101'));
  }, 2000);

  activeConnectors.push({
    stop: () => {
      clearInterval(t1);
      clearInterval(t2);
      clearInterval(t3);
    },
  });
}
