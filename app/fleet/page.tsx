'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Search, Filter, Server, Activity, RefreshCw, Settings, AlertCircle, CheckCircle2, Cpu, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockFleet = [
  { id: 'edge-ny-01', plant: 'Plant Alpha (NY)', status: 'online', lastSync: 'Just now', cpu: 45, ram: 120, totalRam: 150, uptime: '45d 12h', version: 'v2.1.4' },
  { id: 'edge-ny-02', plant: 'Plant Alpha (NY)', status: 'online', lastSync: 'Just now', cpu: 32, ram: 95, totalRam: 150, uptime: '45d 12h', version: 'v2.1.4' },
  { id: 'edge-tx-01', plant: 'Plant Beta (TX)', status: 'warning', lastSync: '2 mins ago', cpu: 88, ram: 145, totalRam: 150, uptime: '12d 4h', version: 'v2.1.3' },
  { id: 'edge-ca-01', plant: 'Plant Gamma (CA)', status: 'offline', lastSync: '4 hours ago', cpu: 0, ram: 0, totalRam: 150, uptime: '0d 0h', version: 'v2.1.4' },
];

export default function FleetPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFleet = mockFleet.filter(f => 
    f.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.plant.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edge Fleet Management</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor and manage MonsterMQ Edge devices across all plants.</p>
        </div>
        <button className="inline-flex items-center justify-center px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors shadow-sm">
          <Server size={18} className="mr-2" />
          Provision New Edge
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Online Nodes</p>
              <p className="text-2xl font-bold text-slate-800">2 <span className="text-sm font-normal text-slate-500">/ 4</span></p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Activity className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">High Load (Warning)</p>
              <p className="text-2xl font-bold text-slate-800">1</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Offline Nodes</p>
              <p className="text-2xl font-bold text-slate-800">1</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Node ID or Plant..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter size={16} className="mr-2" />
              Filter
            </button>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors" title="Refresh Status">
              <RefreshCw size={18} />
            </button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Node ID</th>
                <th className="px-6 py-3 font-medium">Plant / Location</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Metrics (CPU / RAM)</th>
                <th className="px-6 py-3 font-medium">Last Sync</th>
                <th className="px-6 py-3 font-medium">Version</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFleet.length > 0 ? (
                filteredFleet.map((node) => (
                  <tr key={node.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 font-mono flex items-center gap-2">
                      <Server size={16} className="text-slate-400" />
                      {node.id}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{node.plant}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                        node.status === 'online' ? "bg-emerald-100 text-emerald-700" :
                        node.status === 'warning' ? "bg-amber-100 text-amber-700" :
                        "bg-rose-100 text-rose-700"
                      )}>
                        {node.status === 'online' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />}
                        {node.status === 'warning' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />}
                        {node.status === 'offline' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />}
                        {node.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {node.status !== 'offline' ? (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5" title={`CPU: ${node.cpu}%`}>
                            <Cpu size={14} className={node.cpu > 80 ? "text-rose-500" : "text-slate-400"} />
                            <span className={cn("text-xs font-mono", node.cpu > 80 ? "text-rose-600 font-bold" : "text-slate-600")}>{node.cpu}%</span>
                          </div>
                          <div className="flex items-center gap-1.5" title={`RAM: ${node.ram}MB / ${node.totalRam}MB`}>
                            <HardDrive size={14} className={node.ram > node.totalRam * 0.9 ? "text-amber-500" : "text-slate-400"} />
                            <span className={cn("text-xs font-mono", node.ram > node.totalRam * 0.9 ? "text-amber-600 font-bold" : "text-slate-600")}>
                              {node.ram}MB
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Unavailable</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{node.lastSync}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{node.version}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors" title="Configure">
                          <Settings size={16} />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Restart Node">
                          <RefreshCw size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-8 w-8 text-slate-300 mb-3" />
                      <p className="text-base font-medium text-slate-900">No edge nodes found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
