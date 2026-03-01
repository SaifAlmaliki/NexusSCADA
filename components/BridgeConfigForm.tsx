'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';

type Bridge = {
  id: string;
  type: string;
  enabled: boolean;
  config: Record<string, unknown>;
};

export function BridgeConfigForm() {
  const [bridges, setBridges] = useState<Bridge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/connector/bridges')
      .then((r) => r.json())
      .then(setBridges)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (type: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/connector/bridges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          enabled,
          config: bridges.find((b) => b.type === type)?.config || { port: type === 'OPC_UA_SERVER' ? 4841 : 5020 },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBridges((prev) => prev.filter((b) => b.type !== type).concat([data]));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePortChange = async (type: string, port: number) => {
    const bridge = bridges.find((b) => b.type === type);
    const config = { ...(bridge?.config as Record<string, unknown> || {}), port };
    try {
      const res = await fetch(`/api/connector/bridges/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (res.ok) {
        const data = await res.json();
        setBridges((prev) => prev.filter((b) => b.type !== type).concat([data]));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const opcuaBridge = bridges.find((b) => b.type === 'OPC_UA_SERVER');
  const modbusBridge = bridges.find((b) => b.type === 'MODBUS_SLAVE');

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>OPC UA Server Bridge</CardTitle>
          <p className="text-sm text-slate-500 mt-1">Expose MQTT data as OPC UA nodes for external clients</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Enabled</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={opcuaBridge?.enabled ?? false}
                onChange={(e) => handleToggle('OPC_UA_SERVER', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600" />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
            <input
              type="number"
              value={Number((opcuaBridge?.config as Record<string, unknown>)?.port) || 4841}
              onChange={(e) => handlePortChange('OPC_UA_SERVER', parseInt(e.target.value) || 4841)}
              className="w-32 border border-slate-300 rounded-lg p-2"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modbus Slave Bridge</CardTitle>
          <p className="text-sm text-slate-500 mt-1">Expose MQTT data as Modbus registers for legacy clients</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Enabled</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={modbusBridge?.enabled ?? false}
                onChange={(e) => handleToggle('MODBUS_SLAVE', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600" />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
            <input
              type="number"
              value={Number((modbusBridge?.config as Record<string, unknown>)?.port) || 5020}
              onChange={(e) => handlePortChange('MODBUS_SLAVE', parseInt(e.target.value) || 5020)}
              className="w-32 border border-slate-300 rounded-lg p-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
