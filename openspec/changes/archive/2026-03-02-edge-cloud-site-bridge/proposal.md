## Why

The edge must act as a reliable **bridge** between cloud (platform) and site—both site-to-cloud (telemetry, status) and cloud-to-site (config, commands)—so that the platform can operate consistently across connectivity gaps and the edge architecture is solid, identifiable, and resilient. Today the edge is effectively connector-only with one-way publish to the central MQTT broker; there is no formal bridge model, no defined downstream channel (cloud→site), and no explicit resilience or identity story. This change establishes the edge as a first-class bridge with a clear, solid architecture.

## What Changes

- **Edge as bridge**: Define the edge as the single bridge between platform and site: upstream (site→cloud) and downstream (cloud→site) with clear contracts, so all platform–site interaction flows through the edge.
- **Upstream channel (site→cloud)**: Formalize telemetry, heartbeat, and status over the existing connector→central MQTT path; standardize topics and payloads so the platform can rely on edge presence and data.
- **Downstream channel (cloud→site)**: Define and implement a cloud→site path for config updates, optional commands, and acknowledgments so the platform can push config and optionally trigger actions at the edge without relying only on edge pull.
- **Edge identity and resilience**: Give each edge a stable identity (e.g. edge/site id) in the platform and in MQTT; document and implement resilience behavior (offline buffering, reconnect, backoff) so the bridge remains solid under network failures.
- **Documentation and deployment**: Capture the bridge model, channel contracts, and deployment topology in docs and deployment guides so operators can run and troubleshoot the edge reliably.
- **Modularity and reuse**: Implementation SHALL be modular and DRY: single connector config DTO (same as GET /api/connector/config) for push payload; ISA-95 hierarchy and existing site-scoping utilities (parseSiteFilter, getConnectorConfig) reused; edge topic names in one place (shared helpers); connector structured into clear modules (config, upstream, downstream, resilience).

## Capabilities

### New Capabilities

- `edge-bridge-model`: Defines the edge as the bridge between platform and site; roles, boundaries, and the split between upstream (site→cloud) and downstream (cloud→site) channels.
- `edge-upstream-channel`: Contract and behavior for site→cloud: telemetry, heartbeat, status; topic layout and payload conventions so the platform can consume and detect edge presence.
- `edge-downstream-channel`: Contract and behavior for cloud→site: config push, optional commands, acks; how the platform targets edges (e.g. by site/edge id) and how the edge subscribes and applies updates.
- `edge-resilience-identity`: Edge identity in the platform and in MQTT; resilience behavior (offline, reconnect, backoff, optional local buffer) and security considerations so the bridge is solid under failure.

### Modified Capabilities

- (none)

## Impact

- **Connector**: May gain downstream subscription (cloud→site), heartbeat/status publishing, and optional local buffer or queue for resilience; env and config for edge identity.
- **Platform (Config API)**: May expose push or notify semantics for config-by-edge/site; optional endpoints or MQTT topics for downstream commands/acks.
- **MQTT**: New or standardized topics for upstream (e.g. status/heartbeat) and downstream (config, commands); topic naming and payload schema documented.
- **Docs and deployment**: New or updated architecture and deployment docs (edge-per-site, bridge model, channel contracts, env vars, resilience).
- **Dependencies**: No new external services required; optional local store/buffer at edge if we add offline resilience.
