'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { HierarchyScopeSelector } from '@/components/HierarchyScopeSelector';

type Site = { id: string; name: string };

type Endpoint = {
  id: string;
  name: string;
  protocol: string;
  enabled: boolean;
  siteId: string;
  areaId?: string;
  lineId?: string;
  equipmentId?: string;
  config: Record<string, unknown>;
  pollingInterval: number;
};

export function ConnectorEndpointForm({
  endpoint,
  onSaved,
  onCancel,
}: {
  endpoint: Endpoint | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    protocol: 'OPC_UA',
    enabled: true,
    siteId: '',
    areaId: '',
    lineId: '',
    equipmentId: '',
    pollingInterval: 1000,
    endpoint: '',
    host: '',
    port: 502,
    unitId: 1,
    rack: 0,
    slot: 1,
  });

  useEffect(() => {
    fetch('/api/sites')
      .then((r) => r.json())
      .then((data) => setSites(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (endpoint) {
      const cfg = endpoint.config as Record<string, unknown>;
      setFormData({
        name: endpoint.name,
        protocol: endpoint.protocol,
        enabled: endpoint.enabled,
        siteId: endpoint.siteId,
        areaId: endpoint.areaId || '',
        lineId: endpoint.lineId || '',
        equipmentId: endpoint.equipmentId || '',
        pollingInterval: endpoint.pollingInterval,
        endpoint: (cfg.endpoint as string) || '',
        host: (cfg.host as string) || '',
        port: (cfg.port as number) || 502,
        unitId: (cfg.unitId as number) ?? 1,
        rack: (cfg.rack as number) ?? 0,
        slot: (cfg.slot as number) ?? 1,
      });
    } else {
      setFormData({
        name: '',
        protocol: 'OPC_UA',
        enabled: true,
        siteId: sites[0]?.id || '',
        areaId: '',
        lineId: '',
        equipmentId: '',
        pollingInterval: 1000,
        endpoint: 'opc.tcp://localhost:4840',
        host: '',
        port: 502,
        unitId: 1,
        rack: 0,
        slot: 1,
      });
    }
  }, [endpoint, sites]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const config: Record<string, unknown> = {};
      if (formData.protocol === 'OPC_UA') {
        config.endpoint = formData.endpoint;
      } else if (formData.protocol === 'MODBUS_TCP') {
        config.host = formData.host;
        config.port = formData.port;
        config.unitId = formData.unitId;
      } else if (formData.protocol === 'S7') {
        config.host = formData.host;
        config.rack = formData.rack;
        config.slot = formData.slot;
      }

      const payload = {
        name: formData.name,
        protocol: formData.protocol,
        enabled: formData.enabled,
        siteId: formData.siteId || sites[0]?.id,
        areaId: formData.areaId || null,
        lineId: formData.lineId || null,
        equipmentId: formData.equipmentId || null,
        config,
        pollingInterval: formData.pollingInterval,
      };

      const url = endpoint ? `/api/connector/endpoints/${endpoint.id}` : '/api/connector/endpoints';
      const method = endpoint ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSaved();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{endpoint ? 'Edit Endpoint' : 'Add Endpoint'}</CardTitle>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-700">
            Cancel
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2"
                placeholder="e.g. Reactor 1 OPC UA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Protocol</label>
              <select
                value={formData.protocol}
                onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2"
              >
                <option value="OPC_UA">OPC UA</option>
                <option value="MODBUS_TCP">Modbus TCP</option>
                <option value="S7">S7 (Siemens)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hierarchy (Site → Area → Line → Equipment)</label>
              <HierarchyScopeSelector
                siteId={formData.siteId || null}
                areaId={formData.areaId || null}
                lineId={formData.lineId || null}
                equipmentId={formData.equipmentId || null}
                onScopeChange={(scope) =>
                  setFormData((prev) => ({
                    ...prev,
                    siteId: scope.siteId || '',
                    areaId: scope.areaId || '',
                    lineId: scope.lineId || '',
                    equipmentId: scope.equipmentId || '',
                  }))
                }
                showEquipment={true}
                className="flex flex-col gap-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Polling Interval (ms)</label>
              <input
                type="number"
                min={100}
                value={formData.pollingInterval}
                onChange={(e) => setFormData({ ...formData, pollingInterval: parseInt(e.target.value) || 1000 })}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>

            {formData.protocol === 'OPC_UA' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Endpoint URL</label>
                <input
                  type="text"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  placeholder="opc.tcp://192.168.1.10:4840"
                />
              </div>
            )}

            {(formData.protocol === 'MODBUS_TCP' || formData.protocol === 'S7') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Host</label>
                  <input
                    type="text"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    placeholder="192.168.1.20"
                  />
                </div>
                {formData.protocol === 'MODBUS_TCP' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
                      <input
                        type="number"
                        value={formData.port}
                        onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 502 })}
                        className="w-full border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Unit ID</label>
                      <input
                        type="number"
                        value={formData.unitId}
                        onChange={(e) => setFormData({ ...formData, unitId: parseInt(e.target.value) || 1 })}
                        className="w-full border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </>
                )}
                {formData.protocol === 'S7' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Rack</label>
                      <input
                        type="number"
                        value={formData.rack}
                        onChange={(e) => setFormData({ ...formData, rack: parseInt(e.target.value) || 0 })}
                        className="w-full border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Slot</label>
                      <input
                        type="number"
                        value={formData.slot}
                        onChange={(e) => setFormData({ ...formData, slot: parseInt(e.target.value) || 1 })}
                        className="w-full border border-slate-300 rounded-lg p-2"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
