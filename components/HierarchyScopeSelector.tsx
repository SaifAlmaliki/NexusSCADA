'use client';

import { useState, useEffect } from 'react';
import type { HierarchySite, HierarchyArea, HierarchyLine, HierarchyEquipment } from '@/lib/hierarchy';

export interface HierarchyScopeSelectorProps {
  siteId: string | null;
  areaId: string | null;
  lineId: string | null;
  equipmentId?: string | null;
  onScopeChange: (scope: { siteId: string | null; areaId: string | null; lineId: string | null; equipmentId?: string | null }) => void;
  allowedSiteIds?: string[] | null;
  showEquipment?: boolean;
  className?: string;
}

export function HierarchyScopeSelector({
  siteId,
  areaId,
  lineId,
  equipmentId = null,
  onScopeChange,
  allowedSiteIds,
  showEquipment = false,
  className = '',
}: HierarchyScopeSelectorProps) {
  const [sites, setSites] = useState<HierarchySite[]>([]);
  const [areas, setAreas] = useState<HierarchyArea[]>([]);
  const [lines, setLines] = useState<HierarchyLine[]>([]);
  const [equipment, setEquipment] = useState<HierarchyEquipment[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingLines, setLoadingLines] = useState(false);
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingSites(true);
    fetch('/api/sites')
      .then((res) => res.ok ? res.json() : [])
      .then((data: HierarchySite[]) => {
        if (!cancelled) {
          const list = allowedSiteIds?.length
            ? data.filter((s) => allowedSiteIds.includes(s.id))
            : data;
          setSites(list);
        }
      })
      .finally(() => { if (!cancelled) setLoadingSites(false); });
    return () => { cancelled = true; };
  }, [allowedSiteIds]);

  useEffect(() => {
    if (!siteId) {
      setAreas([]);
      onScopeChange({ siteId, areaId: null, lineId: null, equipmentId: showEquipment ? null : undefined });
      return;
    }
    let cancelled = false;
    setLoadingAreas(true);
    fetch(`/api/sites/${siteId}/areas`)
      .then((res) => res.ok ? res.json() : [])
      .then((data: HierarchyArea[]) => {
        if (!cancelled) setAreas(data);
      })
      .finally(() => { if (!cancelled) setLoadingAreas(false); });
    return () => { cancelled = true; };
  }, [siteId]);

  useEffect(() => {
    if (!areaId) {
      setLines([]);
      onScopeChange({ siteId, areaId, lineId: null, equipmentId: showEquipment ? null : undefined });
      return;
    }
    let cancelled = false;
    setLoadingLines(true);
    fetch(`/api/areas/${areaId}/lines`)
      .then((res) => res.ok ? res.json() : [])
      .then((data: HierarchyLine[]) => {
        if (!cancelled) setLines(data);
      })
      .finally(() => { if (!cancelled) setLoadingLines(false); });
    return () => { cancelled = true; };
  }, [areaId]);

  useEffect(() => {
    if (!showEquipment || !lineId) {
      setEquipment([]);
      return;
    }
    let cancelled = false;
    setLoadingEquipment(true);
    fetch(`/api/lines/${lineId}/equipment`)
      .then((res) => res.ok ? res.json() : [])
      .then((data: HierarchyEquipment[]) => {
        if (!cancelled) setEquipment(data);
      })
      .finally(() => { if (!cancelled) setLoadingEquipment(false); });
    return () => { cancelled = true; };
  }, [lineId, showEquipment]);

  const handleSiteChange = (newSiteId: string) => {
    const v = newSiteId || null;
    onScopeChange({ siteId: v, areaId: null, lineId: null, equipmentId: showEquipment ? null : undefined });
  };
  const handleAreaChange = (newAreaId: string) => {
    const v = newAreaId || null;
    onScopeChange({ siteId, areaId: v, lineId: null, equipmentId: showEquipment ? null : undefined });
  };
  const handleLineChange = (newLineId: string) => {
    const v = newLineId || null;
    onScopeChange({ siteId, areaId, lineId: v, equipmentId: showEquipment ? null : undefined });
  };
  const handleEquipmentChange = (newEquipmentId: string) => {
    onScopeChange({ siteId, areaId, lineId, equipmentId: newEquipmentId || null });
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <select
        value={siteId ?? ''}
        onChange={(e) => handleSiteChange(e.target.value)}
        disabled={loadingSites}
        className="border border-slate-300 rounded-lg px-3 py-2 text-sm min-w-[140px]"
      >
        <option value="">Select site</option>
        {sites.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <select
        value={areaId ?? ''}
        onChange={(e) => handleAreaChange(e.target.value)}
        disabled={loadingAreas || !siteId}
        className="border border-slate-300 rounded-lg px-3 py-2 text-sm min-w-[140px]"
      >
        <option value="">Select area</option>
        {areas.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      <select
        value={lineId ?? ''}
        onChange={(e) => handleLineChange(e.target.value)}
        disabled={loadingLines || !areaId}
        className="border border-slate-300 rounded-lg px-3 py-2 text-sm min-w-[140px]"
      >
        <option value="">Select line</option>
        {lines.map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>
      {showEquipment && (
        <select
          value={equipmentId ?? ''}
          onChange={(e) => handleEquipmentChange(e.target.value)}
          disabled={loadingEquipment || !lineId}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm min-w-[140px]"
        >
          <option value="">Select equipment</option>
          {equipment.map((eq) => (
            <option key={eq.id} value={eq.id}>{eq.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
