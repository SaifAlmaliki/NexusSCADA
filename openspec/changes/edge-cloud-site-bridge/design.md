## Context

The platform uses a cloud-agnostic FI2-style layout: one edge connector per site connects to local PLCs and energy meters and publishes to a single central MQTT broker (MonsterMQ). Config is pulled by the connector from the Next.js Config API; there is no local MQTT broker at the edge (Option A). Today the edge is effectively one-way: site→cloud telemetry and config pull. The edge is not formally defined as a bridge, there is no defined cloud→site channel for config push or commands, and there is no explicit edge identity or resilience story. Stakeholders need the edge to act as a solid, bidirectional bridge so the platform can operate reliably across connectivity gaps and so cloud can reach the site in a controlled way.

## Goals / Non-Goals

**Goals:**

- Establish the edge as the single, first-class **bridge** between platform (cloud) and site: all platform–site interaction flows through the edge with clear upstream (site→cloud) and downstream (cloud→site) contracts.
- Formalize the **upstream channel** (site→cloud): telemetry, heartbeat, and status with standard topics and payloads so the platform can detect edge presence and consume data reliably.
- Define and implement the **downstream channel** (cloud→site): config updates, optional commands, and acks so the platform can push config and optionally trigger actions at the edge without relying only on pull.
- Give each edge a **stable identity** in the platform and in MQTT (e.g. edge/site id) and document **resilience** behavior (reconnect, backoff, optional offline buffer) so the bridge remains solid under network failure.
- Document the bridge model, channel contracts, and deployment topology so operators can deploy and troubleshoot the edge consistently.

**Non-Goals:**

- Introducing a local MQTT broker at the edge in this change (Option A remains: connector-only; local broker can be a later option).
- Full offline-first or conflict resolution for config (downstream is best-effort push; edge can still pull on connect).
- Multi-tenant or multi-region platform topology; single central UNS only.
- Replacing or duplicating existing connector protocols (OPC-UA, Modbus, S7); bridge sits above them.

## Decisions

1. **Modularity and reuse (DRY, ISA-95)**
   - **Decision**: Implementation SHALL be modular and DRY. Reuse existing components and follow ISA-95 consistently: (a) **Single config shape**: Use the same connector config DTO everywhere—API returns it (`lib/connector-config`: `ConnectorConfigDto`, `getConnectorConfig`), platform push publishes it as payload, connector consumes and applies it (same shape as `connector/src/config/loader`: `ConnectorConfig`). No second schema for push. (b) **ISA-95 hierarchy**: Edge identity and scoping use the existing hierarchy: site is the bridge scope; use `parseSiteFilter` (connector-config) and `HierarchyScope` / hierarchy types from `lib/hierarchy.ts` for any site-scoped API (e.g. push-config). (c) **Shared edge topic helpers**: Define edge topic names (status, config, ack) in one place (e.g. `lib/topic.ts` or a shared `lib/edge-topics.ts`) so platform and connector use the same patterns; connector may implement the same functions locally if it cannot depend on the app lib. (d) **Modular connector**: Structure the connector into clear modules (e.g. config load/apply, upstream telemetry+heartbeat, downstream subscribe+apply+ack, resilience reconnect+backoff) so each has a single responsibility and can be tested or replaced independently.
   - **Rationale**: Reduces duplication, keeps config and hierarchy as single source of truth, and makes the bridge consistent with the rest of the platform.
   - **Alternatives**: Separate push-config schema (duplication and drift); ad-hoc topic strings in multiple files (brittle); monolithic connector (hard to maintain).

2. **Edge = bridge with two channels**
   - **Decision**: Model the edge explicitly as a bridge with (1) **upstream**: site→cloud (telemetry, heartbeat, status) and (2) **downstream**: cloud→site (config, optional commands, acks). All platform–site traffic goes through these two channels.
   - **Rationale**: Clear mental model and contracts; enables consistent identity, security, and resilience on both directions. Aligns with “edge as bridge” requirement.
   - **Alternatives**: Keep implicit one-way model (does not meet “bridge” requirement); add a third “control plane” channel (unnecessary for v1; can fold into downstream).

3. **Upstream: standard topics and heartbeat**
   - **Decision**: Use a consistent topic layout for upstream: existing `plant/#` for telemetry; add a dedicated topic (e.g. `edge/{siteId}/status` or `edge/{siteId}/heartbeat`) for heartbeat/liveness and optional status (version, last config hash). Payload schema (e.g. JSON with `ts`, `status`, optional `configRevision`) is documented.
   - **Rationale**: Platform can subscribe to edge heartbeats to detect presence and optionally trigger downstream (e.g. “push config to edge X”). Reuses existing telemetry path; only adds a small, well-defined status channel.
   - **Alternatives**: Piggyback status on telemetry (noisy and mixed concern); separate broker for status (extra infra).

