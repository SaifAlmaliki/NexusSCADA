/**
 * Edge bridge topic names (must match platform lib/edge-topics.ts).
 * See docs/architecture-edge-bridge.md "Topic constants (for connector)".
 */
const PREFIX = 'edge';

export function getEdgeStatusTopic(siteId: string): string {
  return `${PREFIX}/${siteId}/status`;
}

export function getEdgeConfigTopic(siteId: string): string {
  return `${PREFIX}/${siteId}/config`;
}

export function getEdgeAckTopic(siteId: string): string {
  return `${PREFIX}/${siteId}/ack`;
}

export function getEdgeDownstreamSubscribeTopic(siteId: string): string {
  return `${PREFIX}/${siteId}/#`;
}
