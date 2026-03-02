/**
 * Shared energy management types and constants.
 * Used by API routes and UI to keep validation and display DRY.
 */

import type { MeterType } from '@prisma/client';

export const METER_TYPES: readonly MeterType[] = ['KWH', 'KW', 'POWER_FACTOR'] as const;

export function isValidMeterType(value: string): value is MeterType {
  return METER_TYPES.includes(value as MeterType);
}

export const METER_TYPE_LABELS: Record<MeterType, string> = {
  KWH: 'Energy (kWh)',
  KW: 'Power (kW)',
  POWER_FACTOR: 'Power factor',
};

export type EnergyMeterWithHierarchy = {
  id: string;
  tagId: string;
  meterType: MeterType;
  tag: {
    id: string;
    name: string;
    sourceId: string;
    unit: string | null;
    endpoint: {
      id: string;
      name: string;
      siteId: string;
      site: { id: string; name: string };
      areaId: string | null;
      area: { id: string; name: string } | null;
      lineId: string | null;
      line: { id: string; name: string } | null;
      equipmentId: string | null;
      equipment: { id: string; name: string } | null;
    };
  };
};
