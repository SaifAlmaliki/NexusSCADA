'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Activity, Thermometer, Droplets, Gauge, Settings2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [selectedUnit, setSelectedUnit] = useState('R-101');
  const { tags, wsStatus } = useLiveTags(selectedUnit);
  const [setpoints, setSetpoints] = useState<Record<string, string>>({});
  const [savedSetpoints, setSavedSetpoints] = useState<Record<string, number>>({});
  const [spStatus, setSpStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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

  const applySetpoint = async (id: string) => {
    const val = setpoints[id];
    if (!val) return;
    const tag = tags.find(t => t.id === id);
    if (!tag) return;
    if (!confirm(`Apply setpoint for ${tag.name} (${id}) to ${val} ${tag.unit}?`)) return;

    setSpStatus('saving');
    try {
      const res = await fetch('/api/scada/setpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: selectedUnit, tagId: id, value: parseFloat(val) })
      });
      if (res.ok) {
        const numVal = parseFloat(val);
        setSavedSetpoints(prev => ({ ...prev, [id]: numVal }));
        setSetpoints(prev => ({ ...prev, [id]: '' }));
        setSpStatus('saved');
        setTimeout(() => setSpStatus('idle'), 2000);
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
            <option value="R-101">Reactor 101</option>
            <option value="R-102">Reactor 102</option>
            <option value="D-201">Distillation 201</option>
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
          <CardContent className="flex items-center justify-center bg-slate-50 border-t border-slate-100 min-h-[400px] relative">
            {/* Simple SVG Mimic representation */}
            <div className="relative w-64 h-80 border-4 border-slate-400 rounded-b-full rounded-t-lg bg-slate-100 flex flex-col items-center justify-end overflow-hidden shadow-inner">
              {/* Level indicator */}
              <div 
                className="w-full bg-teal-200/50 transition-all duration-1000 ease-in-out absolute bottom-0"
                style={{ height: `${tags.find(t => t.type === 'level')?.value || 0}%` }}
              >
                <div className="w-full h-2 bg-teal-400/50 animate-pulse"></div>
              </div>
              
              {/* Agitator */}
              <div className="absolute top-0 w-2 h-full bg-slate-400 z-10"></div>
              <div className="absolute top-1/2 w-32 h-4 bg-slate-500 z-10 rounded-full animate-spin" style={{ animationDuration: `${60 / (tags.find(t => t.type === 'speed')?.value || 60)}s` }}></div>
              <div className="absolute top-3/4 w-32 h-4 bg-slate-500 z-10 rounded-full animate-spin" style={{ animationDuration: `${60 / (tags.find(t => t.type === 'speed')?.value || 60)}s` }}></div>
              
              {/* Values overlay */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-2 py-1 rounded shadow-sm text-xs font-mono font-bold text-slate-700 z-20 border border-slate-200">
                {tags.find(t => t.type === 'temp')?.value.toFixed(1)} °C
              </div>
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded shadow-sm text-xs font-mono font-bold text-slate-700 z-20 border border-slate-200">
                {tags.find(t => t.type === 'pressure')?.value.toFixed(2)} bar
              </div>
            </div>
            
            {/* Pipes and valves (simplified) */}
            <div className="absolute top-10 left-10 flex items-center">
              <div className="w-24 h-4 bg-slate-300 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-10 bg-emerald-500 rounded-sm flex items-center justify-center shadow-sm">
                  <div className="w-4 h-1 bg-white"></div>
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur px-2 py-1 rounded shadow-sm text-xs font-mono font-bold text-slate-700 ml-2 border border-slate-200">
                {tags.find(t => t.type === 'flow')?.value.toFixed(1)} L/h
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Tags List */}
        <Card>
          <CardHeader>
            <CardTitle>Live Tags</CardTitle>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {tagsWithSp.map(tag => (
              <div key={tag.id} className="p-4 hover:bg-slate-50 transition-colors">
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
                    <span className="text-2xl font-bold font-mono text-slate-900">{tag.value.toFixed(1)}</span>
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
                        onClick={() => applySetpoint(tag.id)}
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
    </div>
  );
}
