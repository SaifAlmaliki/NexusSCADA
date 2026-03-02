# Nexus SCADA vs FI2-style connectivity architecture (cloud-agnostic)

This document maps the platform to a **cloud-agnostic** version of the FI2 connectivity architecture, using **self-hosted MQTT** instead of Azure IoT Edge / IoT Hub.

---

## 1. FI2-style architecture (cloud-agnostic translation)

| FI2 layer | Azure original | Cloud-agnostic equivalent |
|-----------|----------------|---------------------------|
| **Plant sources** | S7, Allen Bradley, OPC-UA, MQTT devices, CSV | Same: PLCs and devices are protocol-agnostic |
| **Edge** | Azure IoT Edge (KepServer config, OPC-UA Publisher/Translator, MQTT Watchdog, Edge HiveMQ) | **Option A (our implementation):** One connector per site only. No local MQTT broker at the edge. Connector runs at the site, connects directly to that site's PLCs and energy meters, pulls config from the central Config API (optionally scoped by site), and publishes to the **central** MQTT broker. |
| **Ingestion** | IoT Hub + Cloud HiveMQ | **Single central MQTT broker (UNS)** in the platform: all edges publish here. Self-hosted (e.g. MonsterMQ), cloud-agnostic. |
| **Connectivity backend** | Config APIs + Asset Registry DB + Eventhub Telemetry Publisher | **Config API + Asset Registry DB + MQTT→InfluxDB bridge**: APIs serve connector config and asset hierarchy; a subscriber (e.g. Telegraf) reads MQTT and writes time-series |
| **Consumers** | EventHub → Data Explorer; Data Lake | **InfluxDB** (or any time-series DB): historian + analytics |
| **UI** | Angular config UIs | **Next.js**: Settings (Plants & Units, Connectors, Energy meters), dashboards (Energy, Trends, Realtime) |

**Core swap:** IoT Hub + IoT Edge → **central self-hosted MQTT broker (UNS) + one edge connector per site (Option A)**. No local broker at the edge. Telemetry path: **Site devices → Edge connector (at site) → central MQTT → Telegraf → InfluxDB**.

---

## 2. Side-by-side: FI2 (cloud-agnostic) vs Nexus SCADA

| Layer / function | FI2-style (cloud-agnostic) | Nexus SCADA today | Match |
|------------------|----------------------------|--------------------|-------|
| **Plant sources** | S7, AB, OPC-UA, MQTT, CSV | S7, Modbus TCP, OPC-UA (connector); MQTT possible via broker | ✅ Same idea; no KepServer/AB, direct protocols |
| **Protocol normalization** | Edge: OPC-UA/MQTT/KepServer → MQTT | Connector: OPC-UA/Modbus/S7 → MQTT (topic template with hierarchy) | ✅ Connector = edge publisher |
| **Central MQTT** | Self-hosted broker (e.g. HiveMQ, EMQX) | **MonsterMQ** (docker-compose) | ✅ Self-hosted, cloud-agnostic |
| **Config source for connector** | Config API + Asset Registry | **GET /api/connector/config** + Prisma (Site, Area, Line, Equipment, ConnectorEndpoint, ConnectorTag) | ✅ Asset Registry = Prisma + hierarchy |
| **Asset / hierarchy registry** | Asset Registry DB (SQL) | **Postgres + Prisma**: Site, Area, Line, Equipment, ConnectorEndpoint, ConnectorTag | ✅ ISA-95 hierarchy, single source of truth |
| **Telemetry: MQTT → time-series** | Eventhub Telemetry Publisher → EventHub | **Telegraf**: subscribes to `plant/#`, writes to **InfluxDB** (historian + energy) | ✅ Same role, different tech |
| **Time-series storage** | EventHub + Data Explorer + Data Lake | **InfluxDB** (single bucket: historian; energy measurement) | ✅ Single DB, cloud-agnostic |
| **Pipeline / signal config API** | Pipeline Configuration API | Connector config is endpoint+tag based; no separate “pipeline” entity | ⚠️ Simpler; pipelines = endpoint + tags |
| **KepServer configuration API** | Pushes config to KepServer at edge | N/A (no KepServer); connector pulls config from Next.js API | ✅ Pull model fits self-hosted |
| **Gateway / device config UI** | Angular UIs | **Settings → Connectors**: endpoints, tags, hierarchy (HierarchyScopeSelector), Energy meters | ✅ Same purpose |
| **Signal configuration UI** | Signal Configuration UI | Tags per endpoint in ConnectorTagTable; energy meters in EnergyMeterConfig | ✅ |
| **Real-time UI** | (Not detailed in FI2) | **Scada Realtime** (MQTT over WebSockets to MonsterMQ) | ✅ Extra |
| **Analytics / dashboards** | Data Explorer, Power BI, etc. | **Energy dashboard**, **Trends** (InfluxDB + hierarchy scope) | ✅ |

---

## 3. Data flow comparison

