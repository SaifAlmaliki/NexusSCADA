## Context

The platform already has an ISA-95 hierarchy (Site → Area → Line → Equipment) in PostgreSQL, connector endpoints (OPC UA, Modbus TCP, S7) that publish tag values to MQTT (`plant/#`), and Telegraf subscribing to MQTT and writing to InfluxDB v2 (bucket `historian`, org `nexus-corp`). Connector config is loaded from the Next.js API; each endpoint has an optional link to site/area/line/equipment and tags with `sourceId`, `mqttTopic`, `name`, `unit`. There is no concept of "energy meter" today—no way to mark a tag as kWh/kW or to query InfluxDB by hierarchy for energy-only data. Stakeholders are operations and site managers who need a single dashboard to see consumption by line, section, plant, and multi-plant.

## Goals / Non-Goals

**Goals:**

- Allow configuration of which connector tags are energy meters (e.g. kWh, kW, power factor) and ensure their hierarchy (site/area/line/equipment) is known and used for storage and queries.
- Store all energy telemetry as time series in InfluxDB with a consistent schema (measurement + tags for hierarchy and meter type) so aggregations by line/area/site and multi-plant are straightforward.
- Reuse the existing connector → MQTT → Telegraf → InfluxDB pipeline; extend it only where needed (e.g. tagging, optional dedicated measurement/bucket).
- Deliver an energy dashboard with comprehensive view: consumption by line, by section (area), by plant (site), and multi-plant rollups, with time range selection and visualizations (trends, comparisons).
- Expose an API (or query layer) that aggregates energy data from InfluxDB by time range and hierarchy level to power the dashboard and future reports.

**Non-Goals:**

- Real-time control or setpoints for energy (read-only analytics and visualization).
- Replacing or duplicating the existing historian for non-energy tags; energy is an additional view on top of the same pipeline.
- Billing or cost allocation (currency); focus is consumption (kWh, kW) and visualization.
- Predictive ML or advanced forecasting in this change.

## Decisions

1. **Energy meter configuration in PostgreSQL**
   - **Decision**: Add a small config model (e.g. `EnergyMeter` or a flag + type on `ConnectorTag`) that links a connector tag to a meter kind (kWh, kW, power factor, etc.) and inherits hierarchy from the tag’s endpoint (site/area/line/equipment).
   - **Rationale**: Hierarchy is already on `ConnectorEndpoint`; we only need to mark which tags are energy and their metric type. A separate table keeps connector schema clean and allows multiple meter types per tag if needed later.
   - **Alternatives**: Store in JSON on endpoint config (harder to query and validate); add an enum + columns on ConnectorTag (simpler but mixes concerns).

2. **InfluxDB schema for energy**
   - **Decision**: Use a dedicated measurement name (e.g. `energy`) and tag keys `site`, `area`, `line`, `equipment`, `meter_type` (e.g. `kwh`, `kw`), and optionally `tag_id`/`endpoint_id` for traceability. Value field(s) hold the numeric reading. Use the existing `historian` bucket unless retention or cardinality demands a separate bucket.
   - **Rationale**: Single measurement with tags keeps Flux queries simple (filter by tags, aggregate by time and hierarchy). Reusing the same bucket avoids extra Telegraf outputs and token management.
   - **Alternatives**: Separate bucket for energy (clearer separation but more config and tokens); reuse generic MQTT measurement and filter by tag (possible but no explicit hierarchy tags today).

3. **How energy payloads get hierarchy tags in InfluxDB**
   - **Decision**: Enrich in the API when serving connector config: either (a) connector publishes to a dedicated energy topic that includes hierarchy in the payload, or (b) Telegraf uses a processor to add tags from topic parsing. Prefer (b) with a consistent topic pattern (e.g. `plant/{site}/{area}/{line}/{equipment}/{tag}`) so Telegraf can parse and tag without the API publishing a second stream. Only tags that are configured as energy meters are written to the `energy` measurement (via Telegraf filter or a separate MQTT topic for energy-only).
   - **Rationale**: Single source of truth (connector); no duplicate publish. Topic already exists; we can add a processor to duplicate selected messages into an energy measurement with parsed tags.
   - **Alternatives**: API subscribes to MQTT and writes to InfluxDB (adds latency and coupling); connector publishes twice (once generic, once energy) — more logic in connector.

4. **API layer for energy analytics**
   - **Decision**: Add Next.js API routes (e.g. `/api/energy/consumption`, `/api/energy/meters`) that use the InfluxDB JS client to run Flux queries. Parameters: time range, hierarchy level (line | area | site | multi-plant), and optional filters (siteId, areaId, lineId). Return aggregated time series and optionally list of meters/config.
   - **Rationale**: Keeps Flux and InfluxDB details server-side; frontend stays simple. Fits existing Next.js API pattern.
   - **Alternatives**: Direct Flux from frontend (would require exposing InfluxDB token to browser — not acceptable); separate Bun/Node service (unnecessary if Next.js API can run the queries).

5. **Dashboard tech**
   - **Decision**: Build the energy dashboard as a new route under the existing Next.js app (e.g. `/energy` or `/dashboard/energy`), using the same UI stack (React, existing charts/layout patterns if any). Use the new energy API for all data.
   - **Rationale**: Single app, consistent auth and navigation. Reuse existing design system and realtime patterns if needed later.
   - **Alternatives**: Standalone app (more deployment and auth overhead); embed third-party BI (cost and integration complexity).

## Risks / Trade-offs

- **Telegraf topic parsing**: If topic structure is not consistent (e.g. optional area/line), parsing may be brittle. Mitigation: Define a canonical topic template for endpoints that have energy meters and document it; validate in config API.
- **InfluxDB cardinality**: Many sites/lines/equipment × many tags can increase cardinality. Mitigation: Use a single measurement and limit tag values to known hierarchy IDs/names; avoid high-cardinality fields as tags.
- **Backfill**: Existing MQTT data in InfluxDB may not have `energy` measurement or hierarchy tags. Mitigation: No backfill required for MVP; new data (after config and Telegraf update) is sufficient. Optionally document a one-off backfill if historical energy data is needed later.
- **AuthZ**: Energy API must respect site/area visibility (e.g. restrict by user’s site). Mitigation: Apply same authorization as other dashboard APIs (e.g. filter by user’s siteId where applicable).

## Migration Plan

1. **Deploy order**: (1) Prisma migration for energy meter config; (2) Config API and UI to manage energy meters; (3) Telegraf config update (processor + output or filter) to write `energy` measurement with tags; (4) Energy analytics API; (5) Energy dashboard UI.
2. **Rollback**: Disable Telegraf processor/output for `energy` to stop new writes; leave InfluxDB data as-is. Revert app and Prisma migration if needed; no destructive change to existing historian data.
3. **Feature flag**: Optional: gate dashboard route behind a feature flag until ready for all users.

## Open Questions

- Exact topic template for all endpoints (e.g. always `plant/{site}/{area}/{line}/{equipment}/{tag}` vs optional segments): confirm with connector team and document.
- Whether to support multiple meter types per tag (e.g. same register as kWh and kW) in config or one type per tag only for v1.
