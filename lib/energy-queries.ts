/**
 * Shared Flux query helpers for energy analytics.
 * Keeps query structure DRY between consumption API and future use.
 */

const MEASUREMENT = 'energy';
const BUCKET = process.env.INFLUX_BUCKET || 'historian';

/** Escape a string for use inside Flux double-quoted string (escape backslash and double quote) */
function fluxStringEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export type HierarchyLevel = 'line' | 'area' | 'site' | 'multi-plant';

export function buildEnergyRangeFilter(params: {
  start: string;
  stop: string;
  siteId?: string;
  areaId?: string;
  lineId?: string;
  level: HierarchyLevel;
}): string {
  const { start, stop, siteId, areaId, lineId, level } = params;
  const startArg = `start: ${start}`;
  const stopArg = `stop: ${stop}`;
  let filterParts = `r["_measurement"] == "${MEASUREMENT}" and r["_field"] == "value"`;
  // Note: InfluxDB energy measurement has tags site, area, line, equipment (names), not IDs.
  // We filter by tag values (names) when we have IDs by joining with config in the API.
  // For now we only filter by level/aggregation; site/area/line filters applied in API layer via allowed list.
  return `from(bucket: "${BUCKET}")
  |> range(${startArg}, ${stopArg})
  |> filter(fn: (r) => ${filterParts})`;
}

/** Flux query: raw energy series filtered by time range and optional tag filters (tag values = hierarchy names) */
export function buildEnergyConsumptionQuery(params: {
  start: string;
  stop: string;
  siteName?: string;
  areaName?: string;
  lineName?: string;
  aggregateWindow?: string; // e.g. "1m", "5m", "1h"
}): string {
  const { start, stop, siteName, areaName, lineName, aggregateWindow = '5m' } = params;
  let query = `from(bucket: "${BUCKET}")
  |> range(start: ${start}, stop: ${stop})
  |> filter(fn: (r) => r["_measurement"] == "${MEASUREMENT}" and r["_field"] == "value")`;
  if (siteName) query += `\n  |> filter(fn: (r) => r["site"] == "${fluxStringEscape(siteName)}")`;
  if (areaName) query += `\n  |> filter(fn: (r) => r["area"] == "${fluxStringEscape(areaName)}")`;
  if (lineName) query += `\n  |> filter(fn: (r) => r["line"] == "${fluxStringEscape(lineName)}")`;
  query += `\n  |> aggregateWindow(every: ${aggregateWindow}, fn: mean, createEmpty: false)
  |> yield(name: "mean")`;
  return query;
}
