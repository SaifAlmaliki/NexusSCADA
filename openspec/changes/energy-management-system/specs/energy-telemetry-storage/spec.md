## ADDED Requirements

### Requirement: Energy telemetry is written to InfluxDB as time series

The system SHALL write all energy meter telemetry to InfluxDB as time series with a consistent measurement name (e.g. `energy`) and SHALL include tags that identify site, area, line, equipment, and meter type so that data can be queried and aggregated by hierarchy.

#### Scenario: New energy reading is stored with hierarchy tags

- **WHEN** a value is published for a tag that is configured as an energy meter
- **THEN** the value is written to InfluxDB in the designated energy measurement with tags for site, area, line, equipment, and meter type

#### Scenario: Non-energy tag data is unchanged

- **WHEN** a value is published for a tag that is not configured as an energy meter
- **THEN** existing pipeline behavior is unchanged (e.g. existing MQTT/Telegraf path); no duplicate or different write is required for energy

#### Scenario: Queries can aggregate by hierarchy level

- **WHEN** a client queries InfluxDB for energy data by time range and by site, area, line, or equipment
- **THEN** the tag schema supports filtering and grouping by those dimensions so that line-level, area-level, site-level, and multi-plant aggregations are possible

### Requirement: Ingestion uses the existing connector–MQTT–Telegraf pipeline

The system SHALL use the existing connector → MQTT → Telegraf → InfluxDB pipeline for energy telemetry. It SHALL NOT require the connector to publish to a separate backend; enrichment (e.g. hierarchy tags, measurement name) SHALL be achieved via Telegraf configuration (e.g. topic parsing, processors) or a minimal, defined extension.

#### Scenario: Connector continues to publish to existing topic

- **WHEN** the connector publishes tag values to MQTT
- **THEN** the same topic/payload format can be used; energy-specific storage is handled downstream (Telegraf/InfluxDB)

#### Scenario: Telegraf writes energy to correct measurement and tags

- **WHEN** Telegraf processes a message for a tag that is configured as an energy meter (e.g. via topic allowlist or config-driven filter)
- **THEN** Telegraf writes a point to the energy measurement with the required tags derived from topic or config
