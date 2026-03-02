/**
 * Shared hierarchy types and helpers (ISA-95: Site → Area → Line → Equipment).
 * Used by API routes and UI so all services use the same contracts.
 */

// --- API response types (match Prisma/JSON) ---

export interface HierarchySite {
  id: string;
  name: string;
  location: string | null;
  description?: string | null;
  timezone?: string | null;
  address?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface HierarchyArea {
  id: string;
  name: string;
  siteId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HierarchyLine {
  id: string;
  name: string;
  areaId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HierarchyEquipment {
  id: string;
  name: string;
  type: string;
  lineId: string;
  createdAt?: string;
  updatedAt?: string;
}

// --- Scope (for filtering across services) ---

export interface HierarchyScope {
  siteId?: string | null;
  areaId?: string | null;
  lineId?: string | null;
  equipmentId?: string | null;
}

/** Validate that scope ids are consistent (e.g. area belongs to site). Caller must verify against DB when persisting. */
export function validateParentIds(scope: HierarchyScope): { valid: boolean; error?: string } {
  const { siteId, areaId, lineId, equipmentId } = scope;
  if (areaId && !siteId) return { valid: false, error: 'siteId required when areaId is set' };
  if (lineId && !areaId) return { valid: false, error: 'areaId required when lineId is set' };
  if (equipmentId && !lineId) return { valid: false, error: 'lineId required when equipmentId is set' };
  return { valid: true };
}

/** Level for aggregation (e.g. energy consumption): site | area | line | equipment */
export type HierarchyLevel = 'site' | 'area' | 'line' | 'equipment';

export const HIERARCHY_LEVELS: readonly HierarchyLevel[] = ['site', 'area', 'line', 'equipment'] as const;

export function isHierarchyLevel(value: string): value is HierarchyLevel {
  return HIERARCHY_LEVELS.includes(value as HierarchyLevel);
}
