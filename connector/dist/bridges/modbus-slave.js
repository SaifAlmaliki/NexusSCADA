"use strict";
/**
 * Modbus TCP Slave Bridge - Exposes MQTT data as Modbus holding registers.
 * Subscribes to plant/# and maps topics to registers.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startModbusSlaveBridge = startModbusSlaveBridge;
exports.stopModbusSlaveBridge = stopModbusSlaveBridge;
const mqtt_1 = __importDefault(require("mqtt"));
const jsmodbus_1 = require("jsmodbus");
const net_1 = require("net");
const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const CONFIG_API_URL = process.env.CONFIG_API_URL || 'http://localhost:3000';
const DEFAULT_PORT = 5020;
const MAX_REGISTERS = 500;
let modbusServer = null;
let mqttClient = null;
const topicToRegister = new Map();
const registerValues = new Map();
let nextRegister = 0;
function getRegisterForTopic(topic) {
    let reg = topicToRegister.get(topic);
    if (reg === undefined && nextRegister < MAX_REGISTERS) {
        reg = nextRegister++;
        topicToRegister.set(topic, reg);
    }
    return reg ?? -1;
}
async function startModbusSlaveBridge() {
    const bridgeConfig = await fetchBridgeConfig('MODBUS_SLAVE');
    if (!bridgeConfig?.enabled) {
        console.log('[Modbus Bridge] Disabled');
        return;
    }
    const port = bridgeConfig.config?.port ?? DEFAULT_PORT;
    const holdingBuffer = Buffer.alloc(MAX_REGISTERS * 2);
    const inputBuffer = Buffer.alloc(MAX_REGISTERS * 2);
    const netServer = (0, net_1.createServer)();
    new jsmodbus_1.ModbusTCPServer(netServer, {
        holding: holdingBuffer,
        input: inputBuffer,
        coils: Buffer.alloc(256),
        discrete: Buffer.alloc(256),
    });
    netServer.listen(port, () => {
        console.log(`[Modbus Bridge] Slave listening on port ${port}`);
    });
    mqttClient = mqtt_1.default.connect(MQTT_URL);
    mqttClient.on('connect', () => {
        mqttClient.subscribe('plant/#', (err) => {
            if (err)
                console.error('[Modbus Bridge] Subscribe error:', err);
            else
                console.log('[Modbus Bridge] Subscribed to plant/#');
        });
    });
    mqttClient.on('message', (topic, payload) => {
        if (topic.endsWith('/set'))
            return;
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
        }
        catch {
            // ignore
        }
    });
    modbusServer = netServer;
}
async function fetchBridgeConfig(type) {
    try {
        const res = await fetch(`${CONFIG_API_URL}/api/connector/bridges`);
        if (!res.ok)
            return null;
        const bridges = await res.json();
        const bridge = bridges.find((b) => b.type === type);
        return bridge || null;
    }
    catch {
        return null;
    }
}
async function stopModbusSlaveBridge() {
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
