"use strict";
/**
 * Config loader for the industrial connector.
 * Fetches configuration from the API or uses simulation defaults.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTopic = resolveTopic;
exports.fetchConfig = fetchConfig;
exports.loadConfig = loadConfig;
exports.startConfigPolling = startConfigPolling;
const CONFIG_API_URL = process.env.CONFIG_API_URL || 'http://localhost:3000';
const CONFIG_POLL_INTERVAL_MS = parseInt(process.env.CONFIG_POLL_INTERVAL_MS || '60000', 10);
/**
 * Resolve MQTT topic from template.
 * Template vars: {site}, {area}, {line}, {equipment}, {tag}
 */
function resolveTopic(template, hierarchy, tagName) {
    const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return template
        .replace(/\{site\}/g, hierarchy.siteName.toLowerCase().replace(/[^a-z0-9]/g, '_'))
        .replace(/\{area\}/g, hierarchy.areaName.toLowerCase().replace(/[^a-z0-9]/g, '_'))
        .replace(/\{line\}/g, hierarchy.lineName.toLowerCase().replace(/[^a-z0-9]/g, '_'))
        .replace(/\{equipment\}/g, hierarchy.equipmentName.toLowerCase().replace(/[^a-z0-9]/g, '_'))
        .replace(/\{tag\}/g, tagSlug);
}
/**
 * Fetch config from API.
 */
async function fetchConfig() {
    const url = `${CONFIG_API_URL}/api/connector/config`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch config: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data;
}
/**
 * Load config with retry. Returns simulation config if API fails and SIMULATION_MODE is true.
 */
async function loadConfig() {
    const simulationMode = process.env.SIMULATION_MODE === 'true';
    try {
        const config = await fetchConfig();
        if (config.endpoints && config.endpoints.length > 0) {
            return config;
        }
    }
    catch (err) {
        console.warn('[Config] Failed to fetch from API:', err);
        if (!simulationMode) {
            throw err;
        }
    }
    if (simulationMode) {
        console.log('[Config] Using simulation defaults (no endpoints from API)');
        return getSimulationConfig();
    }
    return { endpoints: [] };
}
/**
 * Get simulation config for preview/demo when no real config exists.
 */
function getSimulationConfig() {
    return {
        endpoints: [
            {
                id: 'sim-opcua',
                name: 'Simulation OPC UA',
                protocol: 'OPC_UA',
                config: {},
                pollingInterval: 2000,
                hierarchy: {
                    siteId: 'sim',
                    siteName: 'plant',
                    areaName: 'default',
                    lineName: 'default',
                    equipmentName: 'reactor1',
                },
                tags: [
                    { id: 't1', sourceId: 'T101', mqttTopic: 'plant/{site}/{equipment}/{tag}', name: 'T101', writable: false, unit: '°C' },
                    { id: 't2', sourceId: 'P101', mqttTopic: 'plant/{site}/{equipment}/{tag}', name: 'P101', writable: false, unit: 'bar' },
                ],
            },
            {
                id: 'sim-modbus',
                name: 'Simulation Modbus',
                protocol: 'MODBUS_TCP',
                config: {},
                pollingInterval: 2000,
                hierarchy: {
                    siteId: 'sim',
                    siteName: 'plant',
                    areaName: 'default',
                    lineName: 'default',
                    equipmentName: 'reactor1',
                },
                tags: [
                    { id: 't3', sourceId: 'L101', mqttTopic: 'plant/{site}/{equipment}/{tag}', name: 'L101', writable: false, unit: '%' },
                    { id: 't4', sourceId: 'F101', mqttTopic: 'plant/{site}/{equipment}/{tag}', name: 'F101', writable: false, unit: 'L/h' },
                ],
            },
            {
                id: 'sim-s7',
                name: 'Simulation S7',
                protocol: 'S7',
                config: {},
                pollingInterval: 2000,
                hierarchy: {
                    siteId: 'sim',
                    siteName: 'plant',
                    areaName: 'default',
                    lineName: 'default',
                    equipmentName: 'reactor1',
                },
                tags: [
                    { id: 't5', sourceId: 'S101', mqttTopic: 'plant/{site}/{equipment}/{tag}', name: 'S101', writable: false, unit: 'RPM' },
                ],
            },
        ],
    };
}
/**
 * Start config polling for hot-reload. Returns a function to stop polling.
 */
function startConfigPolling(onConfig) {
    let intervalId = null;
    const poll = async () => {
        try {
            const config = await fetchConfig();
            onConfig(config);
        }
        catch (err) {
            console.warn('[Config] Poll failed:', err);
        }
    };
    intervalId = setInterval(poll, CONFIG_POLL_INTERVAL_MS);
    console.log(`[Config] Polling every ${CONFIG_POLL_INTERVAL_MS}ms`);
    return () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };
}
