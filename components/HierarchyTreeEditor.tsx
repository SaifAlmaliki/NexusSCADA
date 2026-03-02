'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import type { HierarchySite, HierarchyArea, HierarchyLine, HierarchyEquipment } from '@/lib/hierarchy';

export interface HierarchyTreeEditorProps {
  siteId: string;
  siteName?: string;
  onClose?: () => void;
  onSaved?: () => void;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.json().then((b: { error?: string }) => b.error).catch(() => res.statusText));
  return res.json();
}

async function postJson<T>(url: string, body: object): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.json().then((b: { error?: string }) => b.error).catch(() => res.statusText));
  return res.json();
}

async function patchJson<T>(url: string, body: object): Promise<T> {
  const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.json().then((b: { error?: string }) => b.error).catch(() => res.statusText));
  return res.json();
}

async function deleteJson(url: string): Promise<void> {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.json().then((b: { error?: string }) => b.error).catch(() => res.statusText));
}

export function HierarchyTreeEditor({ siteId, siteName, onClose, onSaved }: HierarchyTreeEditorProps) {
  const [site, setSite] = useState<HierarchySite | null>(null);
  const [areas, setAreas] = useState<HierarchyArea[]>([]);
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const [linesByArea, setLinesByArea] = useState<Record<string, HierarchyLine[]>>({});
  const [equipmentByLine, setEquipmentByLine] = useState<Record<string, HierarchyEquipment[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ type: 'area' | 'line' | 'equipment'; id: string; name: string; equipmentType?: string } | null>(null);
  const [adding, setAdding] = useState<{ type: 'area' | 'line' | 'equipment'; parentId: string } | null>(null);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Equipment');

  const loadSite = async () => {
    try {
      const s = await fetchJson<HierarchySite>(`/api/sites/${siteId}`);
      setSite(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load site');
    }
  };

  const loadAreas = async () => {
    try {
      const list = await fetchJson<HierarchyArea[]>(`/api/sites/${siteId}/areas`);
      setAreas(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load areas');
    }
  };

  const loadLines = async (areaId: string) => {
    try {
      const list = await fetchJson<HierarchyLine[]>(`/api/areas/${areaId}/lines`);
      setLinesByArea((prev) => ({ ...prev, [areaId]: list }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load lines');
    }
  };

  const loadEquipment = async (lineId: string) => {
    try {
      const list = await fetchJson<HierarchyEquipment[]>(`/api/lines/${lineId}/equipment`);
      setEquipmentByLine((prev) => ({ ...prev, [lineId]: list }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load equipment');
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([loadSite(), loadAreas()]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [siteId]);

  const toggleArea = (areaId: string) => {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
    if (!linesByArea[areaId]) loadLines(areaId);
  };

  const toggleLine = (lineId: string) => {
    setExpandedLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
    if (!equipmentByLine[lineId]) loadEquipment(lineId);
  };

  const handleAdd = async () => {
    if (!adding || !newName.trim()) return;
    try {
      if (adding.type === 'area') {
        await postJson<HierarchyArea>(`/api/sites/${siteId}/areas`, { name: newName.trim() });
      } else if (adding.type === 'line') {
        await postJson<HierarchyLine>(`/api/areas/${adding.parentId}/lines`, { name: newName.trim() });
        await loadLines(adding.parentId);
      } else {
        await postJson<HierarchyEquipment>(`/api/lines/${adding.parentId}/equipment`, { name: newName.trim(), type: newType.trim() || 'Equipment' });
        await loadEquipment(adding.parentId);
      }
      setAdding(null);
      setNewName('');
      setNewType('Equipment');
      await loadAreas();
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add');
    }
  };

  const handleSaveEdit = async () => {
    if (!editing || !newName.trim()) return;
    try {
      if (editing.type === 'area') {
        await patchJson<HierarchyArea>(`/api/areas/${editing.id}`, { name: newName.trim() });
      } else if (editing.type === 'line') {
        await patchJson<HierarchyLine>(`/api/lines/${editing.id}`, { name: newName.trim() });
      } else {
        await patchJson<HierarchyEquipment>(`/api/equipment/${editing.id}`, { name: newName.trim(), type: newType.trim() || 'Equipment' });
      }
      setEditing(null);
      setNewName('');
      setNewType('Equipment');
      await loadAreas();
      setLinesByArea({});
      setEquipmentByLine({});
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    }
  };

  const handleDelete = async (type: 'area' | 'line' | 'equipment', id: string, parentId?: string) => {
    if (!confirm(`Delete this ${type}?`)) return;
    try {
      if (type === 'area') await deleteJson(`/api/areas/${id}`);
      else if (type === 'line') await deleteJson(`/api/lines/${id}`);
      else await deleteJson(`/api/equipment/${id}`);
      await loadAreas();
      if (parentId) {
        if (type === 'line') await loadLines(parentId);
        else if (type === 'equipment') await loadEquipment(parentId);
      }
      setLinesByArea((prev) => {
        const next = { ...prev };
        if (type === 'line') delete next[id];
        return next;
      });
      setEquipmentByLine((prev) => {
        const next = { ...prev };
        if (type === 'equipment') delete next[id];
        return next;
      });
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  if (loading || !site) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-500">
          {loading ? 'Loading...' : 'Site not found.'}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage structure: {siteName ?? site.name}</CardTitle>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Close
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-center justify-between py-1">
            <span className="font-medium text-slate-700">Areas</span>
            {!adding && (
              <button
                type="button"
                onClick={() => setAdding({ type: 'area', parentId: siteId })}
                className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
              >
                <Plus size={14} /> Add area
              </button>
            )}
          </div>
          {adding?.type === 'area' && (
            <div className="flex items-center gap-2 pl-6 py-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Area name"
                className="flex-1 max-w-xs px-3 py-2 border border-slate-300 rounded-lg text-sm"
                autoFocus
              />
              <button type="button" onClick={handleAdd} className="px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">Add</button>
              <button type="button" onClick={() => { setAdding(null); setNewName(''); }} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
            </div>
          )}
          {areas.map((area) => (
            <div key={area.id} className="border border-slate-200 rounded-lg overflow-hidden">
              <div
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 cursor-pointer"
                onClick={() => toggleArea(area.id)}
              >
                {expandedAreas.has(area.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                {editing?.type === 'area' && editing.id === area.id ? (
                  <>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 max-w-xs px-2 py-1 border border-slate-300 rounded text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }} className="text-teal-600 text-sm">Save</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(null); setNewName(''); }} className="text-slate-500 text-sm">Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-slate-800">{area.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setEditing({ type: 'area', id: area.id, name: area.name }); setNewName(area.name); }}
                      className="ml-auto p-1 text-slate-500 hover:text-teal-600"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete('area', area.id); }}
                      className="p-1 text-slate-500 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
              {expandedAreas.has(area.id) && (
                <div className="pl-6 pr-3 py-2 space-y-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Lines</span>
                    {adding?.type === 'line' && adding.parentId === area.id ? null : (
                      <button
                        type="button"
                        onClick={() => setAdding({ type: 'line', parentId: area.id })}
                        className="text-xs text-teal-600 hover:text-teal-700"
                      >
                        + Add line
                      </button>
                    )}
                  </div>
                  {adding?.type === 'line' && adding.parentId === area.id && (
                    <div className="flex items-center gap-2 py-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Line name"
                        className="flex-1 max-w-xs px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                      <button type="button" onClick={handleAdd} className="px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">Add</button>
                      <button type="button" onClick={() => { setAdding(null); setNewName(''); }} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
                    </div>
                  )}
                  {(linesByArea[area.id] ?? []).map((line) => (
                    <div key={line.id} className="border border-slate-100 rounded-lg overflow-hidden">
                      <div
                        className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 cursor-pointer"
                        onClick={() => toggleLine(line.id)}
                      >
                        {expandedLines.has(line.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        {editing?.type === 'line' && editing.id === line.id ? (
                          <>
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              className="flex-1 max-w-xs px-2 py-1 border border-slate-300 rounded text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }} className="text-teal-600 text-sm">Save</button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(null); setNewName(''); }} className="text-slate-500 text-sm">Cancel</button>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-medium text-slate-700">{line.name}</span>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setEditing({ type: 'line', id: line.id, name: line.name }); setNewName(line.name); }} className="ml-auto p-1 text-slate-400 hover:text-teal-600"><Pencil size={12} /></button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete('line', line.id, area.id); }} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={12} /></button>
                          </>
                        )}
                      </div>
                      {expandedLines.has(line.id) && (
                        <div className="pl-6 pr-3 py-2 space-y-2 border-t border-slate-50">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Equipment</span>
                            {adding?.type === 'equipment' && adding.parentId === line.id ? null : (
                              <button type="button" onClick={() => setAdding({ type: 'equipment', parentId: line.id })} className="text-xs text-teal-600">+ Add equipment</button>
                            )}
                          </div>
                          {adding?.type === 'equipment' && adding.parentId === line.id && (
                            <div className="flex items-center gap-2 py-2 flex-wrap">
                              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                              <input type="text" value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="Type" className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-28" />
                              <button type="button" onClick={handleAdd} className="px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">Add</button>
                              <button type="button" onClick={() => { setAdding(null); setNewName(''); setNewType('Equipment'); }} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
                            </div>
                          )}
                          {(equipmentByLine[line.id] ?? []).map((eq) => (
                            <div key={eq.id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                              {editing?.type === 'equipment' && editing.id === eq.id ? (
                                <>
                                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 max-w-xs px-2 py-1 border border-slate-300 rounded text-sm" onClick={(e) => e.stopPropagation()} />
                                  <input type="text" value={newType} onChange={(e) => setNewType(e.target.value)} className="w-24 px-2 py-1 border border-slate-300 rounded text-sm" />
                                  <button type="button" onClick={handleSaveEdit} className="text-teal-600 text-sm">Save</button>
                                  <button type="button" onClick={() => { setEditing(null); setNewName(''); setNewType('Equipment'); }} className="text-slate-500 text-sm">Cancel</button>
                                </>
                              ) : (
                                <>
                                  <span className="text-slate-700">{eq.name}</span>
                                  <span className="text-slate-400 text-xs">({eq.type})</span>
                                  <button type="button" onClick={() => { setEditing({ type: 'equipment', id: eq.id, name: eq.name, equipmentType: eq.type }); setNewName(eq.name); setNewType(eq.type); }} className="ml-auto p-1 text-slate-400 hover:text-teal-600"><Pencil size={12} /></button>
                                  <button type="button" onClick={() => handleDelete('equipment', eq.id, line.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={12} /></button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
