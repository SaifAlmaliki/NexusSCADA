/**
 * Resolve MQTT topic from template and hierarchy.
 * Mirrors connector's resolveTopic so API can emit consistent topics for Telegraf.
 * Template vars: {site}, {area}, {line}, {equipment}, {tag}
 */
export interface HierarchyNames {
  siteName: string;
  areaName: string;
  lineName: string;
  equipmentName: string;
}

export function resolveTopic(
  template: string,
  hierarchy: HierarchyNames,
  tagName: string
): string {
  const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return template
    .replace(/\{site\}/g, hierarchy.siteName.toLowerCase().replace(/[^a-z0-9]/g, '_'))
    .replace(/\{area\}/g, hierarchy.areaName.toLowerCase().replace(/[^a-z0-9]/g, '_'))
    .replace(/\{line\}/g, hierarchy.lineName.toLowerCase().replace(/[^a-z0-9]/g, '_'))
    .replace(/\{equipment\}/g, hierarchy.equipmentName.toLowerCase().replace(/[^a-z0-9]/g, '_'))
    .replace(/\{tag\}/g, tagSlug);
}

/** Canonical topic pattern for energy: plant/{site}/{area}/{line}/{equipment}/{tag} */
export const ENERGY_TOPIC_TEMPLATE = 'plant/{site}/{area}/{line}/{equipment}/{tag}';
