# Edge-per-site → central UNS

**Architecture: Option A (connector-only).** One **edge connector per physical site** connects directly to that site's machines and energy meters and publishes to a **single central MQTT broker (UNS)** in the platform. There is **no local MQTT broker at the edge**; the connector is the only edge component and it publishes straight to the central broker. All implementation follows this model.

## Deployment

| Role | What runs | Notes |
|------|-----------|--------|
| **Platform** | Central MQTT (MonsterMQ), Next.js API, Postgres, InfluxDB, Telegraf, UI | Single deployment. Connectors run at sites, not here. |
| **Edge** | Connector only | One instance per site. Set `MQTT_URL` and `CONFIG_API_URL` to the platform. Optionally set `EDGE_SITE_ID` so the connector only pulls config for that site. |

**Edge env vars:** See [architecture-vs-fi2-connectivity.md](architecture-vs-fi2-connectivity.md#6-deployment-edge-per-site--central-uns) (same table kept in one place to avoid drift).

## Data flow

- Site A: devices → Edge A → central MQTT (platform)
- Site B: devices → Edge B → central MQTT (platform)
- Platform: central MQTT → Telegraf → InfluxDB; Config API ← Postgres; edges pull config (optionally by `siteId`).

For the edge-as-bridge model (upstream/downstream channels, heartbeat, config push), see [architecture-edge-bridge.md](architecture-edge-bridge.md). For full mapping to FI2-style architecture, see [architecture-vs-fi2-connectivity.md](architecture-vs-fi2-connectivity.md).
