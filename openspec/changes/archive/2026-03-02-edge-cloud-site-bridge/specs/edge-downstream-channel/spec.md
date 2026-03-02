## ADDED Requirements

### Requirement: Downstream channel delivers config and optional commands to the edge

The system SHALL provide a downstream channel (cloud→site) over which the platform can send config updates and optional commands to the edge. The edge SHALL subscribe to downstream topics scoped to its identity (e.g. by siteId) and SHALL apply or process received messages according to the documented contract.

#### Scenario: Platform can push config to edge via downstream

- **WHEN** the platform has updated config for a site and wishes to push it to the edge
- **THEN** it publishes a config message to the documented downstream config topic (e.g. `edge/{siteId}/config`) so the edge can receive and apply it without waiting for the next pull

#### Scenario: Edge subscribes only to its downstream topics

- **WHEN** the edge connects to the central broker
- **THEN** it subscribes to downstream topics that are scoped to its site (or edge) identity so it does not receive messages intended for other sites

### Requirement: Edge acknowledges downstream config or commands when required

The system SHALL allow the edge to send an acknowledgment (ack) for config or commands when the contract requires it. The platform SHALL be able to use acks to confirm that the edge has received and optionally applied the update.

#### Scenario: Edge acks config after apply

- **WHEN** the edge receives and successfully applies a config update from the downstream channel
- **THEN** it publishes an ack (e.g. on `edge/{siteId}/ack`) with sufficient information (e.g. request id, success, optional revision) so the platform can correlate and confirm delivery

#### Scenario: Platform can correlate ack to original message

- **WHEN** the platform receives an ack from the edge
- **THEN** it can associate the ack with the original config or command (e.g. via request id or correlation id in the contract) so it knows which update was applied

### Requirement: Downstream uses at-least-once delivery where needed

The system SHALL use at-least-once delivery (e.g. MQTT QoS 1) for downstream config and commands so the edge does not miss critical updates when connectivity is stable. The contract SHALL document idempotency or deduplication expectations if the same update may be delivered more than once.

#### Scenario: Config message is delivered at least once

- **WHEN** the platform publishes a config update on the downstream channel
- **THEN** the broker delivers the message to the subscribed edge at least once (subject to broker and QoS configuration)

#### Scenario: Edge handles duplicate delivery safely

- **WHEN** the edge receives a config or command it has already applied (e.g. duplicate delivery)
- **THEN** it applies idempotent semantics (e.g. same revision or request id) so that applying again does not cause incorrect state