**FI2 (cloud-agnostic, edge-per-site):**
```
Site A: Plant devices (S7, OPC-UA, MQTT, etc.) → Edge connector A → central MQTT broker
Site B: Plant devices → Edge connector B → central MQTT broker
Platform: central MQTT → Telegraf → InfluxDB
          Config API ← Asset Registry DB ← Edge A/B pull config (optionally by siteId)
          Config UIs (gateway, pipeline, signal)
```

**Nexus SCADA (edge-per-site → central UNS):**
```
Site A: PLCs, energy meters → Edge connector (CONFIG_API_URL, MQTT_URL → platform; optional EDGE_SITE_ID)
        → central MonsterMQ (platform)
Site B: same → another Edge connector instance → central MonsterMQ
Platform: MonsterMQ → Telegraf (plant/# → InfluxDB historian + energy)
           Next.js API (GET /api/connector/config?siteId=... or no filter) ← Postgres (Prisma)
           Settings (Plants & Units, Connectors, Energy meters), Energy dashboard, Trends, Realtime
```

So: **same shape**. One edge per site; each edge publishes to the **central** MQTT broker (UNS); config API can filter by site so each edge only pulls its site's endpoints.

---

## 4. Gaps and differences

| Topic | FI2 | Nexus SCADA | Note |
|-------|-----|-------------|------|
| **KepServer / Allen Bradley** | KepServer as gateway for S7 + AB | Direct S7 and Modbus; no KepServer | By design; keep cloud-agnostic, no KepServer dependency |
| **MQTT devices native** | MQTT devices → Edge MQTT broker (FI2) | **Option A:** No local broker at edge. Connector is poll-based (OPC-UA, Modbus, S7). Native MQTT devices (if any) publish to central broker; no edge broker. | Option A: connector-only at edge |
| **Upstream/downstream proxy** | Edge ↔ Cloud MQTT proxies | **Option A:** One central broker (MonsterMQ) only. One edge connector per site publishes directly to it. No edge-local broker, no proxy. Connector uses `MQTT_URL` = central broker. |
| **Pipeline as first-class entity** | Pipeline Configuration API | Pipeline = endpoint + tags; no separate pipeline table | Acceptable; add later if needed |
| **Cold storage / Data Lake** | Telemetry → Data Lake | InfluxDB only; retention by InfluxDB | Can add export to S3/MinIO or another store later if needed |
| **Multiple UIs** | Separate Angular apps per config area | Single Next.js app (Settings tabs) | Preferable for one deployment |

---

## 5. Summary: how close we are

- **Architecture:** Very close. Same layers: plant → connector (edge) → MQTT → telemetry processor → time-series DB; config API + asset registry → UI. **Option A only:** connector-only at the edge, no local MQTT broker; all implementation follows this.
- **Cloud-agnostic:** Yes. No IoT Hub or IoT Edge; **self-hosted MQTT (MonsterMQ)** and optional InfluxDB/Postgres on your own infra.
- **Implemented today:**
  - Self-hosted MQTT broker (MonsterMQ)
  - Connector that pulls config from API and publishes to MQTT with hierarchy
  - Asset/hierarchy registry (Postgres/Prisma, ISA-95)
  - MQTT → InfluxDB (Telegraf: historian + energy)
  - Config and hierarchy UI (Settings: Plants & Units, Connectors, Energy meters)
  - Dashboards (Energy, Trends) and realtime (Scada)
- **Optional next steps:** Native MQTT device docs; multi-site/federated MQTT if needed; optional cold-storage export; keep pipeline as “endpoint + tags” unless you need a separate pipeline model.

Using **self-hosted MQTT instead of IoT Edge/IoT Hub** fits the FI2 connectivity pattern and keeps the platform cloud-agnostic while staying close to the reference architecture.

---

## 6. Deployment (edge-per-site → central UNS, Option A)

**We use Option A only:** one connector per site, no local MQTT broker at the edge. The connector connects directly to local devices and publishes to the central broker.

| Role | Components | Where it runs |
|------|------------|----------------|
| **Platform (central UNS)** | MonsterMQ (central MQTT), Next.js API, Postgres, InfluxDB, Telegraf, Next.js UI | Single deployment (on-prem or cloud). Connectors do **not** run here; they run at each site. |
| **Edge (per site)** | Connector only (no local broker) | One instance per physical site. Connects directly to local PLCs and energy meters; `MQTT_URL` and `CONFIG_API_URL` point at the platform. Optional: `EDGE_SITE_ID` (or `EDGE_SITE_IDS`) so the connector only pulls config for that site. |

**Edge env vars (reuse this table in any edge-per-site doc):**

| Variable | Description | Example |
|----------|-------------|---------|
| `MQTT_URL` | Central broker URL (platform) | `mqtt://platform-host:1883` |
| `CONFIG_API_URL` | Platform API base URL | `http://platform-host:3000` |
| `EDGE_SITE_ID` | (Optional) Site UUID this edge serves; config API returns only that site's endpoints | UUID from Settings → Plants & Units |
| `EDGE_SITE_IDS` | (Optional) Comma-separated site UUIDs if one edge serves multiple sites | `uuid1,uuid2` |
