'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/Card';
import { Search, Filter, AlertTriangle, CheckCircle2, Download, RotateCcw } from 'lucide-react';
import { cn } from '@/components/Sidebar';

const mockAlarms = [
  { id: 'ALM-001', priority: 'critical', tag: 'R101_TEMP_HI', desc: 'Reactor 101 Temperature High High', unit: 'Reactor 101', time: '2023-10-25 10:42:15', acked: false },
  { id: 'ALM-002', priority: 'high', tag: 'PUMP_2A_FAIL', desc: 'Feed Pump 2A Failure', unit: 'Pump Station 2', time: '2023-10-25 10:35:00', acked: true },
  { id: 'ALM-003', priority: 'medium', tag: 'LVL_LOW_T10', desc: 'Tank 10 Level Low Warning', unit: 'Tank 10', time: '2023-10-25 09:15:22', acked: false },
  { id: 'ALM-004', priority: 'low', tag: 'COMM_ERR_PLC1', desc: 'PLC 1 Communication Timeout', unit: 'Control Room', time: '2023-10-25 08:00:00', acked: true },
  { id: 'ALM-005', priority: 'critical', tag: 'PR_HI_D201', desc: 'Distillation Column 201 Pressure High', unit: 'Distillation 201', time: '2023-10-24 23:45:10', acked: true },
];

export default function AlarmsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAlarms = mockAlarms.filter(a => 
    (activeTab === 'active' ? !a.acked || a.priority === 'critical' : true) &&
    (a.tag.toLowerCase().includes(searchTerm.toLowerCase()) || 
     a.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
     a.unit.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Alarm Management</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor, acknowledge, and review system alarms.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Download size={18} className="mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      <Card>
        <div className="border-b border-slate-200">
          <nav className="flex -mb-px px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('active')}
              className={cn(
                "whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors",
                activeTab === 'active'
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              Active Alarms
              <span className="ml-2 bg-rose-100 text-rose-600 py-0.5 px-2 rounded-full text-xs">3</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors",
                activeTab === 'history'
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              Alarm History
            </button>
          </nav>
        </div>

        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tags, descriptions, units..." 
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
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Priority</th>
                <th className="px-6 py-3 font-medium">Tag</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Unit</th>
                <th className="px-6 py-3 font-medium">Time</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlarms.length > 0 ? (
                filteredAlarms.map((alarm) => (
                  <tr key={alarm.id} className={cn(
                    "border-b border-slate-100 transition-colors",
                    !alarm.acked && alarm.priority === 'critical' ? "bg-rose-50 hover:bg-rose-100" :
                    !alarm.acked && alarm.priority === 'high' ? "bg-orange-50 hover:bg-orange-100" :
                    "hover:bg-slate-50"
                  )}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2.5 h-2.5 rounded-full flex-shrink-0",
                          alarm.priority === 'critical' ? 'bg-rose-500 animate-pulse' :
                          alarm.priority === 'high' ? 'bg-orange-500' : 
                          alarm.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                        )} />
                        <span className={cn(
                          "font-medium capitalize",
                          alarm.priority === 'critical' ? 'text-rose-700' :
                          alarm.priority === 'high' ? 'text-orange-700' : 
                          alarm.priority === 'medium' ? 'text-amber-700' : 'text-blue-700'
                        )}>{alarm.priority}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-900">{alarm.tag}</td>
                    <td className="px-6 py-4 text-slate-600">{alarm.desc}</td>
                    <td className="px-6 py-4 text-slate-600">{alarm.unit}</td>
                    <td className="px-6 py-4 text-slate-600">{alarm.time}</td>
                    <td className="px-6 py-4">
                      {alarm.acked ? (
                        <span className="inline-flex items-center text-emerald-600 text-xs font-medium">
                          <CheckCircle2 size={14} className="mr-1" /> Acked
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-rose-600 text-xs font-medium">
                          <AlertTriangle size={14} className="mr-1" /> Unacked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!alarm.acked && (
                          <button className="px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded hover:bg-slate-700 transition-colors">
                            Acknowledge
                          </button>
                        )}
                        {alarm.acked && activeTab === 'active' && (
                          <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors" title="Reset">
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-3" />
                      <p className="text-base font-medium text-slate-900">No alarms found</p>
                      <p className="text-sm mt-1">All systems are operating normally.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">Showing 1 to {filteredAlarms.length} of {filteredAlarms.length} entries</p>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-200 rounded text-sm text-slate-400 cursor-not-allowed">Previous</button>
            <button className="px-3 py-1 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
