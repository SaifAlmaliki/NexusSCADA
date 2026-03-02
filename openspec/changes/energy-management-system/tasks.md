## 1. Data model and migration

- [x] 1.1 Add Prisma model for energy meter config (e.g. EnergyMeter: tagId, endpointId, meterType enum kWh/kW/power_factor, relation to ConnectorTag/ConnectorEndpoint)
- [x] 1.2 Add Prisma migration and run it; verify schema in database

## 2. Energy meter configuration API and UI

- [x] 2.1 Add API route to list energy meters (GET) with optional filter by siteId, areaId, lineId; return tag + endpoint hierarchy + meterType
- [x] 2.2 Add API route to create energy meter (POST): validate tag exists and belongs to endpoint, validate meterType, persist EnergyMeter
- [x] 2.3 Add API route to delete energy meter (DELETE) by id
- [x] 2.4 Add connector config API support so Telegraf or connector can know which tags are energy meters (e.g. extend /api/connector/config response or add /api/connector/energy-meters)
- [x] 2.5 Add settings UI to designate connector tags as energy meters (select tag, select meter type, save); list and remove existing energy meters

## 3. Telegraf and InfluxDB energy schema

- [x] 3.1 Document canonical MQTT topic pattern for endpoints with energy meters (e.g. plant/{site}/{area}/{line}/{equipment}/{tag}) and ensure connector uses it for energy endpoints or add topic template in config
- [x] 3.2 Add Telegraf processor to parse MQTT topic into tags (site, area, line, equipment) and filter to only messages for configured energy meters (e.g. from API or allowlist topic)
- [x] 3.3 Add Telegraf output or processor that writes to InfluxDB measurement `energy` with tags site, area, line, equipment, meter_type and field value; use existing historian bucket
- [x] 3.4 Provide way for Telegraf to get list of energy meter topics or tag ids (e.g. config file generated from API, or HTTP input); implement chosen approach

## 4. Energy analytics API

- [x] 4.1 Add InfluxDB client dependency and env vars (URL, token, org, bucket) for Next.js API
- [x] 4.2 Add GET /api/energy/consumption: query params start, end (required), level (line|area|site|multi-plant), siteId, areaId, lineId (optional); run Flux query, return time series or aggregates
- [x] 4.3 Add GET /api/energy/meters: optional query params siteId, areaId, lineId; return list of energy meters with hierarchy for dashboard selectors
- [x] 4.4 Apply authorization to energy API (filter by user's site or role so results only include allowed hierarchy)

## 5. Energy dashboard UI

- [x] 5.1 Add route /energy (or /dashboard/energy) with layout and hierarchy selector (site / area / line / multi-plant)
- [x] 5.2 Add time range selector (presets: last 24h, 7d, 30d; optional custom range) and wire to energy consumption API
- [x] 5.3 Add trend chart (energy over time) for selected scope and time range using consumption API
- [x] 5.4 Add comparison view (e.g. by line within area or by site in multi-plant) with chart or table
- [x] 5.5 Wire dashboard to use energy meters API for hierarchy options and ensure empty states and loading states are handled

## 6. Integration and docs

- [x] 6.1 Verify end-to-end: configure energy meter → connector publishes → Telegraf writes to InfluxDB `energy` → dashboard shows data for selected scope and time range
- [x] 6.2 Document topic template and Telegraf config for energy in README or ops doc; note any env vars for InfluxDB and energy API
