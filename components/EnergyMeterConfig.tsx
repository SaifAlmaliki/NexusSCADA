'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { METER_TYPE_LABELS } from '@/lib/energy';
import type { MeterType } from '@prisma/client';
import { Plus, Trash2, Zap } from 'lucide-react';

type EnergyMeterItem = {
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
      site: { id: string; name: string };
      area: { id: string; name: string } | null;
      line: { id: string; name: string } | null;
      equipment: { id: string; name: string } | null;
    };
  };
};

type EndpointForTag = {
  id: string;
  name: string;
  site?: { name: string };
  area?: { name: string };
  line?: { name: string };
  equipment?: { name: string };
  tags: Array<{ id: string; name: string; sourceId: string; unit?: string | null }>;
};

export function EnergyMeterConfig() {
  const [meters, setMeters] = useState<EnergyMeterItem[]>([]);
  const [endpoints, setEndpoints] = useState<EndpointForTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addTagId, setAddTagId] = useState('');
  const [addMeterType, setAddMeterType] = useState<MeterType>('KWH');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeters = async () => {
    try {
      const res = await fetch('/api/energy/meters');
      if (res.ok) {
        const data = await res.json();
        setMeters(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEndpoints = async () => {
    try {
      const res = await fetch('/api/connector/endpoints');
      if (res.ok) {
        const data = await res.json();
        setEndpoints(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([fetchMeters(), fetchEndpoints()]).finally(() => setLoading(false));
  }, []);

  const tagIdsUsed = new Set(meters.map((m) => m.tagId));
  const availableTags = endpoints.flatMap((ep) =>
    ep.tags
      .filter((t) => !tagIdsUsed.has(t.id))
      .map((t) => ({
        ...t,
        endpointName: ep.name,
        siteName: ep.site?.name ?? '-',
        areaName: ep.area?.name ?? '-',
        lineName: ep.line?.name ?? '-',
        equipmentName: ep.equipment?.name ?? '-',
      }))
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTagId) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/energy/meters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: addTagId, meterType: addMeterType }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAdd(false);
        setAddTagId('');
        setAddMeterType('KWH');
        fetchMeters();
      } else {
        setError(data.error ?? 'Failed to add energy meter');
      }
    } catch (err) {
      setError('Failed to add energy meter');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this energy meter configuration?')) return;
    try {
      const res = await fetch(`/api/energy/meters/${id}`, { method: 'DELETE' });
      if (res.ok) fetchMeters();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-slate-500">Loading energy meters...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Zap className="text-amber-500" size={20} />
          Energy Meters
        </CardTitle>
        <button
          onClick={() => setShowAdd(true)}
          disabled={availableTags.length === 0}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          Add energy meter
        </button>
      </CardHeader>
      <CardContent>
        {meters.length === 0 && !showAdd ? (
          <div className="text-center py-8 text-slate-500">
            No energy meters configured. Designate connector tags as energy meters (kWh, kW, power factor) to track consumption in the Energy dashboard.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 font-medium text-slate-700">Site</th>
                  <th className="text-left py-2 font-medium text-slate-700">Area</th>
                  <th className="text-left py-2 font-medium text-slate-700">Line</th>
                  <th className="text-left py-2 font-medium text-slate-700">Equipment</th>
                  <th className="text-left py-2 font-medium text-slate-700">Tag</th>
                  <th className="text-left py-2 font-medium text-slate-700">Meter type</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {meters.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100">
                    <td className="py-2">{m.tag.endpoint.site.name}</td>
                    <td className="py-2">{m.tag.endpoint.area?.name ?? '-'}</td>
                    <td className="py-2">{m.tag.endpoint.line?.name ?? '-'}</td>
                    <td className="py-2">{m.tag.endpoint.equipment?.name ?? m.tag.endpoint.name}</td>
                    <td className="py-2 font-medium">{m.tag.name}</td>
                    <td className="py-2">{METER_TYPE_LABELS[m.meterType]}</td>
                    <td className="py-2">
                      <button
                        onClick={() => handleRemove(m.id)}
                        className="text-red-400 hover:text-red-600"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showAdd && (
          <form onSubmit={handleAdd} className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
            <h4 className="font-medium text-slate-800">Add energy meter</h4>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tag</label>
                <select
                  required
                  value={addTagId}
                  onChange={(e) => setAddTagId(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-sm"
                >
                  <option value="">Select a tag</option>
                  {availableTags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.endpointName} / {t.name} ({t.siteName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Meter type</label>
                <select
                  value={addMeterType}
                  onChange={(e) => setAddMeterType(e.target.value as MeterType)}
                  className="w-full border border-slate-300 rounded p-2 text-sm"
                >
                  {(Object.keys(METER_TYPE_LABELS) as MeterType[]).map((k) => (
                    <option key={k} value={k}>
                      {METER_TYPE_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-3 py-1.5 bg-teal-600 text-white rounded text-sm font-medium disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setError(null);
                }}
                className="px-3 py-1.5 text-slate-600 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
