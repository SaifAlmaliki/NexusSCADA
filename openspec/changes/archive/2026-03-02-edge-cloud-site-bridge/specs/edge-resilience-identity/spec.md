## ADDED Requirements

### Requirement: Edge has a stable identity in the platform and in MQTT

The system SHALL assign or allow configuration of a stable identity for each edge (at minimum the site it serves, e.g. `siteId`). This identity SHALL be used in MQTT topics (upstream and downstream) and SHALL be available to the platform so it can target and attribute traffic correctly.

#### Scenario: Edge identity is configured at deploy time

- **WHEN** an edge is deployed for a site
- **THEN** it is configured with the site identifier (and optionally a dedicated edge id) so that all upstream and downstream traffic uses that identity

#### Scenario: Platform can list or infer edges by site

- **WHEN** the platform needs to send downstream data or interpret upstream data
- **THEN** it can use the configured site (and optional edge) identity so that messages are routed and attributed correctly

### Requirement: Edge reconnects with backoff after connection loss

The system SHALL implement reconnection logic for the edge’s connection to the central broker (and optionally to the config API). Reconnection SHALL use exponential backoff (or equivalent) to avoid overwhelming the platform after outages. The behavior SHALL be documented so operators can reason about recovery time.

#### Scenario: Edge backs off on repeated connection failure

- **WHEN** the edge repeatedly fails to connect to the central broker
- **THEN** it increases delay between attempts (e.g. exponential backoff) up to a documented maximum so it does not hammer the broker

#### Scenario: Edge eventually reconnects when broker is available

- **WHEN** the central broker becomes available after an outage
- **THEN** the edge eventually establishes a connection and resumes upstream and downstream traffic according to the channel contracts

### Requirement: Edge publishes heartbeat only when connected

The system SHALL publish heartbeat or status only when the edge is connected to the central broker. When disconnected, the edge SHALL not publish; the platform SHALL infer absence of heartbeat as edge offline or unreachable.

#### Scenario: No heartbeat when disconnected

- **WHEN** the edge is not connected to the central broker
- **THEN** it does not publish heartbeat or status so the platform can correctly infer that the edge is offline

#### Scenario: Heartbeat resumes when reconnected

- **WHEN** the edge reconnects to the central broker
- **THEN** it resumes publishing heartbeat or status according to the upstream contract so the platform can detect that the edge is back online

### Requirement: Optional offline resilience is documented

The system MAY support optional local buffering (e.g. queue or store) at the edge for upstream telemetry when the edge is offline. If supported, the contract SHALL document flush-on-reconnect behavior, ordering, and any limits. If not supported in a given release, the system SHALL document that telemetry is only sent when connected.

#### Scenario: Optional buffer behavior is documented

- **WHEN** an implementation or operator needs to understand offline behavior
- **THEN** the documentation states whether the edge buffers telemetry when offline and how it flushes on reconnect, or that no buffer is used and telemetry is only sent when connected
