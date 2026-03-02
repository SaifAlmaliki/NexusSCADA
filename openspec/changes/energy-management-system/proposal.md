## Why

Operators and site managers need a single place to see how much energy is consumed at every level of the plant hierarchy—by line, section, plant, and across multiple plants—so they can optimize usage, spot anomalies, and meet sustainability targets. Today, meter data may be available through existing connectors (OPC UA, Modbus, S7) but there is no dedicated energy model, no structured storage of energy telemetry as time series, and no dashboard to analyze and visualize consumption. This change adds a comprehensive energy management system that uses the platform’s connectors to feed energy meters, stores all telemetry as time series in InfluxDB, and provides a dashboard for analysis and visualization.

## What Changes

- **Energy meter configuration**: Ability to designate connector tags (from existing ConnectorEndpoint/ConnectorTag) as energy meters (e.g. kWh, kW, power factor) and associate them with the ISA-95 hierarchy (equipment, line, area, site).
- **Energy telemetry as time series**: All energy-related telemetry is written to InfluxDB (existing historian bucket or dedicated energy bucket) with consistent measurement/tag schema so it can be queried by site, area, line, and equipment.
- **Ingestion path**: Use the existing connector → MQTT → Telegraf → InfluxDB pipeline for energy tags; optionally add tagging/routing so energy metrics are clearly identifiable and queryable by hierarchy.
- **Energy dashboard**: A dedicated dashboard that provides a comprehensive view of consumption: by line, by section (area), by plant (site), and multi-plant rollups, with time range selection and basic visualizations (e.g. trends, comparisons).
- **Analytics and visualization**: APIs or query layer to aggregate energy data from InfluxDB (e.g. by time range, by hierarchy level) and power the dashboard and any future reports.

## Capabilities

### New Capabilities

- `energy-meter-config`: Configure which connector tags represent energy meters (kWh, kW, etc.) and link them to equipment/line/area/site so telemetry can be stored and aggregated by hierarchy.
- `energy-telemetry-storage`: InfluxDB schema and ingestion for energy time series (measurement naming, tags for site/area/line/equipment), ensuring all energy telemetry is stored as time series and can be queried consistently.
- `energy-dashboard`: Dashboard UI for energy consumption with comprehensive view: per-line, per-section (area), per-plant (site), and multi-plant; time range selection; and visualizations (e.g. time series, comparisons).
- `energy-analytics-api`: API or query layer to aggregate energy data from InfluxDB by time range and hierarchy level (line, section, plant, multi-plant) for dashboard and visualization.

### Modified Capabilities

- (none)

## Impact

- **Data model**: New or extended Prisma models (or config) for energy meter mapping (tag → meter type, hierarchy). Possible new InfluxDB bucket or measurement naming for energy.
- **Connector pipeline**: Existing connector → MQTT → Telegraf → InfluxDB flow is reused; Telegraf/processor config may be updated so energy payloads get the right measurement and tags (site, area, line, equipment).
- **Backend**: New or extended API routes to query InfluxDB for energy aggregates (by time range, by line/area/site) and to read/write energy meter configuration.
- **Frontend**: New energy dashboard route and components; possibly reuse or extend existing SCADA/realtime patterns for charts and hierarchy navigation.
- **Dependencies**: InfluxDB client in the API (if not already present) for querying time series; no change to connector protocols (OPC UA, Modbus, S7).
