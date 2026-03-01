'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Activity, Thermometer, Droplets, Gauge, Settings2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tag = { id: string; name: string; value: number; unit: string; sp: number; quality: string; type: string };

function SetpointConfirmModal({
  tag,
  newValue,
  unitId,
  onConfirm,
  onCancel
}: {
  tag: Tag;
  newValue: string;
  unitId: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Gauge size={18} className="text-teal-600" />
            Confirm Setpoint Change
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-600">
            You are about to change the setpoint for <strong>{tag.name}</strong> on <strong>{unitId}</strong>.
          </p>
          <div className="bg-slate-50 rounded-lg p-3 font-mono text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Current setpoint:</span>
              <span>{tag.sp} {tag.unit}</span>
            </div>
            <div className="flex justify-between font-semibold text-teal-700 mt-1">
              <span>New setpoint:</span>
              <span>{newValue} {tag.unit}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 flex items-start gap-2">
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            This value will be saved to the database and used as the target for process control.
          </p>
        </div>
        <div className="p-4 flex justify-end gap-2 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            Apply Setpoint
          </button>
        </div>
      </div>
    </div>
  );
}

// Mock hook for live data with WebSocket demonstration
function useLiveTags(unitId: string) {
  const [tags, setTags] = useState([
    { id: 'T101', name: 'Reactor Temp', value: 85.2, unit: '°C', sp: 85.0, quality: 'good', type: 'temp' },
    { id: 'P101', name: 'Reactor Pressure', value: 2.1, unit: 'bar', sp: 2.0, quality: 'good', type: 'pressure' },
    { id: 'L101', name: 'Level', value: 65.4, unit: '%', sp: 65.0, quality: 'good', type: 'level' },
    { id: 'F101', name: 'Feed Flow', value: 120.5, unit: 'L/h', sp: 120.0, quality: 'good', type: 'flow' },
    { id: 'S101', name: 'Agitator Speed', value: 150, unit: 'RPM', sp: 150, quality: 'good', type: 'speed' },
  ]);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'mock'>('connecting');

  useEffect(() => {
    // 1. Attempt to connect to a real WebSocket server
    // In a real environment, this would be your Bun/MonsterMQ WS endpoint
    const wsUrl = process.env.NEXT_PUBLIC_MQTT_WS_URL || `wss://api.nexus-corp.internal/ws/scada/${unitId}`;
    let ws: WebSocket | null = null;
    let mockInterval: NodeJS.Timeout;

    try {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setWsStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Expecting data format: { tagId: string, value: number, quality: string }
          setTags(prev => prev.map(t => 
            t.id === data.tagId 
              ? { ...t, value: data.value, quality: data.quality }
              : t
          ));
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      ws.onerror = () => {
        // Fallback to mock data if WS fails (which it will in this preview)
        setWsStatus('mock');
      };
      
      ws.onclose = () => {
        setWsStatus(prev => prev !== 'mock' ? 'connecting' : prev);
      };
    } catch (e) {
      // Ignore synchronous error, let the interval handle mock fallback
    }

    // 2. Fallback Mock Data Generator (runs if WS is not connected)
    mockInterval = setInterval(() => {
      setWsStatus(currentStatus => {
        if (currentStatus === 'mock' || !ws || ws.readyState !== WebSocket.OPEN) {
          setTags(prev => prev.map(tag => ({
            ...tag,
            value: Number((tag.value + (Math.random() * 2 - 1) * 0.5).toFixed(1))
          })));
          return 'mock';
        }
        return currentStatus;
      });
    }, 2000);

    return () => {
      if (ws) ws.close();
      clearInterval(mockInterval);
    };
  }, [unitId, wsStatus]);

  return { tags, wsStatus };
}

