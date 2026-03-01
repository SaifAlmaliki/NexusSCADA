import mqtt from 'mqtt';
import { OpcUaConnector } from './protocols/OpcUaConnector';
import { ModbusConnector, ModbusTag } from './protocols/ModbusConnector';
import { S7Connector } from './protocols/S7Connector';

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const SIMULATION_MODE = process.env.SIMULATION_MODE === 'true';

const mqttClient = mqtt.connect(MQTT_URL);

mqttClient.on('connect', () => {
  console.log(`[MQTT] Connected to broker at ${MQTT_URL}`);
  startConnectors();
});

mqttClient.on('error', (err) => {
  console.error('[MQTT] Connection error:', err);
});

async function startConnectors() {
  if (SIMULATION_MODE) {
    console.log('--- RUNNING IN SIMULATION MODE ---');
    console.log('No real PLCs will be connected. Mock data will be published to MQTT.');
    startSimulation();
    return;
  }

  // 1. OPC UA Example
  try {
    const opcua = new OpcUaConnector('opc.tcp://192.168.1.10:4840');
    await opcua.connect();
    await opcua.monitorTags(['ns=2;s=Temperature', 'ns=2;s=Pressure'], (tag, value) => {
      publishData('opcua', tag, value);
    });
  } catch (e) {
    console.error('[OPC UA] Failed to initialize', e);
  }

  // 2. Modbus Example
  try {
    const modbus = new ModbusConnector('192.168.1.20', 502, 1);
    await modbus.connect();
    const modbusTags: ModbusTag[] = [
      { name: 'Level', address: 100, length: 1, type: 'holding' },
      { name: 'Flow', address: 102, length: 1, type: 'holding' }
    ];
    modbus.startPolling(modbusTags, 1000, (tag, value) => {
      publishData('modbus', tag, value);
    });
  } catch (e) {
    console.error('[Modbus] Failed to initialize', e);
  }

  // 3. S7 Example
  try {
    const s7 = new S7Connector('192.168.1.30', 0, 1);
    await s7.connect();
    const s7Tags = {
      'AgitatorSpeed': 'DB1,REAL0',
      'PumpStatus': 'DB1,X4.0'
    };
    s7.startPolling(s7Tags, 1000, (tag, value) => {
      publishData('s7', tag, value);
    });
  } catch (e) {
    console.error('[S7] Failed to initialize', e);
  }
}

function publishData(protocol: string, tag: string, value: any) {
  const payload = {
    protocol,
    tagId: tag,
    value,
    quality: 'good',
    timestamp: new Date().toISOString()
  };
  
  // Publish to a unified namespace topic structure
  const topic = `plant/reactor1/${tag.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  mqttClient.publish(topic, JSON.stringify(payload));
}

// --- Simulation Mode for Preview Environment ---
function startSimulation() {
  // Simulate OPC UA (Temperature & Pressure)
  setInterval(() => {
    publishData('opcua', 'T101', +(80 + Math.random() * 10).toFixed(1));
    publishData('opcua', 'P101', +(2.0 + Math.random() * 0.5).toFixed(2));
  }, 2000);

  // Simulate Modbus (Level & Flow)
  setInterval(() => {
    publishData('modbus', 'L101', +(60 + Math.random() * 5).toFixed(1));
    publishData('modbus', 'F101', +(120 + Math.random() * 15).toFixed(1));
  }, 2000);

  // Simulate S7 (Agitator Speed)
  setInterval(() => {
    publishData('s7', 'S101', Math.floor(150 + Math.random() * 10));
  }, 2000);
}
