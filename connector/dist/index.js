"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mqtt_1 = __importDefault(require("mqtt"));
const OpcUaConnector_1 = require("./protocols/OpcUaConnector");
const ModbusConnector_1 = require("./protocols/ModbusConnector");
const S7Connector_1 = require("./protocols/S7Connector");
const loader_1 = require("./config/loader");
const opcua_server_1 = require("./bridges/opcua-server");
const modbus_slave_1 = require("./bridges/modbus-slave");
const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const SIMULATION_MODE = process.env.SIMULATION_MODE === 'true';
const mqttClient = mqtt_1.default.connect(MQTT_URL);
// Track active connectors for cleanup on config reload
const activeConnectors = [];
// Map of topic (without /set) -> write handler for write commands
const writeHandlers = new Map();
let writeCommandsSubscribed = false;
mqttClient.on('connect', () => {
    console.log(`[MQTT] Connected to broker at ${MQTT_URL}`);
    runConnectors();
    if (!writeCommandsSubscribed) {
        subscribeToWriteCommands();
        writeCommandsSubscribed = true;
    }
});
mqttClient.on('error', (err) => {
    console.error('[MQTT] Connection error:', err);
});
function publishData(protocol, tagName, value, topic) {
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
    (0, opcua_server_1.stopOpcUaServerBridge)().catch(() => { });
    (0, modbus_slave_1.stopModbusSlaveBridge)().catch(() => { });
}
function subscribeToWriteCommands() {
    mqttClient.subscribe('plant/+/+/+/+/+/set', (err) => {
        if (err)
            console.error('[MQTT] Failed to subscribe to write commands:', err);
        else
            console.log('[MQTT] Subscribed to write commands (plant/+/+/+/+/+/set)');
    });
    mqttClient.on('message', (topic, payload) => {
        if (topic.endsWith('/set')) {
            const baseTopic = topic.slice(0, -4);
            const handler = writeHandlers.get(baseTopic);
            if (handler) {
                try {
                    const data = JSON.parse(payload.toString());
                    const value = data.value ?? data;
                    handler(value).catch((e) => console.error('[Write] Failed:', e));
                }
                catch (e) {
                    console.error('[Write] Invalid payload:', e);
                }
            }
        }
    });
}
async function runConnectors(incomingConfig) {
    let config;
    if (incomingConfig) {
        config = incomingConfig;
    }
    else {
        try {
            config = await (0, loader_1.loadConfig)();
        }
        catch (err) {
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
        }
        catch (e) {
            console.error(`[${ep.protocol}] Failed to start ${ep.name}:`, e);
        }
    }
    // Hot-reload: poll config
    const stopPolling = (0, loader_1.startConfigPolling)((newConfig) => {
        console.log('[Config] Reloading...');
        runConnectors(newConfig);
    });
    activeConnectors.push({ stop: stopPolling });
    // Start protocol bridges (OPC UA server, Modbus slave)
    (0, opcua_server_1.startOpcUaServerBridge)().catch((e) => console.warn('[OPC UA Bridge]', e));
    (0, modbus_slave_1.startModbusSlaveBridge)().catch((e) => console.warn('[Modbus Bridge]', e));
}
function hasRealConfig(ep) {
    const c = ep.config;
    if (ep.protocol === 'OPC_UA')
        return !!c.endpoint;
    if (ep.protocol === 'MODBUS_TCP')
        return !!c.host;
    if (ep.protocol === 'S7')
        return !!c.host;
    return false;
}
async function startEndpoint(ep) {
    const cfg = ep.config;
    if (ep.protocol === 'OPC_UA') {
        const endpoint = cfg.endpoint || 'opc.tcp://localhost:4840';
        const opcua = new OpcUaConnector_1.OpcUaConnector(endpoint);
        await opcua.connect();
        const nodeIds = ep.tags.map((t) => t.sourceId);
        await opcua.monitorTags(nodeIds, (sourceId, value) => {
            const tag = ep.tags.find((t) => t.sourceId === sourceId);
            const topic = tag
                ? (0, loader_1.resolveTopic)(tag.mqttTopic, ep.hierarchy, tag.name)
                : `plant/${ep.hierarchy.siteName}/${ep.hierarchy.equipmentName}/${String(sourceId).toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            publishData('opcua', tag?.name ?? sourceId, value, topic);
        });
        for (const tag of ep.tags.filter((t) => t.writable)) {
            const topic = (0, loader_1.resolveTopic)(tag.mqttTopic, ep.hierarchy, tag.name);
            writeHandlers.set(topic, (v) => opcua.write(tag.sourceId, v));
        }
        activeConnectors.push({
            stop: () => opcua.disconnect(),
        });
    }
    else if (ep.protocol === 'MODBUS_TCP') {
        const host = cfg.host || 'localhost';
        const port = cfg.port || 502;
        const unitId = cfg.unitId ?? 1;
        const modbus = new ModbusConnector_1.ModbusConnector(host, port, unitId);
        await modbus.connect();
        const modbusTags = ep.tags.map(parseModbusSourceId);
        modbus.startPolling(modbusTags, ep.pollingInterval, (name, value) => {
            const tag = ep.tags.find((t) => t.name === name);
            const topic = tag
                ? (0, loader_1.resolveTopic)(tag.mqttTopic, ep.hierarchy, tag.name)
                : `plant/${ep.hierarchy.siteName}/${ep.hierarchy.equipmentName}/${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            publishData('modbus', name, value, topic);
        });
        for (const tag of ep.tags.filter((t) => t.writable)) {
            const topic = (0, loader_1.resolveTopic)(tag.mqttTopic, ep.hierarchy, tag.name);
            const parsed = parseModbusSourceId(tag);
            writeHandlers.set(topic, async (v) => {
                if (parsed.type === 'coil') {
                    await modbus.writeCoil(parsed.address, Boolean(v));
                }
                else {
                    await modbus.writeRegister(parsed.address, Number(v));
                }
            });
        }
        activeConnectors.push({
            stop: () => modbus.disconnect(),
        });
    }
    else if (ep.protocol === 'S7') {
        const host = cfg.host || 'localhost';
        const rack = cfg.rack ?? 0;
        const slot = cfg.slot ?? 1;
        const s7 = new S7Connector_1.S7Connector(host, rack, slot);
        await s7.connect();
        const s7Tags = {};
        for (const t of ep.tags) {
            s7Tags[t.name] = t.sourceId;
        }
        s7.startPolling(s7Tags, ep.pollingInterval, (name, value) => {
            const tag = ep.tags.find((t) => t.name === name);
            const topic = tag
                ? (0, loader_1.resolveTopic)(tag.mqttTopic, ep.hierarchy, tag.name)
                : `plant/${ep.hierarchy.siteName}/${ep.hierarchy.equipmentName}/${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            publishData('s7', name, value, topic);
        });
        for (const tag of ep.tags.filter((t) => t.writable)) {
            const topic = (0, loader_1.resolveTopic)(tag.mqttTopic, ep.hierarchy, tag.name);
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
function parseModbusSourceId(tag) {
    const parts = tag.sourceId.split(':');
    const address = parseInt(parts[0] || '0', 10);
    const type = (parts[1] || 'holding');
    const length = parseInt(parts[2] || '1', 10);
    return {
        name: tag.name,
        address,
        length,
        type,
    };
}
function startSimulation(config) {
    const hierarchy = config.endpoints[0]?.hierarchy ?? {
        siteName: 'plant',
        equipmentName: 'reactor1',
        areaName: 'default',
        lineName: 'default',
    };
    const makeTopic = (tagName) => `plant/${hierarchy.siteName}/${hierarchy.equipmentName}/${tagName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
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
