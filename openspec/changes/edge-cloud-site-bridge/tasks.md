## 1. Documentation and channel contracts

- [ ] 1.1 Add or update architecture doc: edge as bridge (upstream + downstream channels), one edge per site, identity by siteId (ISA-95 site scope)
- [ ] 1.2 Document upstream channel: telemetry topic layout (plant/#), status/heartbeat topic (e.g. edge/{siteId}/status), payload schema (ts, status, optional configRevision)
- [ ] 1.3 Document downstream channel: config topic (e.g. edge/{siteId}/config), ack topic (e.g. edge/{siteId}/ack), payload schema and correlation id for acks; config payload SHALL be the same as GET /api/connector/config response (ConnectorConfigDto) for DRY
- [ ] 1.4 Document edge env vars (EDGE_SITE_ID, MQTT_URL, CONFIG_API_URL) and optional EDGE_SITE_IDS in deployment/README

## 2. Shared edge topic helpers (DRY)

- [ ] 2.1 Add edge topic helpers in one place: e.g. lib/edge-topics.ts or lib/topic.ts with getEdgeStatusTopic(siteId), getEdgeConfigTopic(siteId), getEdgeAckTopic(siteId), getEdgeDownstreamSubscribeTopic(siteId) so platform and docs use the same names
- [ ] 2.2 Document the same topic pattern in connector docs (or shared types) so connector uses identical topic strings when it cannot import from app lib

## 3. Edge identity in connector

- [ ] 3.1 Ensure connector reads EDGE_SITE_ID (and optional EDGE_SITE_IDS) from env and uses it for upstream status and downstream subscription scope; align with ISA-95 site as scope
- [ ] 3.2 When connector has no EDGE_SITE_ID, document behavior (e.g. pull all sites’ config; no downstream subscribe or heartbeat scope) or require site id for bridge mode

## 4. Upstream: heartbeat and status in connector

- [ ] 4.1 Add periodic heartbeat/status publish using shared edge topic helper (e.g. edge/{siteId}/status) with payload ts, status (e.g. "online"), optional configRevision
- [ ] 4.2 Publish heartbeat only when MQTT client is connected; stop when disconnected
- [ ] 4.3 Use QoS 1 for heartbeat so platform can rely on at-least-once delivery for liveness

## 5. Downstream: subscribe and apply in connector (modular, reuse config shape)

- [ ] 5.1 Add MQTT subscribe to edge/{siteId}/config (and optionally edge/{siteId}/command) when EDGE_SITE_ID is set; use same topic name as platform (shared helper or documented constant)
- [ ] 5.2 On receiving config message, parse payload as ConnectorConfig (same shape as Config API response) and apply to in-memory config; trigger connector to use new config—no second schema
- [ ] 5.3 After applying config, publish ack to edge/{siteId}/ack with correlation id and success flag so platform can correlate
- [ ] 5.4 Handle duplicate config messages idempotently (e.g. by config revision or message id) so re-delivery does not cause incorrect state

## 6. Platform: downstream config push (reuse getConnectorConfig, parseSiteFilter)

- [ ] 6.1 Add API or internal path to trigger config push for a site: use parseSiteFilter (lib/connector-config) for siteId/siteIds and getConnectorConfig({ enabled: true, siteId }) to build payload; publish to getEdgeConfigTopic(siteId) so payload is identical to GET /api/connector/config response (DRY)
- [ ] 6.2 Use QoS 1 for downstream config publish so edge receives at least once
- [ ] 6.3 Optional: add subscriber or webhook for edge acks on edge/{siteId}/ack to update UI or audit log; document ack schema and correlation

## 7. Connector modularity

- [ ] 7.1 Structure connector into clear modules: config (load/apply from API or MQTT), upstream (telemetry + heartbeat), downstream (subscribe + apply + ack), resilience (reconnect + backoff) so each has a single responsibility and can be tested independently

## 8. Resilience: reconnect and backoff in connector

- [ ] 8.1 Implement exponential backoff (with configurable min/max delay) when MQTT connection fails or drops; document backoff parameters
- [ ] 8.2 On reconnect, resume heartbeat and telemetry publish and re-subscribe to downstream topics
- [ ] 8.3 Document resilience behavior (reconnect, backoff, no heartbeat when disconnected) in ops or architecture doc

## 9. Security and ACLs

- [ ] 9.1 Document broker ACL or auth model: only platform (service account) can publish to edge/{siteId}/config and edge/{siteId}/command; only edge (or site-scoped client) can publish to edge/{siteId}/ack and edge/{siteId}/status
- [ ] 9.2 Implement or document how connector authenticates to broker and how platform authenticates for downstream publish (e.g. credentials, TLS)

## 10. Integration and verification

- [ ] 10.1 Verify end-to-end: edge connects with EDGE_SITE_ID → heartbeat visible on edge/{siteId}/status → platform pushes config (same shape as GET config) → edge applies and acks on edge/{siteId}/ack
- [ ] 10.2 Verify resilience: disconnect broker → edge backs off and reconnects → heartbeat and telemetry resume
- [ ] 10.3 Update deployment guide (e.g. README-DEPLOY or architecture-edge-per-site) with bridge model, topic summary, env vars table, and reference to shared topic helpers and ISA-95 site scope