4. **Downstream: MQTT as primary channel**
   - **Decision**: Use the same central MQTT broker for downstream: platform publishes to topics like `edge/{siteId}/config` or `edge/{siteId}/command`; edge connector subscribes to `edge/{siteId}/#` (or scoped subtopics). Config push = publish full or delta config; edge acks on a reply topic (e.g. `edge/{siteId}/ack`) so platform can confirm delivery.
   - **Rationale**: Single broker, no new protocol; fits existing MonsterMQ deployment. Edge already has MQTT connection; adding subscribe is minimal. Acks allow platform to know when config was applied.
   - **Alternatives**: HTTP callback from edge to platform (more complex and requires edge to be reachable); separate message queue (extra component); pull-only (no true “bridge” downstream).

5. **Edge identity**
   - **Decision**: Each edge is identified by at least `siteId` (and optionally a dedicated `edgeId` if one edge serves multiple sites). Connector sends `siteId` (and optional `edgeId`) in heartbeat and subscribes to downstream topics using the same id(s). Platform stores no new “edge device” table for v1; identity is derived from site (and config API already scopes by site).
   - **Rationale**: Minimal schema change; site is the natural scope for “one edge per site.” If we later need multi-edge-per-site, we add `edgeId`.
   - **Alternatives**: Full edge registry in Postgres (heavier; can add later); anonymous edges (no targeted downstream).

6. **Resilience: reconnect and backoff; optional buffer**
   - **Decision**: Connector SHALL use exponential backoff on MQTT/API disconnect and reconnect; SHALL publish heartbeat only when connected. Optional: allow a small local buffer (e.g. SQLite or file) for telemetry when offline, flush on reconnect—document as optional for a later task. For v1, document reconnect/backoff behavior and leave offline buffer as optional or follow-up.
   - **Rationale**: Solid bridge requires not losing connection permanently; backoff avoids thundering herd. Offline buffer improves reliability but adds complexity; can be a separate small change.
   - **Alternatives**: No backoff (fragile); mandatory offline buffer (scope creep for this change).

7. **Config: pull + optional push**
   - **Decision**: Keep existing pull (connector GET /api/connector/config) as primary; add optional push via MQTT so platform can push config when needed (e.g. after heartbeat shows edge online). Edge applies pushed config and acks; if no push, edge continues to pull on interval or on startup.
   - **Rationale**: Backward compatible; push improves responsiveness when cloud has config changes; pull remains fallback.
   - **Alternatives**: Push-only (breaking, and edge may miss messages); pull-only (no true downstream channel).

## Risks / Trade-offs

- **MQTT ordering and QoS**: Downstream config/command messages may need QoS 1 so edge does not miss updates. Mitigation: Use QoS 1 for downstream; document in channel contract; edge acks after apply.
- **Security**: Downstream topics must be restricted so only platform (and optionally edge) can publish to `edge/{siteId}/config`; edge must not accept commands from untrusted sources. Mitigation: Use broker ACLs or auth so only platform service account can publish to edge topics; document in security section.
- **Scale**: Many sites → many edge heartbeat topics. Mitigation: Single wildcard subscribe `edge/+/status` on platform side is fine; no new scaling concern beyond current MQTT usage.
- **Optional buffer**: If we add offline buffer later, ordering and deduplication (e.g. after reconnect) need rules. Mitigation: Defer to a dedicated “edge offline buffer” change with its own spec.

## Migration Plan

1. **Deploy order**: (1) Document bridge model and channel contracts (docs); (2) Add heartbeat/status in connector and standardize upstream topics; (3) Add downstream subscribe in connector + platform publish path for config (and ack topic); (4) Add broker ACLs or auth for downstream; (5) Document resilience (reconnect, backoff) and env vars; (6) Optional: add offline buffer in a follow-up.
2. **Rollback**: Disable downstream publish from platform (feature flag or config); connector continues pull-only. Revert connector to previous version if needed; no destructive DB change.
3. **Feature flag**: Optional: gate downstream push behind a flag so sites can adopt gradually.

## Open Questions

- Exact topic names: `edge/{siteId}/status`, `edge/{siteId}/config`, `edge/{siteId}/ack` vs. a different prefix (e.g. `bridge/`) — confirm with team and keep consistent in specs.
- Whether to add a dedicated `edgeId` in addition to `siteId` in v1 (e.g. for future multi-edge-per-site).
- ACL strategy for MonsterMQ: per-site credentials for edges vs. single platform publisher; document once decided.
