# Edge as bridge (cloud ↔ site)

The edge acts as the **bridge** between the platform (cloud) and the site: all platform–site interaction flows through the edge over two channels. Identity is scoped by **ISA-95 site** (one edge per site; optional multi-site via `EDGE_SITE_IDS`).

## Bridge model

- **One edge per site** (Option A): One connector instance per physical site; no local MQTT broker at the edge. The edge connects to local devices and to the central MQTT broker.
- **Two channels**:
  - **Upstream (site → cloud)**: Telemetry (`plant/#`) and heartbeat/status (`edge/{siteId}/status`).
  - **Downstream (cloud → site)**: Config and optional commands (`edge/{siteId}/config`, `edge/{siteId}/command`); acks from edge (`edge/{siteId}/ack`).
- **Identity**: Each edge is identified by at least `siteId` (ISA-95). Topic names and config push use this id so the platform can target the correct edge.

See also: [architecture-edge-per-site.md](architecture-edge-per-site.md), [architecture-vs-fi2-connectivity.md](architecture-vs-fi2-connectivity.md).

---

## Upstream channel (site → cloud)

### Telemetry

- **Topic layout**: Existing `plant/#` pattern. Topics are built from connector config and hierarchy (e.g. `plant/{site}/{area}/{line}/{equipment}/{tag}`). See [energy-mqtt-topics.md](energy-mqtt-topics.md) for the canonical template.
- **Payload**: Tag values published by the connector; format is connector-specific (e.g. JSON with value, timestamp, unit).

### Heartbeat / status

- **Topic**: `edge/{siteId}/status`  
  Use the shared helper `getEdgeStatusTopic(siteId)` from `lib/edge-topics.ts` so platform and connector use the same name.
- **Payload schema** (JSON):
  - `ts` (string, ISO 8601): Timestamp when the status was emitted.
  - `status` (string): e.g. `"online"`.
  - `configRevision` (optional, string or number): Revision or hash of last applied config for correlation.
- **QoS**: 1 (at-least-once) so the platform can rely on liveness.
- **When**: Published only when the edge is connected to the central broker; stopped when disconnected.

---

## Downstream channel (cloud → site)

### Config push

- **Topic**: `edge/{siteId}/config`  
  Use `getEdgeConfigTopic(siteId)` from `lib/edge-topics.ts`.
- **Payload**: Same shape as the response of `GET /api/connector/config` (i.e. `ConnectorConfigDto`). No second schema; the edge applies it as it would config from the API.
- **QoS**: 1 so the edge does not miss updates.
- **Correlation**: Optional `messageId` or `requestId` in the payload so the edge can echo it in the ack.

### Commands (optional)

- **Topic**: `edge/{siteId}/command`  
  Use `getEdgeCommandTopic(siteId)` from `lib/edge-topics.ts`. Optional in v1.

### Acks

- **Topic**: `edge/{siteId}/ack`  
  Use `getEdgeAckTopic(siteId)` from `lib/edge-topics.ts`.
- **Payload schema** (JSON):
  - `requestId` or `messageId` (string): Matches the config/command message being acknowledged.
  - `success` (boolean): Whether apply succeeded.
  - `error` (optional, string): Error message if `success` is false.
  - `ts` (string, ISO 8601): Time of ack.

---

## Edge environment variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MQTT_URL` | Central broker URL (platform) | `mqtt://platform-host:1883` |
| `CONFIG_API_URL` | Platform API base URL | `http://platform-host:3000` |
| `EDGE_SITE_ID` | (Optional) Site UUID this edge serves; used for heartbeat topic and downstream subscription | UUID from Settings → Plants & Units |
| `EDGE_SITE_IDS` | (Optional) Comma-separated site UUIDs if one edge serves multiple sites | `uuid1,uuid2` |

When `EDGE_SITE_ID` (or `EDGE_SITE_IDS`) is not set: the connector pulls config for all sites (no filter); it does **not** subscribe to downstream topics or publish heartbeat (bridge downstream/heartbeat behavior is disabled). When set, the edge uses these ids for upstream status and downstream subscription scope (ISA-95 site scope).

Full deployment table: [architecture-vs-fi2-connectivity.md#6-deployment-edge-per-site--central-uns](architecture-vs-fi2-connectivity.md#6-deployment-edge-per-site--central-uns).

---

## Topic constants (for connector)

When the connector cannot import from the app (e.g. runs in a separate package), use these exact topic patterns so they stay in sync with the platform:

| Purpose | Pattern | Example (siteId = `abc-123`) |
|---------|---------|-------------------------------|
| Status (heartbeat) | `edge/{siteId}/status` | `edge/abc-123/status` |
| Config (downstream) | `edge/{siteId}/config` | `edge/abc-123/config` |
| Command (downstream) | `edge/{siteId}/command` | `edge/abc-123/command` |
| Ack (from edge) | `edge/{siteId}/ack` | `edge/abc-123/ack` |
| Subscribe all downstream | `edge/{siteId}/#` | `edge/abc-123/#` |

Platform uses `lib/edge-topics.ts` (getEdgeStatusTopic, getEdgeConfigTopic, getEdgeAckTopic, getEdgeDownstreamSubscribeTopic); connector should use the same strings.

---

## Resilience (connector)

- **Reconnect and backoff**: Connector uses exponential backoff when the MQTT connection is lost. Env vars: `BACKOFF_MIN_MS` (default 1000), `BACKOFF_MAX_MS` (default 60000). Delay = min(BACKOFF_MAX_MS, BACKOFF_MIN_MS * 2^(attempt-1)). On successful connect, attempt is reset.
- **Heartbeat only when connected**: Heartbeat is published only while the client is connected; it is stopped on disconnect and resumed automatically on reconnect (with downstream re-subscribe).

---

## Security and ACLs

- **Broker ACL model**: Only the platform (service account) should be allowed to publish to `edge/{siteId}/config` and `edge/{siteId}/command`. Only the edge (or site-scoped client) should publish to `edge/{siteId}/ack` and `edge/{siteId}/status`. Configure broker ACLs (e.g. MonsterMQ) accordingly so edges cannot publish config to other sites and the platform is the only publisher to downstream topics.
- **Authentication**: Connector authenticates to the broker via `MQTT_URL` (credentials in URL or separate auth). Platform uses `MQTT_URL` (or equivalent) for downstream publish; use TLS in production.

---

## Ack schema (downstream)

Edge acks on `edge/{siteId}/ack` with JSON: `requestId` (matches config message), `success` (boolean), `error` (optional string), `ts` (ISO 8601). Platform can subscribe to `edge/+/ack` to correlate and log; optional for v1.
