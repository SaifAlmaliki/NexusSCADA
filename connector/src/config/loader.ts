/**
 * Config loader for the industrial connector.
 * Fetches configuration from the API or uses simulation defaults.
 */

export interface ConnectorTagConfig {
  id: string;
  sourceId: string;
  mqttTopic: string;
  name: string;
  dataType?: string;
  writable: boolean;
  unit?: string;
}

export interface ConnectorEndpointConfig {
  id: string;
  name: string;
  protocol: 'OPC_UA' | 'MODBUS_TCP' | 'S7';
  config: Record<string, unknown>;
  pollingInterval: number;
  hierarchy: {
    siteId: string;
    siteName: string;
    areaId?: string;
    areaName: string;
    lineId?: string;
    lineName: string;
    equipmentId?: string;
    equipmentName: string;
  };
  tags: ConnectorTagConfig[];
}

export interface ConnectorConfig {
  endpoints: ConnectorEndpointConfig[];
}

const CONFIG_API_URL = process.env.CONFIG_API_URL || 'http://localhost:3000';
const CONFIG_POLL_INTERVAL_MS = parseInt(process.env.CONFIG_POLL_INTERVAL_MS || '60000', 10);

/**
 * Build config API URL with optional site scope (edge-per-site).
 * EDGE_SITE_ID takes precedence over EDGE_SITE_IDS if both are set.
 */
export function getConfigUrl(): string {
  const base = `${CONFIG_API_URL}/api/connector/config`;
  const siteId = process.env.EDGE_SITE_ID?.trim();
  const siteIds = process.env.EDGE_SITE_IDS?.trim();
  if (siteId) {
    return `${base}?siteId=${encodeURIComponent(siteId)}`;
  }
  if (siteIds) {
    const ids = siteIds.split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length > 0) {
      return `${base}?siteIds=${ids.map((id) => encodeURIComponent(id)).join(',')}`;
    }
  }
  return base;
}

/**
 * Resolve MQTT topic from template.
 * Template vars: {site}, {area}, {line}, {equipment}, {tag}
 */
export function resolveTopic(
  template: string,
  hierarchy: ConnectorEndpointConfig['hierarchy'],
  tagName: string
): string {
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
 * Uses getConfigUrl() so edge can pass EDGE_SITE_ID or EDGE_SITE_IDS for site-scoped config.
 */
export async function fetchConfig(): Promise<ConnectorConfig> {
  const url = getConfigUrl();
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch config: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data as ConnectorConfig;
}

/**
 * Load config with retry. Returns simulation config if API fails and SIMULATION_MODE is true.
 */
export async function loadConfig(): Promise<ConnectorConfig> {
  const simulationMode = process.env.SIMULATION_MODE === 'true';

  try {
    const config = await fetchConfig();
    if (config.endpoints && config.endpoints.length > 0) {
      return config;
    }
  } catch (err) {
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
function getSimulationConfig(): ConnectorConfig {
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
export function startConfigPolling(
  onConfig: (config: ConnectorConfig) => void
): () => void {
  let intervalId: NodeJS.Timeout | null = null;

  const poll = async () => {
    try {
      const config = await fetchConfig();
      onConfig(config);
    } catch (err) {
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
