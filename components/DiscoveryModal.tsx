'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Search, Loader2, Check } from 'lucide-react';

type BrowseNode = {
  nodeId: string;
  browseName: string;
  nodeClass: string;
  dataType?: string;
  children?: BrowseNode[];
};

type ModbusRegister = {
  address: number;
  type: string;
  values: number[];
  sourceId: string;
};

export function DiscoveryModal({
  onClose,
  onTagsAdded,
  endpointId,
}: {
  onClose: () => void;
  onTagsAdded: () => void;
  endpointId?: string;
}) {
  const [mode, setMode] = useState<'opcua' | 'modbus'>('opcua');
  const [loading, setLoading] = useState(false);
  const [opcuaEndpoint, setOpcuaEndpoint] = useState('opc.tcp://localhost:4840');
  const [opcuaNodes, setOpcuaNodes] = useState<BrowseNode[]>([]);
  const [modbusHost, setModbusHost] = useState('localhost');
  const [modbusPort, setModbusPort] = useState(502);
  const [modbusRegisters, setModbusRegisters] = useState<ModbusRegister[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [selectedRegisters, setSelectedRegisters] = useState<Set<string>>(new Set());

  const runOpcUaDiscovery = async () => {
    setLoading(true);
    setOpcuaNodes([]);
    setSelectedNodes(new Set());
    try {
      const res = await fetch('/api/connector/discover/opcua', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: opcuaEndpoint, maxDepth: 2 }),
      });
      if (res.ok) {
        const data = await res.json();
        setOpcuaNodes(data.nodes || []);
      } else {
        const err = await res.json();
        alert(err.error || 'Discovery failed');
      }
    } catch (err) {
      console.error(err);
      alert('Discovery failed');
    } finally {
      setLoading(false);
    }
  };

  const runModbusDiscovery = async () => {
    setLoading(true);
    setModbusRegisters([]);
    setSelectedRegisters(new Set());
    try {
      const res = await fetch('/api/connector/discover/modbus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: modbusHost, port: modbusPort, count: 100 }),
      });
      if (res.ok) {
        const data = await res.json();
        setModbusRegisters(data.registers || []);
      } else {
        const err = await res.json();
        alert(err.error || 'Discovery failed');
      }
    } catch (err) {
      console.error(err);
      alert('Discovery failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    const next = new Set(selectedNodes);
    if (next.has(nodeId)) next.delete(nodeId);
    else next.add(nodeId);
    setSelectedNodes(next);
  };

  const toggleRegister = (sourceId: string) => {
    const next = new Set(selectedRegisters);
    if (next.has(sourceId)) next.delete(sourceId);
    else next.add(sourceId);
    setSelectedRegisters(next);
  };

  const addSelectedTags = async () => {
    if (!endpointId) {
      alert('Select an endpoint first to add tags');
      return;
    }
    const toAdd: Array<{ sourceId: string; name: string }> = [];
    if (mode === 'opcua') {
      const collect = (nodes: BrowseNode[]) => {
        for (const n of nodes) {
          if (selectedNodes.has(n.nodeId) && n.nodeClass === 'Variable') {
            toAdd.push({ sourceId: n.nodeId, name: n.browseName });
          }
          if (n.children) collect(n.children);
        }
      };
      collect(opcuaNodes);
    } else {
      for (const sid of selectedRegisters) {
        const reg = modbusRegisters.find((r) => r.sourceId === sid);
        if (reg) toAdd.push({ sourceId: sid, name: `Reg_${reg.address}_${reg.type}` });
      }
    }
    for (const tag of toAdd) {
      await fetch(`/api/connector/endpoints/${endpointId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: tag.sourceId,
          name: tag.name,
          mqttTopic: `plant/{site}/{equipment}/${tag.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        }),
      });
    }
    onTagsAdded();
    onClose();
  };

  const renderNodes = (nodes: BrowseNode[], depth = 0) => (
    <div className={depth > 0 ? 'ml-4 border-l border-slate-200 pl-2' : ''}>
      {nodes.map((n) => (
        <div key={n.nodeId} className="py-1">
          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-1">
            <input
              type="checkbox"
              checked={selectedNodes.has(n.nodeId)}
              onChange={() => n.nodeClass === 'Variable' && toggleNode(n.nodeId)}
              disabled={n.nodeClass !== 'Variable'}
            />
            <span className="text-sm font-mono">{n.browseName}</span>
            <span className="text-xs text-slate-500">({n.nodeClass})</span>
          </label>
          {n.children && n.children.length > 0 && renderNodes(n.children, depth + 1)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search size={20} />
            Discover Tags
          </CardTitle>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            Close
          </button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setMode('opcua')}
              className={`px-4 py-2 rounded-lg font-medium ${mode === 'opcua' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              OPC UA
            </button>
            <button
              onClick={() => setMode('modbus')}
              className={`px-4 py-2 rounded-lg font-medium ${mode === 'modbus' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Modbus
            </button>
          </div>

          {mode === 'opcua' && (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={opcuaEndpoint}
                  onChange={(e) => setOpcuaEndpoint(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg p-2 font-mono text-sm"
                  placeholder="opc.tcp://host:4840"
                />
                <button
                  onClick={runOpcUaDiscovery}
                  disabled={loading}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  Browse
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3">
                {opcuaNodes.length > 0 ? renderNodes(opcuaNodes) : <div className="text-slate-500 text-sm">Run discovery to browse nodes</div>}
              </div>
            </>
          )}

          {mode === 'modbus' && (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={modbusHost}
                  onChange={(e) => setModbusHost(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg p-2"
                  placeholder="Host"
                />
                <input
                  type="number"
                  value={modbusPort}
                  onChange={(e) => setModbusPort(parseInt(e.target.value) || 502)}
                  className="w-24 border border-slate-300 rounded-lg p-2"
                />
                <button
                  onClick={runModbusDiscovery}
                  disabled={loading}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  Scan
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3">
                {modbusRegisters.length > 0 ? (
                  <div className="space-y-2">
                    {modbusRegisters.map((r) => (
                      <label key={r.sourceId} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-2 py-1">
                        <input
                          type="checkbox"
                          checked={selectedRegisters.has(r.sourceId)}
                          onChange={() => toggleRegister(r.sourceId)}
                        />
                        <span className="font-mono text-sm">{r.sourceId}</span>
                        <span className="text-xs text-slate-500">addr={r.address} type={r.type}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 text-sm">Run scan to find registers</div>
                )}
              </div>
            </>
          )}

          {endpointId && (selectedNodes.size > 0 || selectedRegisters.size > 0) && (
            <button
              onClick={addSelectedTags}
              className="w-full py-2 bg-teal-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Add {selectedNodes.size || selectedRegisters.size} Selected to Endpoint
            </button>
          )}
          {!endpointId && (
            <p className="text-sm text-amber-600">Select an endpoint in the sidebar to add discovered tags.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
