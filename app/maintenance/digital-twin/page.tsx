'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Settings2, Activity, Thermometer, Gauge, Droplets, RefreshCw, Box, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock OPC UA Tag Discovery
const mockDiscoveredTags = [
  { nodeId: 'ns=2;s=Reactor101.Temperature', name: 'Temperature', type: 'Float', value: 85.2, unit: '°C' },
  { nodeId: 'ns=2;s=Reactor101.Pressure', name: 'Pressure', type: 'Float', value: 2.1, unit: 'bar' },
  { nodeId: 'ns=2;s=Reactor101.Level', name: 'Level', type: 'Float', value: 65.4, unit: '%' },
  { nodeId: 'ns=2;s=Reactor101.AgitatorSpeed', name: 'Agitator Speed', type: 'Int32', value: 150, unit: 'RPM' },
  { nodeId: 'ns=2;s=Reactor101.Status', name: 'Status', type: 'Boolean', value: true, unit: '' },
];

export default function DigitalTwinPage() {
  const [selectedAsset, setSelectedAsset] = useState('Reactor 101');
  const [tags, setTags] = useState(mockDiscoveredTags);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const handleDiscover = () => {
    setIsDiscovering(true);
    setTimeout(() => {
      setIsDiscovering(false);
      // Simulate finding new tags
      setTags(prev => [
        ...prev,
        { nodeId: `ns=2;s=${selectedAsset.replace(' ', '')}.Vibration`, name: 'Vibration', type: 'Float', value: 0.05, unit: 'mm/s' }
      ]);
    }, 2000);
  };

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTags(prev => prev.map(tag => {
        if (tag.type === 'Float' || tag.type === 'Int32') {
          const variation = (Math.random() * 2 - 1) * (tag.value * 0.02); // 2% variation
          return { ...tag, value: Number((tag.value + variation).toFixed(2)) };
        }
        return tag;
      }));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Box className="text-teal-600" size={24} />
            Asset Digital Twins
          </h1>
          <p className="text-sm text-slate-500 mt-1">Auto-generated virtual representations from OPC UA tags.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="Reactor 101">Reactor 101</option>
            <option value="Mixer 201">Mixer 201</option>
            <option value="Conveyor A">Conveyor A</option>
          </select>
          <button 
            onClick={handleDiscover}
            disabled={isDiscovering}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            <RefreshCw size={16} className={cn(isDiscovering && "animate-spin")} />
            {isDiscovering ? 'Discovering Tags...' : 'Discover OPC Tags'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D / Visual Twin Representation */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Virtual Model: {selectedAsset}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center bg-slate-900 border-t border-slate-800 min-h-[500px] relative rounded-b-xl overflow-hidden">
            {/* Simulated 3D Environment grid */}
            <div className="absolute inset-0 opacity-20" 
                 style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>
            
            {/* Abstract 3D shape representing the asset */}
            <div className="relative w-64 h-80 border-2 border-teal-500/50 rounded-b-full rounded-t-lg bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-end shadow-[0_0_50px_rgba(20,184,166,0.15)] z-10">
              {/* Level indicator */}
              <div 
                className="w-full bg-teal-500/20 transition-all duration-1000 ease-in-out absolute bottom-0 border-t border-teal-500/50"
                style={{ height: `${tags.find(t => t.name === 'Level')?.value || 0}%` }}
              >
                <div className="w-full h-1 bg-teal-400/50 animate-pulse"></div>
              </div>
              
              {/* Agitator */}
              <div className="absolute top-0 w-1 h-full bg-slate-600 z-10"></div>
              <div className="absolute top-1/2 w-40 h-2 bg-slate-500 z-10 rounded-full animate-spin" style={{ animationDuration: `${60 / (tags.find(t => t.name === 'Agitator Speed')?.value || 60)}s` }}></div>
              
              {/* Data Overlays directly on the "3D" model */}
              <div className="absolute -left-32 top-1/4 bg-slate-800/80 backdrop-blur border border-slate-700 px-3 py-2 rounded-lg shadow-xl text-xs font-mono text-slate-300 z-20 flex items-center gap-2">
                <Thermometer size={14} className="text-orange-400" />
                <span>{tags.find(t => t.name === 'Temperature')?.value.toFixed(1)} °C</span>
                {/* Connection line */}
                <div className="absolute top-1/2 -right-12 w-12 h-px bg-slate-600"></div>
              </div>

              <div className="absolute -right-32 top-1/3 bg-slate-800/80 backdrop-blur border border-slate-700 px-3 py-2 rounded-lg shadow-xl text-xs font-mono text-slate-300 z-20 flex items-center gap-2">
                <Gauge size={14} className="text-blue-400" />
                <span>{tags.find(t => t.name === 'Pressure')?.value.toFixed(2)} bar</span>
                {/* Connection line */}
                <div className="absolute top-1/2 -left-12 w-12 h-px bg-slate-600"></div>
              </div>
            </div>

            {/* Status indicator */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-800/80 backdrop-blur border border-slate-700 px-3 py-1.5 rounded-full z-20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-medium text-slate-300">Twin Synced</span>
            </div>
          </CardContent>
        </Card>

        {/* OPC UA Tag Mapping */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="text-slate-500" size={18} />
              OPC UA Tag Mapping
            </CardTitle>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {tags.map((tag, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-800 text-sm">{tag.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                    {tag.type}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mb-2 truncate" title={tag.nodeId}>
                  {tag.nodeId}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-xl font-bold font-mono text-slate-900">
                      {typeof tag.value === 'number' ? tag.value.toFixed(tag.type === 'Int32' ? 0 : 2) : String(tag.value)}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">{tag.unit}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Live</span>
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