export default function RealTimePage() {
  const [units, setUnits] = useState<Array<{ id: string; name: string }>>([
    { id: 'reactor1', name: 'Reactor 101' },
    { id: 'R-102', name: 'Reactor 102' },
    { id: 'D-201', name: 'Distillation 201' },
  ]);
  const [selectedUnit, setSelectedUnit] = useState('reactor1');
  const { tags, wsStatus } = useLiveTags(selectedUnit);

  useEffect(() => {
    fetch('/api/connector/config')
      .then((r) => r.json())
      .then((data) => {
        const equipmentNames = new Map<string, string>();
        for (const ep of data.endpoints || []) {
          const eq = ep.hierarchy?.equipmentName;
          if (eq) {
            const slug = eq.toLowerCase().replace(/[^a-z0-9]/g, '_');
            equipmentNames.set(slug, eq);
          }
        }
        if (equipmentNames.size > 0) {
          setUnits(Array.from(equipmentNames.entries()).map(([id, name]) => ({ id, name })));
          setSelectedUnit((prev) => (equipmentNames.has(prev) ? prev : Array.from(equipmentNames.keys())[0]));
        }
      })
      .catch(() => {});
  }, []);
  const [setpoints, setSetpoints] = useState<Record<string, string>>({});
  const [savedSetpoints, setSavedSetpoints] = useState<Record<string, number>>({});
  const [spStatus, setSpStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [confirmModal, setConfirmModal] = useState<{ tag: Tag; value: string } | null>(null);
  const [lastChangedTag, setLastChangedTag] = useState<string | null>(null);
  const prevTagsRef = useRef<typeof tags>([]);

  // Load persisted setpoints from database when unit changes
  useEffect(() => {
    fetch(`/api/scada/setpoints?unitId=${selectedUnit}`)
      .then(res => res.ok ? res.json() : {})
      .then(data => setSavedSetpoints(data))
      .catch(() => setSavedSetpoints({}));
  }, [selectedUnit]);

  const handleSpChange = (id: string, value: string) => {
    setSetpoints(prev => ({ ...prev, [id]: value }));
  };

  const openConfirm = (id: string) => {
    const val = setpoints[id];
    if (!val) return;
    const tag = tagsWithSp.find(t => t.id === id);
    if (!tag) return;
    setConfirmModal({ tag, value: val });
  };

  const applySetpoint = async () => {
    if (!confirmModal) return;
    const { tag, value: val } = confirmModal;
    setConfirmModal(null);
    setSpStatus('saving');
    const numVal = parseFloat(val);
    try {
      const res = await fetch('/api/scada/setpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: selectedUnit, tagId: tag.id, value: numVal })
      });
      if (res.ok) {
        setSavedSetpoints(prev => ({ ...prev, [tag.id]: numVal }));
        setSetpoints(prev => ({ ...prev, [tag.id]: '' }));
        setLastChangedTag(tag.id);
        setTimeout(() => setLastChangedTag(null), 1500);
        setSpStatus('saved');
        setTimeout(() => setSpStatus('idle'), 2000);
        // Publish write command to MQTT for connector to write to PLC
        fetch('/api/connector/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unitId: selectedUnit, tagId: tag.id, value: numVal })
        }).catch(() => {});
      } else {
        setSpStatus('error');
        alert('Failed to save setpoint. Please try again.');
        setTimeout(() => setSpStatus('idle'), 2000);
      }
    } catch {
      setSpStatus('error');
      alert('Failed to save setpoint. Please try again.');
      setTimeout(() => setSpStatus('idle'), 2000);
    }
  };

  // Merge saved setpoints into tags for display
  const tagsWithSp = tags.map(t => ({
    ...t,
    sp: savedSetpoints[t.id] ?? t.sp
  }));

  // Track value changes for animation
  useEffect(() => {
    tags.forEach(t => {
      const prev = prevTagsRef.current.find(p => p.id === t.id);
      if (prev && Math.abs(prev.value - t.value) > 0.01) {
        setLastChangedTag(t.id);
        setTimeout(() => setLastChangedTag(null), 800);
      }
    });
    prevTagsRef.current = [...tags];
  }, [tags]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'temp': return <Thermometer className="text-orange-500" size={20} />;
      case 'pressure': return <Gauge className="text-blue-500" size={20} />;
      case 'level': return <Droplets className="text-teal-500" size={20} />;
      case 'flow': return <Activity className="text-indigo-500" size={20} />;
      case 'speed': return <Settings2 className="text-slate-500" size={20} />;
      default: return <Activity className="text-slate-500" size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            Real-Time SCADA
            <span className={cn(
              "text-xs px-2 py-1 rounded-full font-medium flex items-center",
              wsStatus === 'connected' ? "bg-emerald-100 text-emerald-700" :
              wsStatus === 'mock' ? "bg-amber-100 text-amber-700" :
              "bg-slate-100 text-slate-600"
            )}>
              {wsStatus === 'connected' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />}
              {wsStatus === 'mock' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />}
              {wsStatus === 'connecting' && <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5 animate-pulse" />}
              {wsStatus === 'connected' ? 'Live (WS)' : wsStatus === 'mock' ? 'Mock Data' : 'Connecting...'}
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Live monitoring and control of production units. The mimic updates in real time with tag values (level, temp, pressure, flow, agitator). Setpoints are saved to the database.
          </p>
          {spStatus === 'saved' && (
            <span className="text-xs text-emerald-600 font-medium mt-1 block">Setpoint saved to database</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Select Unit:</label>
          <select 
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mimic Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedUnit} Mimic
              <span className="text-xs font-normal text-slate-500">(live values)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 border-t border-slate-100 min-h-[400px] relative">
            {/* Interactive Mimic */}
            <div className="relative w-64 h-80 border-4 border-slate-400 rounded-b-full rounded-t-lg bg-slate-100 flex flex-col items-center justify-end overflow-hidden shadow-inner ring-2 ring-slate-200/50 transition-shadow hover:ring-teal-200/50">
              {/* Level indicator - animated fill */}
              <div 
                className={cn(
                  "w-full bg-gradient-to-t from-teal-400/80 to-teal-300/60 transition-all duration-700 ease-out absolute bottom-0",
                  lastChangedTag === 'L101' && "animate-pulse"
                )}
                style={{ height: `${Math.min(100, Math.max(0, tags.find(t => t.type === 'level')?.value || 0))}%` }}
                title="Level - updates with live tag value"
              >
                <div className="w-full h-2 bg-teal-400/70 animate-pulse" />
              </div>
              
              {/* Agitator - speed affects rotation */}
              <div className="absolute top-0 w-2 h-full bg-slate-400 z-10" title="Agitator" />
              <div 
                className={cn(
                  "absolute top-1/2 w-32 h-4 bg-slate-500 z-10 rounded-full",
                  lastChangedTag === 'S101' && "ring-2 ring-teal-400"
                )}
                style={{
                  animation: `spin ${60 / (tags.find(t => t.type === 'speed')?.value || 60)}s linear infinite`
                }}
              />
              <div 
                className="absolute top-3/4 w-32 h-4 bg-slate-600/80 z-10 rounded-full"
                style={{
                  animation: `spin ${(60 / (tags.find(t => t.type === 'speed')?.value || 60)) * 1.2}s linear infinite reverse`
                }}
              />
              
              {/* Values overlay - pulse when changed */}
              <div 
                className={cn(
                  "absolute top-4 left-4 bg-white/95 backdrop-blur px-2 py-1 rounded shadow-sm text-xs font-mono font-bold text-slate-700 z-20 border border-slate-200 transition-all",
                  lastChangedTag === 'T101' && "ring-2 ring-orange-400 scale-105"
                )}
                title="Reactor Temperature"
              >
                {tags.find(t => t.type === 'temp')?.value.toFixed(1)} °C
              </div>
              <div 
                className={cn(
                  "absolute top-4 right-4 bg-white/95 backdrop-blur px-2 py-1 rounded shadow-sm text-xs font-mono font-bold text-slate-700 z-20 border border-slate-200 transition-all",
                  lastChangedTag === 'P101' && "ring-2 ring-blue-400 scale-105"
                )}
                title="Reactor Pressure"
              >
                {tags.find(t => t.type === 'pressure')?.value.toFixed(2)} bar
              </div>
            </div>
            
            {/* Feed flow - interactive slider in mock mode */}
            <div className="absolute top-10 left-10 flex flex-col gap-2" title="Feed Flow - simulated control">
              <div className="w-24 h-4 bg-slate-300 rounded relative overflow-hidden group">
                <div 
                  className="absolute inset-0 bg-emerald-500/30 transition-all"
                  style={{ width: `${Math.min(100, (tags.find(t => t.type === 'flow')?.value || 0) / 150 * 100)}%` }}
                />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-10 bg-emerald-500 rounded-sm flex items-center justify-center shadow-sm group-hover:bg-emerald-600 transition-colors">
                  <div className="w-4 h-1 bg-white" />
                </div>
              </div>
              <div className={cn(
                "bg-white/95 backdrop-blur px-2 py-1 rounded shadow-sm text-xs font-mono font-bold text-slate-700 border border-slate-200 transition-all",
                lastChangedTag === 'F101' && "ring-2 ring-indigo-400"
              )}>
                {tags.find(t => t.type === 'flow')?.value.toFixed(1)} L/h
              </div>
            </div>
            
            {/* Mock mode badge */}
            {wsStatus === 'mock' && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-100/90 text-amber-800 text-xs font-medium rounded-full border border-amber-200">
                Simulated data • Values drift randomly
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Tags List */}
        <Card>
          <CardHeader>
            <CardTitle>Live Tags</CardTitle>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {tagsWithSp.map(tag => (
              <div 
                key={tag.id} 
                className={cn(
                  "p-4 hover:bg-slate-50 transition-all duration-300",
                  lastChangedTag === tag.id && "bg-teal-50/70 ring-1 ring-teal-200 rounded-lg"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getIcon(tag.type)}
                    <span className="font-medium text-slate-800 text-sm">{tag.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {tag.quality === 'good' ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <AlertTriangle size={14} className="text-amber-500" />
                    )}
                  </div>
                </div>
                
                <div className="flex items-end justify-between">
                  <div>
                    <span className={cn(
                      "text-2xl font-bold font-mono text-slate-900 transition-all",
                      lastChangedTag === tag.id && "text-teal-700"
                    )}>
                      {tag.value.toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-500 ml-1">{tag.unit}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 mb-1">SP: {tag.sp} {tag.unit}</div>
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" 
                        className="w-16 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-teal-500"
                        placeholder="New SP"
                        value={setpoints[tag.id] || ''}
                        onChange={(e) => handleSpChange(tag.id, e.target.value)}
                      />
                      <button 
                        onClick={() => openConfirm(tag.id)}
                        disabled={!setpoints[tag.id] || spStatus === 'saving'}
                        className="px-2 py-1 bg-slate-800 text-white text-xs rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {spStatus === 'saving' ? 'Saving...' : 'Set'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {confirmModal && (
        <SetpointConfirmModal
          tag={confirmModal.tag}
          newValue={confirmModal.value}
          unitId={selectedUnit}
          onConfirm={() => applySetpoint()}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
