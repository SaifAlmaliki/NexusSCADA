/**
 * Modbus TCP Slave Bridge - Exposes MQTT data as Modbus holding registers.
 * Subscribes to plant/# and maps topics to registers.
 */

import mqtt from 'mqtt';
import { ModbusTCPServer } from 'jsmodbus';
import { createServer } from 'net';

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const CONFIG_API_URL = process.env.CONFIG_API_URL || 'http://localhost:3000';
const DEFAULT_PORT = 5020;
const MAX_REGISTERS = 500;

let modbusServer: ReturnType<typeof createServer> | null = null;
let mqttClient: mqtt.MqttClient | null = null;
const topicToRegister: Map<string, number> = new Map();
const registerValues: Map<number, number> = new Map();
let nextRegister = 0;

function getRegisterForTopic(topic: string): number {
  let reg = topicToRegister.get(topic);
  if (reg === undefined && nextRegister < MAX_REGISTERS) {
    reg = nextRegister++;
    topicToRegister.set(topic, reg);
  }
  return reg ?? -1;
}

export async function startModbusSlaveBridge(): Promise<void> {
  const bridgeConfig = await fetchBridgeConfig('MODBUS_SLAVE');
  if (!bridgeConfig?.enabled) {
    console.log('[Modbus Bridge] Disabled');
    return;
  }

  const port = (bridgeConfig.config as Record<string, unknown>)?.port as number ?? DEFAULT_PORT;

  const holdingBuffer = Buffer.alloc(MAX_REGISTERS * 2);
  const inputBuffer = Buffer.alloc(MAX_REGISTERS * 2);

  const netServer = createServer();
  new ModbusTCPServer(netServer, {
    holding: holdingBuffer,
    input: inputBuffer,
    coils: Buffer.alloc(256),
    discrete: Buffer.alloc(256),
  });

  netServer.listen(port, () => {
    console.log(`[Modbus Bridge] Slave listening on port ${port}`);
  });

  mqttClient = mqtt.connect(MQTT_URL);
  mqttClient.on('connect', () => {
    mqttClient!.subscribe('plant/#', (err) => {
      if (err) console.error('[Modbus Bridge] Subscribe error:', err);
      else console.log('[Modbus Bridge] Subscribed to plant/#');
    });
  });
  mqttClient.on('message', (topic, payload) => {
    if (topic.endsWith('/set')) return;
    try {
      const data = JSON.parse(payload.toString());
      const value = data.value;
      const numVal = typeof value === 'number' ? value : Array.isArray(value) ? value[0] : 0;
      const reg = getRegisterForTopic(topic);
      if (reg >= 0) {
        registerValues.set(reg, numVal);
        holdingBuffer.writeUInt16BE(Math.min(65535, Math.max(0, Math.round(numVal))), reg * 2);
        inputBuffer.writeUInt16BE(Math.min(65535, Math.max(0, Math.round(numVal))), reg * 2);
      }
    } catch {
      // ignore
    }
  });

  modbusServer = netServer;
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

export async function stopModbusSlaveBridge(): Promise<void> {
  if (mqttClient) {
    mqttClient.end();
    mqttClient = null;
  }
  if (modbusServer) {
    modbusServer.close();
    modbusServer = null;
  }
  topicToRegister.clear();
  registerValues.clear();
  nextRegister = 0;
}
