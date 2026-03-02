/**
 * Edge bridge MQTT topic helpers (DRY).
 * Use these so platform and connector use the same topic names for status, config, ack, and command.
 * Connector may duplicate these constants locally if it cannot import from the app.
 */

const EDGE_TOPIC_PREFIX = 'edge';

/**
 * Upstream: edge publishes heartbeat/status here. Platform subscribes to detect edge presence.
 * Pattern: edge/{siteId}/status
 */
export function getEdgeStatusTopic(siteId: string): string {
  return `${EDGE_TOPIC_PREFIX}/${siteId}/status`;
}

/**
 * Downstream: platform publishes config here. Edge subscribes and applies (same shape as GET /api/connector/config).
 * Pattern: edge/{siteId}/config
 */
export function getEdgeConfigTopic(siteId: string): string {
  return `${EDGE_TOPIC_PREFIX}/${siteId}/config`;
}

/**
 * Downstream (optional): platform can publish commands here.
 * Pattern: edge/{siteId}/command
 */
export function getEdgeCommandTopic(siteId: string): string {
  return `${EDGE_TOPIC_PREFIX}/${siteId}/command`;
}

/**
 * Upstream (from edge): edge publishes acks here after applying config/command.
 * Pattern: edge/{siteId}/ack
 */
export function getEdgeAckTopic(siteId: string): string {
  return `${EDGE_TOPIC_PREFIX}/${siteId}/ack`;
}

/**
 * Subscription pattern for edge: subscribe to all downstream topics for a site.
 * Pattern: edge/{siteId}/#
 */
export function getEdgeDownstreamSubscribeTopic(siteId: string): string {
  return `${EDGE_TOPIC_PREFIX}/${siteId}/#`;
}
