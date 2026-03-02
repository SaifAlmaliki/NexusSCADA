## ADDED Requirements

### Requirement: Edge is the single bridge between platform and site

The system SHALL treat the edge as the single, first-class bridge between the platform (cloud) and the site. All platform–site interaction SHALL flow through the edge; there SHALL be exactly two logical channels: upstream (site→cloud) and downstream (cloud→site).

#### Scenario: All site telemetry reaches platform via edge

- **WHEN** a site produces telemetry (e.g. from PLCs or energy meters)
- **THEN** that telemetry reaches the platform only by being sent through the edge (e.g. connector publishing to central MQTT)

#### Scenario: All platform-to-site traffic reaches site via edge

- **WHEN** the platform sends config, commands, or other data to a site
- **THEN** that data reaches the site only by being delivered through the edge (e.g. edge subscribed to downstream MQTT topics)

### Requirement: Upstream and downstream channels are explicitly defined

The system SHALL define and document an **upstream channel** (site→cloud) for telemetry, heartbeat, and status, and a **downstream channel** (cloud→site) for config updates, optional commands, and acknowledgments. Each channel SHALL have a clear contract (topics, payload schema, and semantics).

#### Scenario: Upstream contract is documented and used

- **WHEN** an implementation publishes upstream data (telemetry or status)
- **THEN** it uses the documented topic layout and payload schema for the upstream channel

#### Scenario: Downstream contract is documented and used

- **WHEN** the platform sends data to an edge or the edge consumes data from the platform
- **THEN** it uses the documented topic layout and payload schema for the downstream channel

### Requirement: Edge identity is scoped by site

The system SHALL associate each edge with at least one site identifier (e.g. `siteId`). Edge identity SHALL be used to route downstream traffic to the correct edge and to attribute upstream traffic to the correct site. Edge identity and scoping SHALL follow ISA-95: site is the top-level scope for the bridge; reuse of existing hierarchy types and site-scoping utilities (e.g. parseSiteFilter, HierarchyScope) is required where applicable to keep the implementation DRY and consistent.

#### Scenario: Downstream messages target edge by site

- **WHEN** the platform sends config or commands to a site
- **THEN** the message is addressed using the site (or edge) identifier so only the edge for that site processes it

#### Scenario: Upstream messages identify site

- **WHEN** the edge publishes telemetry or status
- **THEN** the payload or topic includes the site (or edge) identifier so the platform can attribute the data to the correct site

#### Scenario: Site-scoped APIs reuse hierarchy utilities

- **WHEN** the platform implements site-scoped operations (e.g. config push by siteId)
- **THEN** it reuses existing site filter and hierarchy utilities (e.g. parseSiteFilter, getConnectorConfig with site filter) so behavior is consistent and DRY

### Requirement: Config and channel contracts reuse shared types and single config shape

The system SHALL use a single connector config shape for both API response and downstream push payload (e.g. ConnectorConfigDto / ConnectorConfig). Edge topic names (status, config, ack) SHALL be defined in one place (shared helpers or documented constants) so platform and connector do not duplicate topic strings. Telemetry topic layout SHALL reuse existing plant/ hierarchy patterns (e.g. resolveTopic, ISA-95 hierarchy names) where applicable.

#### Scenario: Push config payload matches GET config response

- **WHEN** the platform pushes config to an edge via the downstream channel
- **THEN** the payload is the same structure as the response of GET /api/connector/config (same DTO) so the edge can apply it without a second parser or schema

#### Scenario: Edge topics come from a single source of truth

- **WHEN** the platform or connector publishes or subscribes to edge topics (status, config, ack)
- **THEN** topic names are produced by shared helpers or documented constants so there is no duplication or drift between platform and connector
