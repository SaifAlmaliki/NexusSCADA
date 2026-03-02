## ADDED Requirements

### Requirement: Upstream telemetry uses a consistent topic layout

The system SHALL use a consistent, documented topic layout for upstream telemetry (e.g. existing `plant/#` or equivalent). Telemetry payloads SHALL be attributable to site and hierarchy (site, area, line, equipment) as defined by the connector config.

#### Scenario: Telemetry is published on standard topics

- **WHEN** the edge publishes tag or meter values from the site
- **THEN** messages are published on the documented upstream telemetry topic pattern so the platform (e.g. Telegraf) can subscribe and ingest them

#### Scenario: Telemetry can be attributed to site and hierarchy

- **WHEN** the platform ingests upstream telemetry
- **THEN** it can determine site and optionally area/line/equipment from topic or payload for storage and querying

### Requirement: Edge publishes heartbeat or status for liveness

The system SHALL provide a dedicated upstream mechanism for edge liveness (heartbeat or status). The platform SHALL be able to detect that an edge is connected and optionally obtain a minimal status (e.g. timestamp, config revision).

#### Scenario: Platform can detect edge presence via heartbeat

- **WHEN** the edge is running and connected to the central broker
- **THEN** it periodically publishes a heartbeat or status message on a documented upstream status/heartbeat topic so the platform can detect presence

#### Scenario: Heartbeat or status uses documented topic and schema

- **WHEN** the edge publishes heartbeat or status
- **THEN** it uses the documented topic (e.g. `edge/{siteId}/status`) and payload schema (e.g. `ts`, `status`, optional `configRevision`) so the platform can parse and act on it consistently

### Requirement: Upstream channel is reliable within connectivity

The system SHALL use at least once delivery (e.g. MQTT QoS 1) for upstream telemetry and heartbeat where the platform must not miss messages, and SHALL document retry or reconnect behavior so the edge continues publishing after transient failures.

#### Scenario: Edge reconnects and resumes upstream after disconnect

- **WHEN** the edge loses connection to the central broker and then regains it
- **THEN** it resumes publishing telemetry and heartbeat according to the upstream contract without requiring manual intervention
